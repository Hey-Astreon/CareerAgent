import axios from "axios";
import { PlatformSource } from "@prisma/client";
import { JobSourceProvider, NormalizedJob, ProviderResult } from "./types";
import {
  cleanCompanySlug,
  cleanHtmlText,
  determineCategory,
  determineJobType,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
} from "./normalize";

const TARGET_WORKABLE_COMPANIES = ["impossiblefoods", "taxfix", "aerospike"];

export class WorkableProvider implements JobSourceProvider {
  name = "Workable ATS";
  providerKey = PlatformSource.WORKABLE;
  timeoutMs = 10000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    for (const companySlug of TARGET_WORKABLE_COMPANIES) {
      try {
        const apiUrl = `https://apply.workable.com/api/v1/widget/accounts/${companySlug}?details=true`;
        const res = await axios.get(apiUrl, { timeout: 5000 });

        if (res.data && Array.isArray(res.data.jobs)) {
          for (const item of res.data.jobs) {
            discoveredCount++;
            const title = item.title || "";
            const location = item.location?.city ? `${item.location.city}, ${item.location.country || ""}` : (item.telecommute ? "Remote" : "");
            const rawContent = cleanHtmlText(item.description || item.requirements || "");
            const jobUrl = item.url || `https://apply.workable.com/${companySlug}/j/${item.shortcode}/`;

            if (!isStrictlyRemoteDeveloperRole(title, location, rawContent)) {
              rejectedCount++;
              continue;
            }

            const { company, companySlug: normSlug } = cleanCompanySlug(companySlug);

            jobs.push({
              sourceJobId: item.shortcode || item.id ? String(item.shortcode || item.id) : undefined,
              providerKey: PlatformSource.WORKABLE,
              company,
              companySlug: normSlug,
              title,
              category: determineCategory(title, rawContent),
              jobType: determineJobType(title, rawContent),
              experienceLevel: determineExperienceLevel(title, rawContent),
              location: location ? `Remote (${location})` : "100% Remote",
              isRemote: true,
              remoteRegion: location || "Worldwide",
              discoveryUrl: jobUrl,
              canonicalAppUrl: jobUrl,
              postedAt: item.published ? new Date(item.published) : new Date(),
              rawDescription: rawContent,
              hasFullText: rawContent.length > 30,
            });
          }
        }
      } catch (err) {
        console.warn(`[Workable Provider Warning] Failed to parse ${companySlug}:`, (err as Error).message);
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
