import { PlatformSource } from "@prisma/client";
import { JobSourceProvider, ProviderResult, NormalizedJob } from "./types";
import {
  isStrictlyRemoteDeveloperRole,
  determineCategory,
  determineExperienceLevel,
  determineJobType,
  parseRemoteScope,
  determineOpportunitySignals,
} from "./normalize";

interface JobicyItem {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobGeo?: string;
  jobLevel?: string;
  pubDate?: string;
  jobDescription?: string;
}

export class JobicyProvider implements JobSourceProvider {
  name = "Jobicy";
  providerKey = PlatformSource.JOBICY;
  timeoutMs = 8000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let jobsDiscovered = 0;
    let jobsRejected = 0;

    try {
      const response = await fetch("https://jobicy.com/api/v2/remote-jobs?count=50", {
        headers: {
          "User-Agent": "CareerAgent/2.0 (Verified Job Discovery Engine)",
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        return {
          providerKey: this.providerKey,
          jobs: [],
          success: false,
          error: `HTTP ${response.status}`,
          durationMs: Date.now() - startTime,
          jobsDiscovered: 0,
          jobsRejected: 0,
        };
      }

      const data = await response.json();
      const items: JobicyItem[] = data.jobs || [];

      for (const item of items) {
        jobsDiscovered++;
        const title = item.jobTitle;
        const company = item.companyName;
        const location = item.jobGeo || "Worldwide";
        const rawDesc = (item.jobDescription || "").replace(/<[^>]*>?/gm, " ").trim();

        if (!isStrictlyRemoteDeveloperRole(title, location, rawDesc)) {
          jobsRejected++;
          continue;
        }

        const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, "");
        const postedAt = item.pubDate ? new Date(item.pubDate) : null;
        const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;

        const remoteScope = parseRemoteScope(location, rawDesc);
        const opportunitySignals = determineOpportunitySignals({
          postedAt: validPostedAt,
          applicationUrlType: "DIRECT_EMPLOYER_SITE",
          canonicalAppUrl: item.url,
          providerKey: this.providerKey,
        });

        jobs.push({
          sourceJobId: String(item.id),
          providerKey: this.providerKey,
          company,
          companySlug,
          title,
          category: determineCategory(title, rawDesc),
          jobType: determineJobType(title, rawDesc),
          experienceLevel: determineExperienceLevel(title, rawDesc),
          location,
          isRemote: true,
          remoteScope,
          discoveryUrl: item.url,
          canonicalAppUrl: item.url,
          applicationUrlType: "DIRECT_EMPLOYER_SITE",
          verificationStatus: "VERIFIED_AGGREGATOR",
          postedAt: validPostedAt,
          opportunitySignals,
          rawDescription: rawDesc || `${title} at ${company}. Listed on Jobicy.`,
          hasFullText: rawDesc.length > 50,
        });
      }

      return {
        providerKey: this.providerKey,
        jobs,
        success: true,
        durationMs: Date.now() - startTime,
        jobsDiscovered,
        jobsRejected,
      };
    } catch (err) {
      return {
        providerKey: this.providerKey,
        jobs: [],
        success: false,
        error: (err as Error).message,
        durationMs: Date.now() - startTime,
        jobsDiscovered: 0,
        jobsRejected: 0,
      };
    }
  }
}
