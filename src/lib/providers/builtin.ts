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

export class BuiltInProvider implements JobSourceProvider {
  name = "Built In Remote";
  providerKey = PlatformSource.BUILTIN;
  timeoutMs = 15000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    const urls = [
      "https://builtin.com/jobs/remote/dev-engineering",
      "https://builtin.com/jobs/remote/entry-level/dev-engineering",
    ];

    for (const url of urls) {
      try {
        const res = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
          },
          timeout: 8000,
        });

        if (res.data) {
          const $ = cheerio.load(res.data);
          $("[data-id='job-card']").each((_, element) => {
            discoveredCount++;
            const titleEl = $(element).find("a[data-id='job-card-title']").first();
            const rawTitle = titleEl.text().trim() || $(element).find("h2").first().text().trim();
            const companyName = $(element).find("[data-id='company-name']").first().text().trim() || "Built In Tech";
            const link = titleEl.attr("href") || $(element).find("a[href*='/job/']").first().attr("href");
            const locationRaw = $(element).find("[data-id='job-location']").first().text().trim() || "Remote";

            if (rawTitle && link) {
              const title = rawTitle.replace(/\s+/g, " ").trim();
              const fullUrl = link.startsWith("http") ? link : `https://builtin.com${link}`;
              const location = locationRaw.toLowerCase().includes("remote") ? locationRaw : `Remote (${locationRaw})`;

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
                providerKey: PlatformSource.BUILTIN,
              });

              jobs.push({
                sourceJobId: link.split("/").filter(Boolean).pop() || `${companySlug}-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
                providerKey: PlatformSource.BUILTIN,
                company,
                companySlug,
                title,
                category: determineCategory(title, ""),
                jobType: determineJobType(title, ""),
                experienceLevel: determineExperienceLevel(title, ""),
                location,
                isRemote: true,
                remoteRegion: locationRaw,
                remoteScope,
                discoveryUrl: fullUrl,
                canonicalAppUrl: fullUrl,
                applicationUrlType: "AGGREGATOR_PAGE",
                verificationStatus: "VERIFIED_AGGREGATOR",
                postedAt: null,
                opportunitySignals,
                rawDescription: `${title} at ${company}. Direct tech position listed on Built In Remote.`,
                hasFullText: false,
              });
            }
          });
        }
      } catch (err) {
        console.warn(`[BuiltIn Provider Warning] URL "${url}" failed:`, (err as Error).message);
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
