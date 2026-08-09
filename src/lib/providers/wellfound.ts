import axios from "axios";
import * as cheerio from "cheerio";
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

export class WellfoundProvider implements JobSourceProvider {
  name = "Wellfound (AngelList)";
  providerKey = PlatformSource.WELLFOUND;
  timeoutMs = 8000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      const url = "https://wellfound.com/role/l/software-engineer/remote";
      const res = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 4000,
      });

      if (res.data) {
        const $ = cheerio.load(res.data);
        const scriptTag = $('script[id="__NEXT_DATA__"]').html();

        if (scriptTag) {
          const nextData = JSON.parse(scriptTag);
          const listings = nextData?.props?.pageProps?.jobListings || [];

          for (const item of listings) {
            discoveredCount++;
            const title = item.title || "";
            const companyName = item.companyName || "Startup";
            const location = item.location || "Remote";
            const rawDesc = cleanHtmlText(item.description || "");
            const jobUrl = item.url || `https://wellfound.com/jobs/${item.id}`;

            if (!isStrictlyRemoteDeveloperRole(title, location, rawDesc)) {
              rejectedCount++;
              continue;
            }

            const { company, companySlug } = cleanCompanySlug(companyName);
            const postedAt = item.postedAt ? new Date(item.postedAt) : null;
            const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;
            const remoteScope = parseRemoteScope(location, rawDesc);
            const opportunitySignals = determineOpportunitySignals({
              postedAt: validPostedAt,
              applicationUrlType: "AGGREGATOR_PAGE",
              canonicalAppUrl: jobUrl,
              providerKey: PlatformSource.WELLFOUND,
            });

            jobs.push({
              sourceJobId: String(item.id),
              providerKey: PlatformSource.WELLFOUND,
              company,
              companySlug,
              title,
              category: determineCategory(title, rawDesc),
              jobType: determineJobType(title, rawDesc),
              experienceLevel: determineExperienceLevel(title, rawDesc),
              location: location || "Remote",
              isRemote: true,
              remoteRegion: location || "Remote",
              remoteScope,
              discoveryUrl: jobUrl,
              canonicalAppUrl: jobUrl,
              applicationUrlType: "AGGREGATOR_PAGE",
              verificationStatus: "VERIFIED_AGGREGATOR",
              postedAt: validPostedAt,
              opportunitySignals,
              rawDescription: rawDesc,
              hasFullText: rawDesc.length > 30,
            });
          }
        }
      }
    } catch (err) {
      console.warn("[Wellfound Provider Warning] Query failed:", (err as Error).message);
    }

    return {
      providerKey: PlatformSource.WELLFOUND,
      jobs,
      success: true,
      durationMs: Date.now() - startTime,
      jobsDiscovered: discoveredCount,
      jobsRejected: rejectedCount,
    };
  }
}
