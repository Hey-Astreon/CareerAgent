/**
 * Phase 5 Match Score Cache Lifecycle Tests
 * Location: tests/cache-lifecycle.test.ts
 *
 * Covers:
 * - Candidate + Job → First evaluation → MatchScore record created in DB (cached: false)
 * - Candidate + Job → Second evaluation (forceRefresh=false) → Cache hit from DB (cached: true, no AI call)
 * - forceRefresh=true → Bypasses cache, performs fresh evaluation, updates MatchScore record
 * - Profile/Job relationship cleanup (Cascade delete of MatchScore when Profile or Job is deleted)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import os from "os";
import path from "path";
import fs from "fs";
import { computeCompositeMatchScore } from "@/lib/ai/scorer";

let testDb: PrismaClient;
let dbPath: string;

beforeAll(async () => {
  dbPath = path.join(os.tmpdir(), `test-cache-${Date.now()}.db`);
  const devDbPath = path.join(process.cwd(), "prisma", "dev.db");
  fs.copyFileSync(devDbPath, dbPath);

  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  testDb = new PrismaClient({ adapter });
});

beforeEach(async () => {
  await testDb.matchScore.deleteMany();
  await testDb.jobPosting.deleteMany();
  await testDb.profile.deleteMany();
});

afterAll(async () => {
  await testDb.$disconnect();
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  } catch {}
});

async function seedCandidateProfile(db: PrismaClient) {
  return db.profile.create({
    data: {
      slug: "roushan",
      fullName: "Roushan Kumar",
      title: "Full Stack Developer",
      email: "roushan@example.com",
      location: "Remote",
      masterResumePath: "/resumes/master.pdf",
      projects: {
        create: [
          {
            title: "CareerAgent",
            techStack: "TypeScript, React, Node.js, SQLite, Prisma",
            architecture: "Next.js App Router with Prisma ORM",
            bulletPoints: "Built automated job discovery engine",
          },
        ],
      },
      virtualExps: {
        create: [
          {
            company: "Tech Corp",
            roleTitle: "Software Developer Intern",
            period: "2023",
            problemScope: "API Development",
            actionTaken: "Built FastAPI microservices",
            outcome: "Reduced latency by 40%",
          },
        ],
      },
    },
    include: { projects: true, virtualExps: true },
  });
}

async function seedJobPosting(db: PrismaClient, id = "job-1") {
  return db.jobPosting.create({
    data: {
      id,
      urlHash: `hash-${id}`,
      url: `https://boards.greenhouse.io/stripe/jobs/${id}`,
      company: "Stripe",
      title: "Software Engineer",
      category: "Software Developer",
      jobType: "Remote Full-Time",
      experienceLevel: "0-3 Years (Entry/Junior)",
      platform: "GREENHOUSE",
      location: "100% Remote",
      isRemote: true,
      postedAt: new Date(),
      rawDescription: "Looking for a software engineer proficient in TypeScript, React, and Node.js.",
      hasFullText: true,
    },
  });
}

async function evaluateAndCacheMatch(
  db: PrismaClient,
  profileSlug: string,
  jobPostingId: string,
  forceRefresh = false
) {
  const startTime = Date.now();

  const profile = await db.profile.findUnique({
    where: { slug: profileSlug },
    include: { projects: true, virtualExps: true },
  });

  const job = await db.jobPosting.findUnique({
    where: { id: jobPostingId },
  });

  if (!profile || !job) {
    throw new Error("Profile or JobPosting not found");
  }

  // 1. Cache Check
  if (!forceRefresh) {
    const cachedRecord = await db.matchScore.findUnique({
      where: {
        profileId_jobPostingId: {
          profileId: profile.id,
          jobPostingId: job.id,
        },
      },
    });

    if (cachedRecord) {
      return {
        score: cachedRecord.score,
        hardSkills: JSON.parse(cachedRecord.hardSkills || "[]"),
        missingSkills: JSON.parse(cachedRecord.missingSkills || "[]"),
        reasoning: cachedRecord.reasoning,
        cached: true,
        aiCallsCount: 0,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // 2. Perform fresh match computation
  const candidateContext = {
    fullName: profile.fullName,
    title: profile.title,
    masterProjects: profile.projects.map((p) => ({
      title: p.title,
      techStack: p.techStack,
      architecture: p.architecture,
    })),
    virtualExps: profile.virtualExps.map((e) => ({
      company: e.company,
      roleTitle: e.roleTitle,
      outcome: e.outcome,
    })),
  };

  const result = await computeCompositeMatchScore(
    candidateContext,
    job.title,
    job.rawDescription,
    job.location,
    job.url,
    job.postedAt,
    job.platform,
    false // disable live LLM network calls for test determinism
  );

  // 3. Persist into MatchScore table
  const matchRecord = await db.matchScore.upsert({
    where: {
      profileId_jobPostingId: {
        profileId: profile.id,
        jobPostingId: job.id,
      },
    },
    update: {
      score: result.finalScore,
      hardSkills: JSON.stringify(result.hardSkills),
      missingSkills: JSON.stringify(result.missingSkills),
      reasoning: result.reasoning,
    },
    create: {
      profileId: profile.id,
      jobPostingId: job.id,
      score: result.finalScore,
      hardSkills: JSON.stringify(result.hardSkills),
      missingSkills: JSON.stringify(result.missingSkills),
      reasoning: result.reasoning,
    },
  });

  return {
    score: matchRecord.score,
    hardSkills: JSON.parse(matchRecord.hardSkills),
    missingSkills: JSON.parse(matchRecord.missingSkills),
    reasoning: matchRecord.reasoning,
    cached: false,
    aiCallsCount: result.aiCallsCount,
    latencyMs: Date.now() - startTime,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Match Score Cache Lifecycle", () => {
  it("First evaluation: computes score and persists MatchScore record (cached: false)", async () => {
    const profile = await seedCandidateProfile(testDb);
    const job = await seedJobPosting(testDb, "job-first-eval");

    const result = await evaluateAndCacheMatch(testDb, profile.slug, job.id, false);

    expect(result.cached).toBe(false);
    expect(result.score).toBeGreaterThan(0);

    const dbRecord = await testDb.matchScore.findUnique({
      where: {
        profileId_jobPostingId: {
          profileId: profile.id,
          jobPostingId: job.id,
        },
      },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.score).toBe(result.score);
  });

  it("Second evaluation with forceRefresh=false: returns cached hit without re-computation (cached: true)", async () => {
    const profile = await seedCandidateProfile(testDb);
    const job = await seedJobPosting(testDb, "job-second-eval");

    const run1 = await evaluateAndCacheMatch(testDb, profile.slug, job.id, false);
    expect(run1.cached).toBe(false);

    const run2 = await evaluateAndCacheMatch(testDb, profile.slug, job.id, false);
    expect(run2.cached).toBe(true);
    expect(run2.score).toBe(run1.score);
    expect(run2.reasoning).toBe(run1.reasoning);
  });

  it("forceRefresh=true: bypasses cache and updates MatchScore record", async () => {
    const profile = await seedCandidateProfile(testDb);
    const job = await seedJobPosting(testDb, "job-force-refresh");

    const run1 = await evaluateAndCacheMatch(testDb, profile.slug, job.id, false);
    expect(run1.cached).toBe(false);

    const run2 = await evaluateAndCacheMatch(testDb, profile.slug, job.id, true);
    expect(run2.cached).toBe(false);

    const count = await testDb.matchScore.count({
      where: { profileId: profile.id, jobPostingId: job.id },
    });
    expect(count).toBe(1);
  });

  it("Cascade deletion: deleting JobPosting removes associated MatchScore records", async () => {
    const profile = await seedCandidateProfile(testDb);
    const job = await seedJobPosting(testDb, "job-to-delete");

    await evaluateAndCacheMatch(testDb, profile.slug, job.id, false);

    let matchCount = await testDb.matchScore.count({ where: { jobPostingId: job.id } });
    expect(matchCount).toBe(1);

    await testDb.jobPosting.delete({ where: { id: job.id } });

    matchCount = await testDb.matchScore.count({ where: { jobPostingId: job.id } });
    expect(matchCount).toBe(0);
  });

  it("Cascade deletion: deleting Profile removes associated MatchScore records", async () => {
    const profile = await seedCandidateProfile(testDb);
    const job = await seedJobPosting(testDb, "job-profile-delete");

    await evaluateAndCacheMatch(testDb, profile.slug, job.id, false);

    let matchCount = await testDb.matchScore.count({ where: { profileId: profile.id } });
    expect(matchCount).toBe(1);

    await testDb.profile.delete({ where: { id: profile.id } });

    matchCount = await testDb.matchScore.count({ where: { profileId: profile.id } });
    expect(matchCount).toBe(0);
  });
});
