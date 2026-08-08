import axios from "axios";
import { PlatformSource } from "@prisma/client";
import { JobSourceProvider, NormalizedJob, ProviderResult } from "./types";
import {
  cleanCompanySlug,
  determineCategory,
  determineJobType,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
} from "./normalize";

const TARGET_ASHBY_COMPANIES = ["linear", "supabase", "ramp"];

export class AshbyProvider implements JobSourceProvider {
  name = "Ashby ATS";
  providerKey = PlatformSource.ASHBY;
  timeoutMs = 10000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    for (const companySlug of TARGET_ASHBY_COMPANIES) {
      try {
        const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${companySlug}`;
        const res = await axios.get(apiUrl, { timeout: this.timeoutMs });

        if (res.data && Array.isArray(res.data.jobs)) {
          for (const item of res.data.jobs) {
            discoveredCount++;
            const title = item.title || "";
            const locationName = item.location || "Remote";
            const jobUrl = item.jobUrl || `https://jobs.ashbyhq.com/${companySlug}/${item.id}`;
            const rawContent = item.descriptionPlain || title;

            if (!isStrictlyRemoteDeveloperRole(title, locationName, rawContent)) {
              rejectedCount++;
              continue;
            }

            const { company, companySlug: normSlug } = cleanCompanySlug(companySlug);

            jobs.push({
              sourceJobId: String(item.id),
              providerKey: PlatformSource.ASHBY,
              company,
              companySlug: normSlug,
              title,
              category: determineCategory(title, rawContent),
              jobType: determineJobType(title, rawContent),
              experienceLevel: determineExperienceLevel(title, rawContent),
              location: "100% Remote",
              isRemote: true,
              remoteRegion: "Worldwide",
              discoveryUrl: jobUrl,
              canonicalAppUrl: jobUrl,
              postedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
              rawDescription: rawContent,
              hasFullText: true,
            });
          }
        }
      } catch (err) {
        console.warn(`[Ashby Provider Warning] Failed to parse ${companySlug}:`, (err as Error).message);
      }
    }

    return {
      providerKey: this.providerKey,
      jobs,
      success: true,
      durationMs: Date.now() - startTime,
      jobsDiscovered: discoveredCount,
      jobsRejected: rejectedCount,
    };
  }
}
