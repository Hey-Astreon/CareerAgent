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
import { generateUrlHash } from "./dedup";

export const ACTIVE_PROVIDERS: JobSourceProvider[] = [
  new GreenhouseProvider(),
  new LeverProvider(),
  new AshbyProvider(),
  new HimalayasProvider(),
  new RemotiveProvider(),
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
 * Ingests normalized jobs into database:
 * 1. Upserts Opportunity & JobOccurrence (Phase 1/2 Architecture)
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

    // 2. Ingest into Opportunity & JobOccurrence model (New Canonical Architecture)
    try {
      const existingOpp = await db.opportunity.findFirst({
        where: {
          companySlug: job.companySlug,
          title: job.title,
        },
      });

      let oppId: string;
      if (existingOpp) {
        oppId = existingOpp.id;
        await db.opportunity.update({
          where: { id: oppId },
          data: {
            lastSeenAt: new Date(),
            isExpired: false,
            ...(job.hasFullText && !existingOpp.hasFullText ? { rawDescription: job.rawDescription, hasFullText: true } : {}),
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

      if (job.sourceJobId) {
        await db.jobOccurrence.upsert({
          where: {
            providerKey_sourceJobId: {
              providerKey: job.providerKey,
              sourceJobId: job.sourceJobId,
            },
          },
          update: {
            lastSeenAt: new Date(),
          },
          create: {
            opportunityId: oppId,
            providerKey: job.providerKey,
            sourceJobId: job.sourceJobId,
            discoveryUrl: job.discoveryUrl,
            applicationUrl: job.canonicalAppUrl,
            postedAt: job.postedAt,
            lastSeenAt: new Date(),
          },
        });
      }
    } catch (err) {
      console.warn(`[Opportunity Ingestion Warning] Failed for ${job.title} at ${job.company}:`, (err as Error).message);
    }
  }

  return { insertedCount, updatedCount };
}
