import axios from "axios";
import { PlatformSource } from "@prisma/client";
import { JobSourceProvider, NormalizedJob, ProviderResult } from "./types";
import {
  cleanCompanySlug,
  cleanHtmlText,
  determineCategory,
  determineExperienceLevel,
  determineJobType,
  isStrictlyRemoteDeveloperRole,
  parseRemoteScope,
  determineOpportunitySignals,
} from "./normalize";

interface NaukriJobItem {
  jobId?: string | number;
  title?: string;
  companyName?: string;
  jdURL?: string;
  staticUrl?: string;
  placeholders?: { type?: string; label?: string }[];
  tagsAndSkills?: string;
  jobDescription?: string;
}

export class NaukriProvider implements JobSourceProvider {
  name = "Naukri Jobs";
  providerKey = PlatformSource.NAUKRI;
  timeoutMs = 8000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      const url =
        "https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_keyword&searchType=adv&keyword=software%20engineer&remoteWorkType=1";

      const res = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "appid": "109",
          "systemid": "Naukri",
          "clientid": "d3skt0p",
        },
        timeout: this.timeoutMs,
        validateStatus: () => true,
      });

      if (res.status === 200 && res.data) {
        const items: NaukriJobItem[] = Array.isArray(res.data.jobDetails)
          ? res.data.jobDetails
          : Array.isArray(res.data.jobs)
          ? res.data.jobs
          : [];

        for (const item of items) {
          discoveredCount++;
          const title = item.title?.trim() || "";
          const rawCompany = item.companyName?.trim() || "Naukri Employer";
          const rawLocLabel = item.placeholders?.find((p) => p.type === "location")?.label || "Remote";
          const location = `Remote (${rawLocLabel})`;
          const rawDesc = cleanHtmlText(item.jobDescription || item.tagsAndSkills || `${title} at ${rawCompany}`);
          const relPath = item.jdURL || item.staticUrl || "";
          const appUrl = relPath.startsWith("http") ? relPath : `https://www.naukri.com${relPath}`;

          if (!title || !isStrictlyRemoteDeveloperRole(title, location, rawDesc)) {
            rejectedCount++;
            continue;
          }

          const { company, companySlug } = cleanCompanySlug(rawCompany);
          const remoteScope = parseRemoteScope(location, rawDesc);
          const opportunitySignals = determineOpportunitySignals({
            postedAt: null,
            applicationUrlType: "AGGREGATOR_PAGE",
            canonicalAppUrl: appUrl,
            providerKey: PlatformSource.NAUKRI,
          });

          jobs.push({
            sourceJobId: item.jobId ? String(item.jobId) : appUrl,
            providerKey: PlatformSource.NAUKRI,
            company,
            companySlug,
            title,
            category: determineCategory(title, rawDesc),
            jobType: determineJobType(title, rawDesc),
            experienceLevel: determineExperienceLevel(title, rawDesc),
            location,
            isRemote: true,
            remoteRegion: rawLocLabel || "Remote",
            remoteScope,
            discoveryUrl: appUrl,
            canonicalAppUrl: appUrl,
            applicationUrlType: "AGGREGATOR_PAGE",
            verificationStatus: "VERIFIED_AGGREGATOR",
            postedAt: null,
            opportunitySignals,
            rawDescription: rawDesc,
            hasFullText: rawDesc.length > 50,
          });
        }
      } else {
        console.warn(
          `[Naukri Provider Warning] API returned status ${res.status} (WAF / anti-bot protection)`
        );
      }
    } catch (err) {
      console.warn("[Naukri Provider Warning] Request failed:", (err as Error).message);
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
