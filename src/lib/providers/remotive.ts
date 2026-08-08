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

export class RemotiveProvider implements JobSourceProvider {
  name = "Remotive Jobs";
  providerKey = PlatformSource.REMOTIVE;
  timeoutMs = 8000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      // Official public API endpoint for Software Development category
      const apiUrl = "https://remotive.com/api/remote-jobs?category=software-dev&limit=40";
      const res = await axios.get(apiUrl, {
        headers: {
          "User-Agent": "CareerAgent/2.0 (Job Discovery Engine; https://github.com/Hey-Astreon/CareerAgent)",
          "Accept": "application/json",
        },
        timeout: this.timeoutMs,
      });

      if (res.data && Array.isArray(res.data.jobs)) {
        for (const item of res.data.jobs) {
          discoveredCount++;
          const title = item.title || "";
          const companyName = item.company_name || "Remotive Company";
          const location = item.candidate_required_location || "Remote (Worldwide)";
          const rawDesc = cleanHtmlText(item.description || "");
          const discoveryUrl = item.url || `https://remotive.com/remote-jobs/${item.id}`;

          if (!isStrictlyRemoteDeveloperRole(title, location, rawDesc)) {
            rejectedCount++;
            continue;
          }

          const { company, companySlug } = cleanCompanySlug(companyName);

          jobs.push({
            sourceJobId: String(item.id),
            providerKey: PlatformSource.REMOTIVE,
            company,
            companySlug,
            title,
            category: determineCategory(title, rawDesc),
            jobType: determineJobType(title, rawDesc),
            experienceLevel: determineExperienceLevel(title, rawDesc),
            location: location ? `Remote (${location})` : "100% Remote (Worldwide)",
            isRemote: true,
            remoteRegion: location || "Worldwide",
            discoveryUrl,
            canonicalAppUrl: discoveryUrl,
            postedAt: item.publication_date ? new Date(item.publication_date) : new Date(),
            rawDescription: rawDesc,
            hasFullText: rawDesc.length > 50,
          });
        }
      }
    } catch (err) {
      console.warn("[Remotive Provider Warning] Request failed:", (err as Error).message);
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
