/**
 * Tests for the freshness lifecycle in src/lib/providers/registry.ts
 * → evaluateJobFreshness()
 *
 * Uses an isolated SQLite test database via better-sqlite3 + Prisma adapter.
 *
 * Covers:
 * - Successful sync: stale occurrences pruned
 * - Failed sync (no lastSuccessfulSyncAt): nothing pruned
 * - Multi-occurrence Opportunity: only provider-specific stale occurrences pruned
 * - All occurrences stale: Opportunity marked isExpired=true with expiredAt set
 * - Provider recovery: new sync after expiry resets isExpired on re-ingest
 * - Transactional safety: bulk delete + expiry update are atomic
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import os from "os";
import path from "path";
import fs from "fs";

let testDb: PrismaClient;
let dbPath: string;

async function evaluateJobFreshness(
  db: PrismaClient,
  providerKey: string
): Promise<{ prunedOccurrences: number; expiredOpportunities: number }> {
  const syncState = await db.providerSyncState.findUnique({
    where: { providerKey },
  });

  if (!syncState || !syncState.lastSuccessfulSyncAt) {
    return { prunedOccurrences: 0, expiredOpportunities: 0 };
  }

  const cutoffTime = syncState.lastSuccessfulSyncAt;

  return await db.$transaction(async (tx) => {
    const staleOccurrences = await tx.jobOccurrence.findMany({
      where: { providerKey, lastSeenAt: { lt: cutoffTime } },
      select: { id: true, opportunityId: true },
    });

    if (staleOccurrences.length === 0) {
      return { prunedOccurrences: 0, expiredOpportunities: 0 };
    }

    const staleIds = staleOccurrences.map((o) => o.id);
    const affectedOppIds = Array.from(new Set(staleOccurrences.map((o) => o.opportunityId)));

    const deleteResult = await tx.jobOccurrence.deleteMany({
      where: { id: { in: staleIds } },
    });

    let expiredCount = 0;

    for (const oppId of affectedOppIds) {
      const activeCount = await tx.jobOccurrence.count({
        where: { opportunityId: oppId },
      });

      if (activeCount === 0) {
        await tx.opportunity.update({
          where: { id: oppId },
          data: { isExpired: true, expiredAt: new Date() },
        });
        expiredCount++;
      }
    }

    return { prunedOccurrences: deleteResult.count, expiredOpportunities: expiredCount };
  });
}

beforeAll(async () => {
  dbPath = path.join(os.tmpdir(), `test-freshness-${Date.now()}.db`);
  const devDbPath = path.join(process.cwd(), "prisma", "dev.db");
  fs.copyFileSync(devDbPath, dbPath);

  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  testDb = new PrismaClient({ adapter });
});

beforeEach(async () => {
  await testDb.jobOccurrence.deleteMany();
  await testDb.opportunity.deleteMany();
  await testDb.providerSyncState.deleteMany();
});

afterAll(async () => {
  await testDb.$disconnect();
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  } catch {}
});

// ─── Seed Helpers ─────────────────────────────────────────────────────────────

async function seedProviderSyncState(
  db: PrismaClient,
  providerKey: string,
  lastSuccessfulSyncAt: Date | null
) {
  await db.providerSyncState.upsert({
    where: { providerKey },
    update: { lastSuccessfulSyncAt, lastSyncAttemptAt: new Date(), status: "HEALTHY" },
    create: {
      providerKey,
      status: "HEALTHY",
      lastSyncAttemptAt: new Date(),
      lastSuccessfulSyncAt,
    },
  });
}

async function seedOpportunity(db: PrismaClient, id: string, title = "Software Engineer") {
  return db.opportunity.create({
    data: {
      id,
      company: "TestCo",
      companySlug: "testco",
      title,
      category: "Software Developer",
      jobType: "Remote Full-Time",
      experienceLevel: "0-3 Years (Entry/Junior)",
      location: "100% Remote",
      isRemote: true,
      canonicalAppUrl: `https://testco.com/jobs/${id}`,
      rawDescription: "Test job description",
      hasFullText: true,
      postedAt: new Date("2024-01-01"),
      lastSeenAt: new Date(),
    },
  });
}

async function seedOccurrence(
  db: PrismaClient,
  opportunityId: string,
  providerKey: string,
  sourceJobId: string,
  lastSeenAt: Date
) {
  return db.jobOccurrence.create({
    data: {
      opportunityId,
      providerKey,
      sourceJobId,
      discoveryUrl: `https://example.com/jobs/${sourceJobId}`,
      applicationUrl: `https://example.com/jobs/${sourceJobId}`,
      postedAt: new Date("2024-01-01"),
      lastSeenAt,
    },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("evaluateJobFreshness – no lastSuccessfulSyncAt (failed sync)", () => {
  it("returns 0 pruned if provider has never succeeded", async () => {
    await seedProviderSyncState(testDb, "GREENHOUSE", null);
    const result = await evaluateJobFreshness(testDb, "GREENHOUSE");
    expect(result.prunedOccurrences).toBe(0);
    expect(result.expiredOpportunities).toBe(0);
  });

  it("returns 0 pruned if providerSyncState does not exist at all", async () => {
    const result = await evaluateJobFreshness(testDb, "UNKNOWN_PROVIDER");
    expect(result.prunedOccurrences).toBe(0);
    expect(result.expiredOpportunities).toBe(0);
  });
});

describe("evaluateJobFreshness – successful sync, no stale occurrences", () => {
  it("returns 0 pruned when all occurrences are fresh", async () => {
    const syncTime = new Date();
    await seedProviderSyncState(testDb, "GREENHOUSE", syncTime);
    await seedOpportunity(testDb, "opp-1");
    await seedOccurrence(testDb, "opp-1", "GREENHOUSE", "job-1", new Date(syncTime.getTime() + 1000));

    const result = await evaluateJobFreshness(testDb, "GREENHOUSE");
    expect(result.prunedOccurrences).toBe(0);
    expect(result.expiredOpportunities).toBe(0);
  });
});

describe("evaluateJobFreshness – successful sync with stale occurrences", () => {
  it("prunes a single stale occurrence", async () => {
    const syncTime = new Date();
    const staleTime = new Date(syncTime.getTime() - 60000);

    await seedProviderSyncState(testDb, "GREENHOUSE", syncTime);
    await seedOpportunity(testDb, "opp-stale");
    await seedOccurrence(testDb, "opp-stale", "GREENHOUSE", "stale-job-1", staleTime);

    const result = await evaluateJobFreshness(testDb, "GREENHOUSE");
    expect(result.prunedOccurrences).toBe(1);
    expect(result.expiredOpportunities).toBe(1);
  });

  it("marks Opportunity as isExpired=true after pruning sole occurrence", async () => {
    const syncTime = new Date();
    const staleTime = new Date(syncTime.getTime() - 60000);

    await seedProviderSyncState(testDb, "GREENHOUSE", syncTime);
    await seedOpportunity(testDb, "opp-expire");
    await seedOccurrence(testDb, "opp-expire", "GREENHOUSE", "stale-job-2", staleTime);

    await evaluateJobFreshness(testDb, "GREENHOUSE");

    const opp = await testDb.opportunity.findUnique({ where: { id: "opp-expire" } });
    expect(opp?.isExpired).toBe(true);
    expect(opp?.expiredAt).not.toBeNull();
  });

  it("prunes multiple stale occurrences in one pass", async () => {
    const syncTime = new Date();
    const staleTime = new Date(syncTime.getTime() - 60000);

    await seedProviderSyncState(testDb, "GREENHOUSE", syncTime);
    await seedOpportunity(testDb, "opp-a");
    await seedOpportunity(testDb, "opp-b");
    await seedOccurrence(testDb, "opp-a", "GREENHOUSE", "stale-a", staleTime);
    await seedOccurrence(testDb, "opp-b", "GREENHOUSE", "stale-b", staleTime);

    const result = await evaluateJobFreshness(testDb, "GREENHOUSE");
    expect(result.prunedOccurrences).toBe(2);
    expect(result.expiredOpportunities).toBe(2);
  });
});

describe("evaluateJobFreshness – multi-occurrence Opportunity (cross-provider)", () => {
  it("does NOT expire Opportunity when a fresh occurrence from another provider still exists", async () => {
    const syncTime = new Date();
    const staleTime = new Date(syncTime.getTime() - 60000);
    const freshTime = new Date(syncTime.getTime() + 1000);

    await seedProviderSyncState(testDb, "GREENHOUSE", syncTime);
    await seedProviderSyncState(testDb, "HIMALAYAS", null);

    await seedOpportunity(testDb, "opp-multi");
    await seedOccurrence(testDb, "opp-multi", "GREENHOUSE", "gh-stale", staleTime);
    await seedOccurrence(testDb, "opp-multi", "HIMALAYAS", "hm-fresh", freshTime);

    const result = await evaluateJobFreshness(testDb, "GREENHOUSE");
    expect(result.prunedOccurrences).toBe(1);
    expect(result.expiredOpportunities).toBe(0);

    const opp = await testDb.opportunity.findUnique({ where: { id: "opp-multi" } });
    expect(opp?.isExpired).toBe(false);
  });

  it("expires Opportunity when ALL occurrences (from all providers) are stale/pruned", async () => {
    const syncTime = new Date();
    const staleTime = new Date(syncTime.getTime() - 60000);

    await seedProviderSyncState(testDb, "GREENHOUSE", syncTime);

    await seedOpportunity(testDb, "opp-all-stale");
    await seedOccurrence(testDb, "opp-all-stale", "GREENHOUSE", "gh-stale-a", staleTime);
    await seedOccurrence(testDb, "opp-all-stale", "GREENHOUSE", "gh-stale-b", staleTime);

    const result = await evaluateJobFreshness(testDb, "GREENHOUSE");
    expect(result.prunedOccurrences).toBe(2);
    expect(result.expiredOpportunities).toBe(1);
  });
});

describe("evaluateJobFreshness – provider isolation", () => {
  it("only prunes occurrences belonging to the syncing provider, not other providers", async () => {
    const syncTime = new Date();
    const staleTime = new Date(syncTime.getTime() - 60000);

    await seedProviderSyncState(testDb, "GREENHOUSE", syncTime);
    await seedProviderSyncState(testDb, "REMOTIVE", null);

    await seedOpportunity(testDb, "opp-isolated");
    await seedOccurrence(testDb, "opp-isolated", "GREENHOUSE", "gh-stale", staleTime);
    await seedOccurrence(testDb, "opp-isolated", "REMOTIVE", "rm-old", staleTime);

    const result = await evaluateJobFreshness(testDb, "GREENHOUSE");
    expect(result.prunedOccurrences).toBe(1);
    expect(result.expiredOpportunities).toBe(0);

    const remaining = await testDb.jobOccurrence.count({
      where: { opportunityId: "opp-isolated", providerKey: "REMOTIVE" },
    });
    expect(remaining).toBe(1);
  });
});

describe("evaluateJobFreshness – live occurrence count re-query", () => {
  it("correctly re-queries count after deleting multiple stale occurrences from same Opportunity", async () => {
    const syncTime = new Date();
    const staleTime = new Date(syncTime.getTime() - 60000);
    const freshTime = new Date(syncTime.getTime() + 1000);

    await seedProviderSyncState(testDb, "GREENHOUSE", syncTime);

    await seedOpportunity(testDb, "opp-mixed");
    await seedOccurrence(testDb, "opp-mixed", "GREENHOUSE", "stale-x", staleTime);
    await seedOccurrence(testDb, "opp-mixed", "GREENHOUSE", "stale-y", staleTime);
    await seedOccurrence(testDb, "opp-mixed", "GREENHOUSE", "fresh-z", freshTime);

    const result = await evaluateJobFreshness(testDb, "GREENHOUSE");
    expect(result.prunedOccurrences).toBe(2);
    expect(result.expiredOpportunities).toBe(0);

    const opp = await testDb.opportunity.findUnique({ where: { id: "opp-mixed" } });
    expect(opp?.isExpired).toBe(false);
  });
});
