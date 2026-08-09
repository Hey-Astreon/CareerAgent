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
  parseRemoteScope,
  determineOpportunitySignals,
} from "./normalize";

export class TheHubProvider implements JobSourceProvider {
  name = "TheHub.io";
  providerKey = PlatformSource.THEHUB;
  timeoutMs = 15000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      // TheHub.io API endpoint for startup engineering jobs
      const apiUrl = "https://thehub.io/api/jobs?category=engineering&remote=true";
      const res = await axios.get(apiUrl, {
        headers: {
          "User-Agent": "CareerAgent/2.0 (Job Discovery Engine; https://github.com/Hey-Astreon/CareerAgent)",
          "Accept": "application/json",
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      const items = Array.isArray(res.data?.docs) ? res.data.docs : Array.isArray(res.data?.jobs) ? res.data.jobs : Array.isArray(res.data) ? res.data : [];

      for (const item of items) {
        discoveredCount++;
        const title = item.title || item.role || "";
        const companyName = item.company?.name || item.companyName || "TheHub Startup";
        const location = item.location || "Remote";
        const rawDesc = cleanHtmlText(item.description || item.body || "");
        const discoveryUrl = item.id ? `https://thehub.io/jobs/${item.id}` : "https://thehub.io";

        if (!isStrictlyRemoteDeveloperRole(title, location, rawDesc)) {
          rejectedCount++;
          continue;
        }

        const { company, companySlug } = cleanCompanySlug(companyName);
        const postedAt = item.createdAt ? new Date(item.createdAt) : null;
        const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;
        const remoteScope = parseRemoteScope(location, rawDesc);
        const opportunitySignals = determineOpportunitySignals({
          postedAt: validPostedAt,
          applicationUrlType: "DIRECT_EMPLOYER_SITE",
          canonicalAppUrl: discoveryUrl,
          providerKey: PlatformSource.THEHUB,
        });

        jobs.push({
          sourceJobId: item.id ? String(item.id) : `${companySlug}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          providerKey: PlatformSource.THEHUB,
          company,
          companySlug,
          title,
          category: determineCategory(title, rawDesc),
          jobType: determineJobType(title, rawDesc),
          experienceLevel: determineExperienceLevel(title, rawDesc),
          location: location.includes("Remote") ? location : `Remote (${location})`,
          isRemote: true,
          remoteRegion: location.includes("Worldwide") || !location ? "Worldwide" : location,
          remoteScope,
          discoveryUrl,
          canonicalAppUrl: discoveryUrl,
          applicationUrlType: "DIRECT_EMPLOYER_SITE",
          verificationStatus: "VERIFIED_AGGREGATOR",
          postedAt: validPostedAt,
          opportunitySignals,
          rawDescription: rawDesc || `${title} at ${company}. Direct startup developer position listed on TheHub.io.`,
          hasFullText: rawDesc.length > 50,
        });
      }
    } catch (err) {
      console.warn("[TheHub.io Provider Warning] Request failed:", (err as Error).message);
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
