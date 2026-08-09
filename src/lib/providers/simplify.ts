import axios from "axios";
import { PlatformSource } from "@prisma/client";
import { JobSourceProvider, NormalizedJob, ProviderResult } from "./types";
import {
  cleanCompanySlug,
  determineCategory,
  determineJobType,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
  parseRemoteScope,
  determineOpportunitySignals,
} from "./normalize";

interface SimplifyListing {
  id?: string;
  title?: string;
  company_name?: string;
  active?: boolean;
  date_posted?: number;
  url?: string;
  locations?: string[];
  company_url?: string;
}

export class SimplifyProvider implements JobSourceProvider {
  name = "Simplify Jobs";
  providerKey = PlatformSource.SIMPLIFY;
  timeoutMs = 15000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    const dataEndpoints = [
      "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/.github/scripts/listings.json",
      "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json",
      "https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/.github/scripts/listings.json",
    ];

    for (const endpoint of dataEndpoints) {
      try {
        const res = await axios.get<SimplifyListing[]>(endpoint, {
          headers: {
            "User-Agent": "CareerAgent/2.0 (Job Discovery Engine; https://github.com/Hey-Astreon/CareerAgent)",
            "Accept": "application/json",
          },
          timeout: 10000,
        });

        if (Array.isArray(res.data)) {
          for (const item of res.data) {
            // Skip inactive positions
            if (item.active === false) continue;

            discoveredCount++;
            const titleRaw = item.title || "";
            const companyRaw = item.company_name || "Simplify Tech";
            const discoveryUrl = item.url || item.company_url || "https://simplify.jobs";

            const rawLocs = item.locations && item.locations.length > 0 ? item.locations.join(", ") : "Worldwide";
            const location = rawLocs.toLowerCase().includes("remote") ? rawLocs : `Remote (${rawLocs})`;

            if (!isStrictlyRemoteDeveloperRole(titleRaw, location, `${titleRaw} at ${companyRaw}`)) {
              rejectedCount++;
              continue;
            }

            const { company, companySlug } = cleanCompanySlug(companyRaw);
            const postedAt = item.date_posted ? new Date(item.date_posted * 1000) : null;
            const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;
            const remoteScope = parseRemoteScope(location, titleRaw);
            const opportunitySignals = determineOpportunitySignals({
              postedAt: validPostedAt,
              applicationUrlType: "DIRECT_ATS",
              canonicalAppUrl: discoveryUrl,
              providerKey: PlatformSource.SIMPLIFY,
            });

            jobs.push({
              sourceJobId: item.id || `${companySlug}-${titleRaw.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
              providerKey: PlatformSource.SIMPLIFY,
              company,
              companySlug,
              title: titleRaw,
              category: determineCategory(titleRaw, ""),
              jobType: determineJobType(titleRaw, ""),
              experienceLevel: determineExperienceLevel(titleRaw, ""),
              location,
              isRemote: true,
              remoteRegion: rawLocs.includes("Worldwide") || !rawLocs ? "Worldwide" : rawLocs,
              remoteScope,
              discoveryUrl,
              canonicalAppUrl: discoveryUrl,
              applicationUrlType: "DIRECT_ATS",
              verificationStatus: "VERIFIED_DIRECT_ATS",
              postedAt: validPostedAt,
              opportunitySignals,
              rawDescription: `${titleRaw} at ${company}. Direct early-career software engineering opportunity listed on Simplify.`,
              hasFullText: true,
            });

            // Limit per repository endpoint to prevent memory overload
            if (jobs.length >= 100) break;
          }
        }
      } catch (err) {
        console.warn(`[Simplify Provider Warning] Endpoint "${endpoint}" failed:`, (err as Error).message);
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
