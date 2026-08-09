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

export class HiringCafeProvider implements JobSourceProvider {
  name = "Hiring Cafe";
  providerKey = PlatformSource.HIRING_CAFE;
  timeoutMs = 15000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      // Hiring Cafe direct ATS feed endpoint
      const apiUrl = "https://hiring.cafe/api/get-jobs";
      const res = await axios.post(
        apiUrl,
        {
          searchState: {
            roles: ["Software Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "Developer"],
            workplaceTypes: ["Remote"],
            experienceLevels: ["Entry Level", "Junior", "Internship"],
          },
        },
        {
          headers: {
            "User-Agent": "CareerAgent/2.0 (Job Discovery Engine; https://github.com/Hey-Astreon/CareerAgent)",
            "Content-Type": "application/json",
          },
          timeout: 10000,
          validateStatus: () => true,
        }
      );

      const items = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data?.jobs) ? res.data.jobs : [];

      for (const item of items) {
        discoveredCount++;
        const title = item.title || item.role_name || "";
        const companyName = item.company_name || item.company || "Hiring Cafe Partner";
        const location = item.location || "Remote";
        const rawDesc = cleanHtmlText(item.description || item.job_description || "");
        const discoveryUrl = item.apply_url || item.url || item.job_url || "https://hiring.cafe";
        const canonicalAppUrl = item.apply_url || discoveryUrl;

        if (!isStrictlyRemoteDeveloperRole(title, location, rawDesc)) {
          rejectedCount++;
          continue;
        }

        const { company, companySlug } = cleanCompanySlug(companyName);
        const postedAt = item.posted_at ? new Date(item.posted_at) : item.created_at ? new Date(item.created_at) : null;
        const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;
        const remoteScope = parseRemoteScope(location, rawDesc);
        const opportunitySignals = determineOpportunitySignals({
          postedAt: validPostedAt,
          applicationUrlType: "DIRECT_ATS",
          canonicalAppUrl,
          providerKey: PlatformSource.HIRING_CAFE,
        });

        jobs.push({
          sourceJobId: item.id ? String(item.id) : `${companySlug}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          providerKey: PlatformSource.HIRING_CAFE,
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
          canonicalAppUrl,
          applicationUrlType: "DIRECT_ATS",
          verificationStatus: "VERIFIED_DIRECT_ATS",
          postedAt: validPostedAt,
          opportunitySignals,
          rawDescription: rawDesc || `${title} at ${company}. Direct ATS job posting from Hiring Cafe.`,
          hasFullText: rawDesc.length > 50,
        });
      }
    } catch (err) {
      console.warn("[Hiring Cafe Provider Warning] Request failed:", (err as Error).message);
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
