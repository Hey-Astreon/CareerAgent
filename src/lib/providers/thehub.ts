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

export class TheHubProvider implements JobSourceProvider {
  name = "TheHub.io";
  providerKey = PlatformSource.THEHUB;
  timeoutMs = 15000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    const urls = [
      "https://thehub.io/jobs?roles=software-engineering",
      "https://thehub.io/jobs?roles=web-development",
    ];

    for (const targetUrl of urls) {
      try {
        const res = await axios.get(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
          },
          timeout: 8000,
        });

        if (res.data) {
          const $ = cheerio.load(res.data);
          $(".job-card, [class*='JobCard'], a[href*='/jobs/']").each((_, element) => {
            discoveredCount++;
            const title = $(element).find("h3, h4, .job-title, [class*='title']").first().text().trim() || $(element).text().trim();
            const companyName = $(element).find(".company-name, [class*='company']").first().text().trim() || "TheHub Startup";
            const link = $(element).attr("href") || $(element).find("a").attr("href");

            if (title && title.length < 80 && link && link.includes("/jobs/")) {
              const fullUrl = link.startsWith("http") ? link : `https://thehub.io${link}`;
              const location = "Remote (Worldwide)";

              if (!isStrictlyRemoteDeveloperRole(title, location, `${title} at ${companyName}`)) {
                rejectedCount++;
                return;
              }

              const { company, companySlug } = cleanCompanySlug(companyName);
              const remoteScope = parseRemoteScope(location, title);
              const opportunitySignals = determineOpportunitySignals({
                postedAt: null,
                applicationUrlType: "AGGREGATOR_PAGE",
                canonicalAppUrl: fullUrl,
                providerKey: PlatformSource.THEHUB,
              });

              jobs.push({
                sourceJobId: fullUrl.split("/").filter(Boolean).pop() || `${companySlug}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
                providerKey: PlatformSource.THEHUB,
                company,
                companySlug,
                title,
                category: determineCategory(title, ""),
                jobType: determineJobType(title, ""),
                experienceLevel: determineExperienceLevel(title, ""),
                location,
                isRemote: true,
                remoteRegion: "Worldwide",
                remoteScope,
                discoveryUrl: fullUrl,
                canonicalAppUrl: fullUrl,
                applicationUrlType: "AGGREGATOR_PAGE",
                verificationStatus: "VERIFIED_AGGREGATOR",
                postedAt: null,
                opportunitySignals,
                rawDescription: `${title} at ${company}. Direct startup developer posting on TheHub.io.`,
                hasFullText: false,
              });
            }
          });
        }
      } catch (err) {
        console.warn(`[TheHub Provider Warning] URL "${targetUrl}" failed:`, (err as Error).message);
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
