import axios from "axios";
import * as cheerio from "cheerio";
import { PlatformSource } from "@prisma/client";
import { ScrapedJob, determineCategory, determineJobType, determineExperienceLevel } from "./ats";
import { generateUrlHash } from "./dedup";

/**
 * Scrapes real, live Remote Software Engineering jobs directly from LinkedIn's public guest search API.
 * No login needed, 100% genuine live LinkedIn job view URLs (https://www.linkedin.com/jobs/view/...).
 */
export async function scrapeLinkedInRemoteJobs(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
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
      // f_WT=2 is LinkedIn's official filter for "Remote"
      const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedQuery}&location=Remote&f_WT=2&start=0`;

      const res = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        timeout: 10000,
      });

      if (res.data) {
        const $ = cheerio.load(res.data);

        $("li").each((_, el) => {
          const title = $(el).find(".base-search-card__title").text().trim();
          const company = $(el).find(".base-search-card__subtitle").text().trim();
          const rawLocation = $(el).find(".job-search-card__location").text().trim();
          const link = $(el).find("a.base-card__full-link").attr("href");
          const datetime = $(el).find("time").attr("datetime");

          if (title && link && link.includes("/jobs/view/")) {
            // Clean URL to direct public view page
            const cleanUrl = link.split("?")[0];
            const lowerTitle = title.toLowerCase();

            // Guard against Senior / Staff roles
            if (
              lowerTitle.includes("senior") ||
              lowerTitle.includes("staff") ||
              lowerTitle.includes("principal") ||
              lowerTitle.includes("lead") ||
              lowerTitle.includes("director") ||
              lowerTitle.includes("head of") ||
              lowerTitle.includes("manager")
            ) {
              return;
            }

            jobs.push({
              url: cleanUrl,
              urlHash: generateUrlHash(cleanUrl),
              company: company.toUpperCase() || "LINKEDIN POSTING",
              title,
              category: determineCategory(title, title),
              jobType: determineJobType(title, title),
              experienceLevel: determineExperienceLevel(title, title),
              platform: PlatformSource.LINKEDIN,
              location: rawLocation ? `Remote (${rawLocation})` : "100% Remote",
              isRemote: true,
              postedAt: datetime ? new Date(datetime) : new Date(),
              rawDescription: `Live LinkedIn Remote Posting for ${title} at ${company}. Location: ${rawLocation || "Remote"}. Apply directly on LinkedIn.`,
            });
          }
        });
      }
    } catch (err) {
      console.warn(`[LinkedIn Scraper Warning] Query "${query}" failed:`, (err as Error).message);
    }
  }

  return jobs;
}
