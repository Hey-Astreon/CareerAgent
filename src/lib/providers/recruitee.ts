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

const TARGET_RECRUITEE_COMPANIES = ["hotjar", "mollie", "mambu"];

export class RecruiteeProvider implements JobSourceProvider {
  name = "Recruitee ATS";
  providerKey = PlatformSource.RECRUITEE;
  timeoutMs = 10000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    for (const companySlug of TARGET_RECRUITEE_COMPANIES) {
      try {
        const apiUrl = `https://${companySlug}.recruitee.com/api/offers`;
        const res = await axios.get(apiUrl, { timeout: 5000 });

        if (res.data && Array.isArray(res.data.offers)) {
          for (const item of res.data.offers) {
            discoveredCount++;
            const title = item.title || "";
            const location = item.location || (item.remote ? "Remote" : "");
            const rawContent = cleanHtmlText(item.description || item.requirements || "");
            const jobUrl = item.careers_url || `https://${companySlug}.recruitee.com/o/${item.slug}`;

            if (!isStrictlyRemoteDeveloperRole(title, location, rawContent)) {
              rejectedCount++;
              continue;
            }

            const { company, companySlug: normSlug } = cleanCompanySlug(companySlug);

            jobs.push({
              sourceJobId: String(item.id),
              providerKey: PlatformSource.RECRUITEE,
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
              postedAt: item.created_at ? new Date(item.created_at) : new Date(),
              rawDescription: rawContent,
              hasFullText: rawContent.length > 30,
            });
          }
        }
      } catch (err) {
        console.warn(`[Recruitee Provider Warning] Failed to parse ${companySlug}:`, (err as Error).message);
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
