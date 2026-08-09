import axios from "axios";
import * as cheerio from "cheerio";
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

export class LinkedInProvider implements JobSourceProvider {
  name = "LinkedIn Jobs (Guest)";
  providerKey = PlatformSource.LINKEDIN;
  timeoutMs = 8000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    const targetQueries = ["software engineer", "frontend developer", "backend engineer"];

    for (const query of targetQueries) {
      try {
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&location=Worldwide&f_WT=2&start=0`;
        const res = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
          timeout: 4000,
        });

        if (res.data) {
          const $ = cheerio.load(res.data);
          $("li").each((_, element) => {
            discoveredCount++;
            const title = $(element).find(".base-search-card__title").text().trim();
            const companyName = $(element).find(".base-search-card__subtitle").text().trim();
            const rawLocation = $(element).find(".job-search-card__location").text().trim();
            const link = $(element).find("a.base-card__full-link").attr("href");
            const datetime = $(element).find("time").attr("datetime");

            if (title && companyName && link) {
              const cleanUrl = link.split("?")[0];
              const match = cleanUrl.match(/\/jobs\/view\/(\d+)/);
              const jobId = match ? match[1] : undefined;
              const rawLocLower = rawLocation.toLowerCase();

              // Explicitly reject any LinkedIn posting that mentions on-site, hybrid, or in-office
              if (
                rawLocLower.includes("on-site") ||
                rawLocLower.includes("onsite") ||
                rawLocLower.includes("hybrid") ||
                rawLocLower.includes("in-office") ||
                rawLocLower.includes("in office")
              ) {
                rejectedCount++;
                return;
              }

              // Use rawLocation directly for remote role validation
              if (!isStrictlyRemoteDeveloperRole(title, rawLocation, title)) {
                rejectedCount++;
                return;
              }

              const location = rawLocation ? (rawLocLower.includes("remote") ? rawLocation : `Remote (${rawLocation})`) : "Remote";

              const { company, companySlug } = cleanCompanySlug(companyName);
              const postedAt = datetime ? new Date(datetime) : null;
              const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;
              const remoteScope = parseRemoteScope(location, title);
              const opportunitySignals = determineOpportunitySignals({
                postedAt: validPostedAt,
                applicationUrlType: "AGGREGATOR_PAGE",
                canonicalAppUrl: cleanUrl,
                providerKey: PlatformSource.LINKEDIN,
              });

              jobs.push({
                sourceJobId: jobId,
                providerKey: PlatformSource.LINKEDIN,
                company,
                companySlug,
                title,
                category: determineCategory(title, title),
                jobType: determineJobType(title, title),
                experienceLevel: determineExperienceLevel(title, title),
                location,
                isRemote: true,
                remoteRegion: rawLocation || "Remote",
                remoteScope,
                discoveryUrl: cleanUrl,
                canonicalAppUrl: cleanUrl,
                applicationUrlType: "AGGREGATOR_PAGE",
                verificationStatus: "VERIFIED_AGGREGATOR",
                postedAt: validPostedAt,
                opportunitySignals,
                rawDescription: "",
                hasFullText: false,
              });
            }
          });
        }
      } catch (err) {
        console.warn(`[LinkedIn Provider Warning] Query "${query}" failed:`, (err as Error).message);
      }
    }

    return {
      providerKey: PlatformSource.LINKEDIN,
      jobs,
      success: true,
      durationMs: Date.now() - startTime,
      jobsDiscovered: discoveredCount,
      jobsRejected: rejectedCount,
    };
  }
}
