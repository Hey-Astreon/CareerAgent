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

const TARGET_LEVER_COMPANIES = ["scaleai", "brex"];

export class LeverProvider implements JobSourceProvider {
  name = "Lever ATS";
  providerKey = PlatformSource.LEVER;
  timeoutMs = 10000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    for (const companySlug of TARGET_LEVER_COMPANIES) {
      try {
        const apiUrl = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;
        const res = await axios.get(apiUrl, { timeout: this.timeoutMs });

        if (Array.isArray(res.data)) {
          for (const item of res.data) {
            discoveredCount++;
            const title = item.text || "";
            const locationName = item.categories?.location || "";
            const rawContent = cleanHtmlText(item.descriptionPlain || item.description || "");
            const jobUrl = item.hostedUrl;

            if (!isStrictlyRemoteDeveloperRole(title, locationName, rawContent)) {
              rejectedCount++;
              continue;
            }

            const { company, companySlug: normSlug } = cleanCompanySlug(companySlug);

            jobs.push({
              sourceJobId: String(item.id),
              providerKey: PlatformSource.LEVER,
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
              postedAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              rawDescription: rawContent,
              hasFullText: true,
            });
          }
        }
      } catch (err) {
        console.warn(`[Lever Provider Warning] Failed to parse ${companySlug}:`, (err as Error).message);
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
