import { db } from "@/lib/db";
import { PlatformSource, SyncStatus } from "@prisma/client";
import { JobSourceProvider, NormalizedJob, ProviderResult } from "./types";
import { GreenhouseProvider } from "./greenhouse";
import { LeverProvider } from "./lever";
import { AshbyProvider } from "./ashby";
import { HimalayasProvider } from "./himalayas";
import { RemotiveProvider } from "./remotive";
import { LinkedInProvider } from "./linkedin";
import { YCProvider } from "./yc";
import { WellfoundProvider } from "./wellfound";
import { WorkableProvider } from "./workable";
import { SmartRecruitersProvider } from "./smartrecruiters";
import { RecruiteeProvider } from "./recruitee";
import { HackerNewsProvider } from "./hackernews";
import { generateUrlHash, computeDeduplicationKey, isDirectAtsUrl } from "./dedup";

export const ACTIVE_PROVIDERS: JobSourceProvider[] = [
  new GreenhouseProvider(),
  new LeverProvider(),
  new AshbyProvider(),
  new WorkableProvider(),
  new SmartRecruitersProvider(),
  new RecruiteeProvider(),
  new HimalayasProvider(),
  new RemotiveProvider(),
  new HackerNewsProvider(),
  new LinkedInProvider(),
  new YCProvider(),
  new WellfoundProvider(),
];

/**
 * Executes a single provider with hard timeout via Promise.race and AbortSignal.
 */
async function executeProviderWithTimeout(provider: JobSourceProvider): Promise<ProviderResult> {
  const startTime = Date.now();
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<ProviderResult>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({
        providerKey: provider.providerKey,
        jobs: [],
        success: false,
        error: `Provider execution timed out after ${provider.timeoutMs}ms`,
        durationMs: provider.timeoutMs,
        jobsDiscovered: 0,
        jobsRejected: 0,
      });
    }, provider.timeoutMs);
  });

  try {
    const result = await Promise.race([provider.fetch(), timeoutPromise]);
    return result;
  } catch (err) {
    return {
      providerKey: provider.providerKey,
      jobs: [],
      success: false,
      error: (err as Error).message,
      durationMs: Date.now() - startTime,
      jobsDiscovered: 0,
      jobsRejected: 0,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Runs all configured providers concurrently via Promise.allSettled() with failure isolation.
 */
export async function runAllProviders(
  providers: JobSourceProvider[] = ACTIVE_PROVIDERS
): Promise<{
  providerResults: ProviderResult[];
  allJobs: NormalizedJob[];
  totalDiscovered: number;
  totalRejected: number;
}> {
  const settled = await Promise.allSettled(
    providers.map((p) => executeProviderWithTimeout(p))
  );

  const providerResults: ProviderResult[] = [];
  const allJobs: NormalizedJob[] = [];
  let totalDiscovered = 0;
  let totalRejected = 0;

  for (let i = 0; i < settled.length; i++) {
    const res = settled[i];
    const provider = providers[i];

    if (res.status === "fulfilled") {
      const result = res.value;
      providerResults.push(result);
      if (result.success && result.jobs.length > 0) {
        allJobs.push(...result.jobs);
      }
      totalDiscovered += result.jobsDiscovered;
      totalRejected += result.jobsRejected;

      // Update ProviderSyncState in DB
      await db.providerSyncState.upsert({
        where: { providerKey: provider.providerKey },
        update: {
          status: result.success ? SyncStatus.HEALTHY : SyncStatus.DEGRADED,
          lastSyncAttemptAt: new Date(),
          ...(result.success ? { lastSuccessfulSyncAt: new Date(), consecutiveFailures: 0 } : { lastFailedSyncAt: new Date(), lastError: result.error }),
          totalJobsSeen: { increment: result.jobsDiscovered },
        },
        create: {
          providerKey: provider.providerKey,
          status: result.success ? SyncStatus.HEALTHY : SyncStatus.DEGRADED,
          lastSyncAttemptAt: new Date(),
          lastSuccessfulSyncAt: result.success ? new Date() : null,
          lastFailedSyncAt: result.success ? null : new Date(),
          lastError: result.error,
          totalJobsSeen: result.jobsDiscovered,
        },
      }).catch((err) => console.warn(`[SyncState Warning] Failed to update ${provider.providerKey}:`, err.message));

      // FRESHNESS ENGINE: Evaluates stale occurrences ONLY after a successful provider sync
      if (result.success) {
        await evaluateJobFreshness(provider.providerKey).catch((err) =>
          console.warn(`[Freshness Warning] Failed to evaluate freshness for ${provider.providerKey}:`, err.message)
        );
      }
    } else {
      const errorMsg = res.reason?.message || "Execution error";
      providerResults.push({
        providerKey: provider.providerKey,
        jobs: [],
        success: false,
        error: errorMsg,
        durationMs: 0,
        jobsDiscovered: 0,
        jobsRejected: 0,
      });
    }
  }

  return {
    providerResults,
    allJobs,
    totalDiscovered,
    totalRejected,
  };
}

/**
 * Phase 2 Freshness Engine: Prunes occurrences missed during a successful sync and updates Opportunity expiry.
 * Runs in a Prisma transaction and re-queries live active occurrences count from DB.
 */
export async function evaluateJobFreshness(providerKey: string): Promise<{
  prunedOccurrences: number;
  expiredOpportunities: number;
}> {
  const syncState = await db.providerSyncState.findUnique({
    where: { providerKey },
  });

  if (!syncState || !syncState.lastSuccessfulSyncAt) {
    return { prunedOccurrences: 0, expiredOpportunities: 0 };
  }

  const cutoffTime = syncState.lastSuccessfulSyncAt;

  return await db.$transaction(async (tx) => {
    // 1. Find stale occurrences for this provider
    const staleOccurrences = await tx.jobOccurrence.findMany({
      where: {
        providerKey,
        lastSeenAt: { lt: cutoffTime },
      },
      select: { id: true, opportunityId: true },
    });

    if (staleOccurrences.length === 0) {
      return { prunedOccurrences: 0, expiredOpportunities: 0 };
    }

    const staleIds = staleOccurrences.map((o) => o.id);
    const affectedOppIds = Array.from(new Set(staleOccurrences.map((o) => o.opportunityId)));

    // 2. Bulk delete stale occurrences
    const deleteResult = await tx.jobOccurrence.deleteMany({
      where: { id: { in: staleIds } },
    });

    let expiredCount = 0;

    // 3. Re-query live DB count for each affected Opportunity
    for (const oppId of affectedOppIds) {
      const activeCount = await tx.jobOccurrence.count({
        where: { opportunityId: oppId },
      });

      if (activeCount === 0) {
        await tx.opportunity.update({
          where: { id: oppId },
          data: {
            isExpired: true,
            expiredAt: new Date(),
          },
        });
        expiredCount++;
      }
    }

    return { prunedOccurrences: deleteResult.count, expiredOpportunities: expiredCount };
  });
}

/**
 * Ingests normalized jobs into database:
 * 1. Upserts Opportunity & JobOccurrence (Phase 1/2 Multi-Signal Deduplication & Provenance Architecture)
 * 2. Upserts JobPosting for backward compatibility with existing API consumers
 */
export async function ingestNormalizedJobs(jobs: NormalizedJob[]): Promise<{ insertedCount: number; updatedCount: number }> {
  let insertedCount = 0;
  let updatedCount = 0;

  for (const job of jobs) {
    const urlHash = generateUrlHash(job.canonicalAppUrl || job.discoveryUrl);

    // 1. Ingest into JobPosting model for backward compatibility
    const existingJobPosting = await db.jobPosting.findUnique({
      where: { urlHash },
    });

    if (existingJobPosting) {
      await db.jobPosting.update({
        where: { id: existingJobPosting.id },
        data: {
          lastSeenAt: new Date(),
          isExpired: false,
          rawDescription: job.rawDescription || existingJobPosting.rawDescription,
          hasFullText: job.hasFullText,
        },
      });
      updatedCount++;
    } else {
      await db.jobPosting.create({
        data: {
          urlHash,
          url: job.canonicalAppUrl || job.discoveryUrl,
          company: job.company,
          title: job.title,
          category: job.category || "Software Developer",
          jobType: job.jobType || "Remote Full-Time",
          experienceLevel: job.experienceLevel || "0-3 Years (Entry/Junior)",
          platform: job.providerKey,
          location: job.location,
          isRemote: job.isRemote,
          postedAt: job.postedAt,
          rawDescription: job.rawDescription || `${job.title} at ${job.company}`,
          hasFullText: job.hasFullText,
          lastSeenAt: new Date(),
          isExpired: false,
        },
      });
      insertedCount++;
    }

    // 2. Ingest into Opportunity & JobOccurrence model (Canonical Deduplication Architecture)
    try {
      const dedupKey = computeDeduplicationKey(job);

      // Search existing opportunity matching company, title, AND exact location (different locations remain distinct!)
      const existingOpp = await db.opportunity.findFirst({
        where: {
          companySlug: job.companySlug,
          title: job.title,
          location: job.location,
        },
      });

      let oppId: string;
      if (existingOpp) {
        oppId = existingOpp.id;
        const upgradeDirectUrl = isDirectAtsUrl(job.canonicalAppUrl) && !isDirectAtsUrl(existingOpp.canonicalAppUrl);
        const upgradeDescription = job.hasFullText && !existingOpp.hasFullText;

        await db.opportunity.update({
          where: { id: oppId },
          data: {
            lastSeenAt: new Date(),
            isExpired: false,
            ...(upgradeDirectUrl ? { canonicalAppUrl: job.canonicalAppUrl } : {}),
            ...(upgradeDescription ? { rawDescription: job.rawDescription, hasFullText: true } : {}),
          },
        });
      } else {
        const newOpp = await db.opportunity.create({
          data: {
            company: job.company,
            companySlug: job.companySlug,
            title: job.title,
            category: job.category || "Software Developer",
            jobType: job.jobType || "Remote Full-Time",
            experienceLevel: job.experienceLevel || "0-3 Years (Entry/Junior)",
            location: job.location,
            isRemote: job.isRemote,
            remoteRegion: job.remoteRegion || "Worldwide",
            canonicalAppUrl: job.canonicalAppUrl || job.discoveryUrl,
            rawDescription: job.rawDescription || `${job.title} at ${job.company}`,
            hasFullText: job.hasFullText,
            postedAt: job.postedAt,
            lastSeenAt: new Date(),
            isExpired: false,
          },
        });
        oppId = newOpp.id;
      }

      // Record source occurrence for provenance
      const occurrenceKey = job.sourceJobId || dedupKey;
      await db.jobOccurrence.upsert({
        where: {
          providerKey_sourceJobId: {
            providerKey: job.providerKey,
            sourceJobId: occurrenceKey,
          },
        },
        update: {
          lastSeenAt: new Date(),
          applicationUrl: job.canonicalAppUrl,
        },
        create: {
          opportunityId: oppId,
          providerKey: job.providerKey,
          sourceJobId: occurrenceKey,
          discoveryUrl: job.discoveryUrl,
          applicationUrl: job.canonicalAppUrl,
          postedAt: job.postedAt,
          lastSeenAt: new Date(),
        },
      });
    } catch (err) {
      console.warn(`[Opportunity Ingestion Warning] Failed for ${job.title} at ${job.company}:`, (err as Error).message);
    }
  }

  return { insertedCount, updatedCount };
}
