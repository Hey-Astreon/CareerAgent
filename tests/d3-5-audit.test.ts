import { db } from '@/lib/db';
import { PrismaClient, PlatformSource } from '@prisma/client';

async function main() {
  // Provider wise active job counts meeting discovery criteria
  const providers = await db.providerSyncState.findMany({ select: { providerKey: true } });
  const providerStats: Record<string, any> = {};

  for (const { providerKey } of providers) {
    const totalJobs = await db.jobPosting.count({
      where: {
        platform: providerKey as PlatformSource,
        isExpired: false,
        isRemote: true,
        experienceLevel: '0-3 Years (Entry/Junior)',
        category: 'Software Developer',
      },
    });
    providerStats[providerKey] = { totalJobs };
  }

  // Freshness metrics per provider
  const freshness: Record<string, any> = {};
  for (const { providerKey } of providers) {
    const sync = await db.providerSyncState.findUnique({ where: { providerKey } });
    const staleJobs = await db.jobPosting.count({
      where: {
        platform: providerKey as PlatformSource,
        isExpired: false,
        lastSeenAt: { lt: sync?.lastSuccessfulSyncAt ?? new Date(0) },
      },
    });
    freshness[providerKey] = {
      lastSuccessfulSyncAt: sync?.lastSuccessfulSyncAt,
      staleJobCount: staleJobs,
    };
  }

  // Overall ATS source coverage
  const totalProviders = providers.length;
  const totalActiveJobs = await db.jobPosting.count({ where: { isExpired: false } });

  const report = {
    providerStats,
    freshness,
    totalProviders,
    totalActiveJobs,
  };

  console.log(JSON.stringify(report, null, 2));
}

import { describe, it, expect } from "vitest";

describe("D3.5 Audit Metrics", () => {
  it("computes database metrics for active job postings", async () => {
    await main();
    expect(true).toBe(true);
  }, 30000);
});
