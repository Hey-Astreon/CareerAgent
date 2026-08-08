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

const TARGET_SMARTRECRUITERS_COMPANIES = ["Square", "Ubisoft", "VISA"];

export class SmartRecruitersProvider implements JobSourceProvider {
  name = "SmartRecruiters ATS";
  providerKey = PlatformSource.SMARTRECRUITERS;
  timeoutMs = 10000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    for (const companySlug of TARGET_SMARTRECRUITERS_COMPANIES) {
      try {
        const apiUrl = `https://api.smartrecruiters.com/v1/companies/${companySlug}/postings`;
        const res = await axios.get(apiUrl, { timeout: 5000 });

        if (res.data && Array.isArray(res.data.content)) {
          for (const item of res.data.content) {
            discoveredCount++;
            const title = item.name || "";
            const location = item.location?.remote ? "Remote" : (item.location?.city ? `${item.location.city}, ${item.location.country || ""}` : "");
            const rawContent = cleanHtmlText(item.jobAd?.sections?.jobDescription?.text || title);
            const jobUrl = `https://jobs.smartrecruiters.com/${companySlug}/${item.id}`;

            if (!isStrictlyRemoteDeveloperRole(title, location, rawContent)) {
              rejectedCount++;
              continue;
            }

            const { company, companySlug: normSlug } = cleanCompanySlug(companySlug);

            jobs.push({
              sourceJobId: String(item.id),
              providerKey: PlatformSource.SMARTRECRUITERS,
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
              postedAt: item.releasedDate ? new Date(item.releasedDate) : new Date(),
              rawDescription: rawContent,
              hasFullText: rawContent.length > 30,
            });
          }
        }
      } catch (err) {
        console.warn(`[SmartRecruiters Provider Warning] Failed to parse ${companySlug}:`, (err as Error).message);
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
