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

export class BuiltInProvider implements JobSourceProvider {
  name = "Built In";
  providerKey = PlatformSource.BUILTIN;
  timeoutMs = 15000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      // Built In tech startup jobs API
      const apiUrl = "https://builtin.com/api/jobs?category=developer&location=remote";
      const res = await axios.get(apiUrl, {
        headers: {
          "User-Agent": "CareerAgent/2.0 (Job Discovery Engine; https://github.com/Hey-Astreon/CareerAgent)",
          "Accept": "application/json",
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      const items = Array.isArray(res.data?.jobs) ? res.data.jobs : Array.isArray(res.data) ? res.data : [];

      for (const item of items) {
        discoveredCount++;
        const title = item.title || item.role || "";
        const companyName = item.company?.name || item.company_name || "Built In Tech Startup";
        const location = item.location || "Remote";
        const rawDesc = cleanHtmlText(item.description || "");
        const discoveryUrl = item.alias ? `https://builtin.com/${item.alias}` : item.url || "https://builtin.com";

        if (!isStrictlyRemoteDeveloperRole(title, location, rawDesc)) {
          rejectedCount++;
          continue;
        }

        const { company, companySlug } = cleanCompanySlug(companyName);
        const postedAt = item.created_at ? new Date(item.created_at) : null;
        const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;
        const remoteScope = parseRemoteScope(location, rawDesc);
        const opportunitySignals = determineOpportunitySignals({
          postedAt: validPostedAt,
          applicationUrlType: "DIRECT_ATS",
          canonicalAppUrl: discoveryUrl,
          providerKey: PlatformSource.BUILTIN,
        });

        jobs.push({
          sourceJobId: item.id ? String(item.id) : `${companySlug}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          providerKey: PlatformSource.BUILTIN,
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
          applicationUrlType: "DIRECT_ATS",
          verificationStatus: "VERIFIED_DIRECT_ATS",
          postedAt: validPostedAt,
          opportunitySignals,
          rawDescription: rawDesc || `${title} at ${company}. Tech startup engineering role on Built In.`,
          hasFullText: rawDesc.length > 50,
        });
      }
    } catch (err) {
      console.warn("[Built In Provider Warning] Request failed:", (err as Error).message);
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
