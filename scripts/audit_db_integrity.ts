import { db } from "../src/lib/db";

async function dbAudit() {
  const oppCount = await db.opportunity.count();
  const expiredOppCount = await db.opportunity.count({ where: { isExpired: true } });
  const occCount = await db.jobOccurrence.count();
  const jobCount = await db.jobPosting.count();
  const expiredJobCount = await db.jobPosting.count({ where: { isExpired: true } });
  const matchCount = await db.matchScore.count();
  const syncStateCount = await db.providerSyncState.count();

  const dupCheck = await db.opportunity.groupBy({
    by: ["companySlug", "title", "location"],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });

  const orphanedOpps = await db.opportunity.findMany({
    where: { occurrences: { none: {} } },
    select: { id: true, title: true, company: true },
    take: 5,
  });

  const nullOccurrences = await db.jobOccurrence.count({ where: { sourceJobId: null } });

  const multiSourceOpps = await db.opportunity.findMany({
    where: { occurrences: { some: {} } },
    include: { _count: { select: { occurrences: true } } },
    orderBy: { occurrences: { _count: "desc" } },
    take: 3,
  });

  const duplicateJobPostingUrls = await db.jobPosting.groupBy({
    by: ["urlHash"],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });

  const emptyTitleJobs = await db.jobPosting.count({ where: { title: "" } });
  const emptyCompanyJobs = await db.jobPosting.count({ where: { company: "" } });
  const invalidUrlJobs = await db.jobPosting.findMany({
    where: { url: { not: { startsWith: "http" } } },
    select: { id: true, url: true, title: true },
    take: 5,
  });

  const syncStates = await db.providerSyncState.findMany({ orderBy: { providerKey: "asc" } });

  console.log("=== DATABASE INTEGRITY AUDIT ===");
  console.log(`Opportunities Total:              ${oppCount}`);
  console.log(`Opportunities Expired:            ${expiredOppCount}`);
  console.log(`JobOccurrences Total:             ${occCount}`);
  console.log(`JobPostings Total:                ${jobCount}`);
  console.log(`JobPostings Expired:              ${expiredJobCount}`);
  console.log(`MatchScores Total:                ${matchCount}`);
  console.log(`ProviderSyncStates:               ${syncStateCount}`);
  console.log("");
  console.log(`Duplicate Opportunity Keys:       ${dupCheck.length} (MUST be 0)`);
  if (dupCheck.length > 0) console.log("  Sample Duplicates:", JSON.stringify(dupCheck.slice(0, 3)));
  console.log(`Orphaned Opportunities:           ${orphanedOpps.length} (expected > 0 for early Opps)`);
  if (orphanedOpps.length > 0) console.log("  Sample Orphans:", JSON.stringify(orphanedOpps.slice(0, 3)));
  console.log(`Occurrences w/ null sourceJobId:  ${nullOccurrences}`);
  console.log(`Duplicate JobPosting urlHashes:   ${duplicateJobPostingUrls.length} (MUST be 0)`);
  console.log(`JobPostings with empty title:     ${emptyTitleJobs}`);
  console.log(`JobPostings with empty company:   ${emptyCompanyJobs}`);
  console.log(`JobPostings with invalid URLs:    ${invalidUrlJobs.length}`);
  if (invalidUrlJobs.length > 0) console.log("  Sample Invalid URLs:", JSON.stringify(invalidUrlJobs));
  console.log("");
  console.log("=== PROVIDER SYNC STATE TABLE ===");
  for (const s of syncStates) {
    const lastSync = s.lastSuccessfulSyncAt ? s.lastSuccessfulSyncAt.toISOString().slice(0, 19) : "Never";
    console.log(`[${s.providerKey.padEnd(16)}] Status: ${s.status.padEnd(8)} | Last Sync: ${lastSync} | Failures: ${s.consecutiveFailures} | TotalSeen: ${s.totalJobsSeen}`);
  }
  console.log("");
  console.log("=== TOP MULTI-SOURCE OPPORTUNITIES ===");
  for (const o of multiSourceOpps) {
    console.log(`  "${o.title}" at ${o.company}: ${o._count.occurrences} occurrence(s)`);
  }
}

dbAudit()
  .catch(console.error)
  .finally(async () => await db.$disconnect());
