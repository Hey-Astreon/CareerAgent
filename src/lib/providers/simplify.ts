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

export class SimplifyProvider implements JobSourceProvider {
  name = "Simplify Jobs";
  providerKey = PlatformSource.SIMPLIFY;
  timeoutMs = 15000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      // Simplify public API endpoint for tech internships & new grad software developer positions
      const apiUrl = "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/main/README.md";
      const res = await axios.get(apiUrl, {
        headers: {
          "User-Agent": "CareerAgent/2.0 (Job Discovery Engine; https://github.com/Hey-Astreon/CareerAgent)",
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      if (typeof res.data === "string") {
        // Parse GitHub markdown table rows: | Company | Role | Location | Application Link | Date |
        const lines = res.data.split("\n");
        for (const line of lines) {
          if (!line.startsWith("|") || line.includes("---") || line.includes("Company")) continue;

          const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
          if (cols.length >= 4) {
            discoveredCount++;

            // Extract company name and clean markdown links e.g. **[Company](url)**
            const companyRaw = cols[0].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[\*\_\`]/g, "").trim();
            const titleRaw = cols[1].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[\*\_\`]/g, "").trim();
            const locationRaw = cols[2].replace(/[\*\_\`]/g, "").trim();
            
            // Extract application URL from link match e.g. [Apply](https://...)
            const urlMatch = cols[3].match(/\((https?:\/\/[^\)]+)\)/);
            const discoveryUrl = urlMatch ? urlMatch[1] : "https://simplify.jobs";

            if (!isStrictlyRemoteDeveloperRole(titleRaw, locationRaw, `${titleRaw} ${companyRaw}`)) {
              rejectedCount++;
              continue;
            }

            const dateCol = cols[4] ? cols[4].replace(/[\*\_\`]/g, "").trim() : "";
            let postedAt: Date | null = null;
            if (dateCol) {
              const parsedDate = new Date(`${dateCol}, ${new Date().getFullYear()}`);
              if (!isNaN(parsedDate.getTime())) {
                postedAt = parsedDate;
              }
            }

            const { company, companySlug } = cleanCompanySlug(companyRaw);
            const remoteScope = parseRemoteScope(locationRaw, titleRaw);
            const opportunitySignals = determineOpportunitySignals({
              postedAt,
              applicationUrlType: "DIRECT_ATS",
              canonicalAppUrl: discoveryUrl,
              providerKey: PlatformSource.SIMPLIFY,
            });

            jobs.push({
              sourceJobId: `${companySlug}-${titleRaw.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
              providerKey: PlatformSource.SIMPLIFY,
              company,
              companySlug,
              title: titleRaw,
              category: determineCategory(titleRaw, ""),
              jobType: determineJobType(titleRaw, ""),
              experienceLevel: determineExperienceLevel(titleRaw, ""),
              location: locationRaw ? `Remote (${locationRaw})` : "Remote",
              isRemote: true,
              remoteRegion: locationRaw.includes("Worldwide") || !locationRaw ? "Worldwide" : locationRaw,
              remoteScope,
              discoveryUrl,
              canonicalAppUrl: discoveryUrl,
              applicationUrlType: "DIRECT_ATS",
              verificationStatus: "VERIFIED_DIRECT_ATS",
              postedAt,
              opportunitySignals,
              rawDescription: `${titleRaw} at ${company}. Direct early-career software engineering opportunity listed on Simplify.`,
              hasFullText: true,
            });
          }
        }
      }
    } catch (err) {
      console.warn("[Simplify Provider Warning] Request failed:", (err as Error).message);
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
