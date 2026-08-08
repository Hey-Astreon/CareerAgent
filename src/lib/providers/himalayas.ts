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

export class HimalayasProvider implements JobSourceProvider {
  name = "Himalayas Remote";
  providerKey = PlatformSource.HIMALAYAS;
  timeoutMs = 8000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      // Fetch public JSON feed from Himalayas (official API)
      const apiUrl = "https://himalayas.app/jobs/api?limit=50";
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
          const companyName = item.companyName || "Himalayas Startup";
          const location = item.locationRestrictions?.join(", ") || "Remote (Worldwide)";
          const rawDesc = cleanHtmlText(item.description || item.excerpt || "");
          const discoveryUrl = item.applicationLink || item.url || `https://himalayas.app/jobs/${item.slug}`;
          const canonicalAppUrl = item.applicationLink || discoveryUrl;

          if (!isStrictlyRemoteDeveloperRole(title, location, rawDesc)) {
            rejectedCount++;
            continue;
          }

          const { company, companySlug } = cleanCompanySlug(companyName);

          jobs.push({
            sourceJobId: item.id ? String(item.id) : item.slug,
            providerKey: PlatformSource.HIMALAYAS,
            company,
            companySlug,
            title,
            category: determineCategory(title, rawDesc),
            jobType: determineJobType(title, rawDesc),
            experienceLevel: determineExperienceLevel(title, rawDesc),
            location: location.includes("Worldwide") || !location ? "100% Remote (Worldwide)" : `Remote (${location})`,
            isRemote: true,
            remoteRegion: location.includes("Worldwide") || !location ? "Worldwide" : location,
            discoveryUrl,
            canonicalAppUrl,
            postedAt: item.pubDate ? new Date(item.pubDate * 1000) : new Date(),
            rawDescription: rawDesc || `${title} at ${company}. Remote position listed on Himalayas.`,
            hasFullText: rawDesc.length > 50,
          });
        }
      }
    } catch (err) {
      console.warn("[Himalayas Provider Warning] Request failed:", (err as Error).message);
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
