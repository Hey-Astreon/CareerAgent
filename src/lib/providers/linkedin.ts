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
} from "./normalize";

export class LinkedInProvider implements JobSourceProvider {
  name = "LinkedIn Guest Board";
  providerKey = PlatformSource.LINKEDIN;
  timeoutMs = 8000;
  isOptional = true;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    const searchQueries = [
      "Software Engineer",
      "Backend Developer",
      "Frontend Developer",
      "Full Stack Developer",
      "Python Developer",
    ];

    for (const query of searchQueries) {
      try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedQuery}&location=Remote&f_WT=2&start=0`;

        const res = await axios.get(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
          timeout: this.timeoutMs,
        });

        if (res.data) {
          const $ = cheerio.load(res.data);

          $("li").each((_, el) => {
            discoveredCount++;
            const title = $(el).find(".base-search-card__title").text().trim();
            const companyName = $(el).find(".base-search-card__subtitle").text().trim();
            const rawLocation = $(el).find(".job-search-card__location").text().trim();
            const link = $(el).find("a.base-card__full-link").attr("href");
            const datetime = $(el).find("time").attr("datetime");

            if (title && link && link.includes("/jobs/view/")) {
              const cleanUrl = link.split("?")[0];
              const match = cleanUrl.match(/\/jobs\/view\/(\d+)/);
              const jobId = match ? match[1] : undefined;

              if (!isStrictlyRemoteDeveloperRole(title, rawLocation, title)) {
                rejectedCount++;
                return;
              }

              const { company, companySlug } = cleanCompanySlug(companyName);

              jobs.push({
                sourceJobId: jobId,
                providerKey: PlatformSource.LINKEDIN,
                company,
                companySlug,
                title,
                category: determineCategory(title, title),
                jobType: determineJobType(title, title),
                experienceLevel: determineExperienceLevel(title, title),
                location: rawLocation ? `Remote (${rawLocation})` : "100% Remote",
                isRemote: true,
                remoteRegion: rawLocation || "Remote",
                discoveryUrl: cleanUrl,
                canonicalAppUrl: cleanUrl,
                postedAt: datetime ? new Date(datetime) : new Date(),
                // DATA INTEGRITY: Do NOT fabricate rawDescription. Set hasFullText: false.
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
      providerKey: this.providerKey,
      jobs,
      success: true,
      durationMs: Date.now() - startTime,
      jobsDiscovered: discoveredCount,
      jobsRejected: rejectedCount,
    };
  }
}
