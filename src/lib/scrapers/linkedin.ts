import axios from "axios";
import * as cheerio from "cheerio";
import { PlatformSource } from "@prisma/client";
import { ScrapedJob, determineCategory, determineJobType, determineExperienceLevel, isStrictlyRemoteDeveloperRole } from "./ats";
import { generateUrlHash } from "./dedup";

/**
 * Scrapes real, live Remote Software Engineering jobs directly from LinkedIn's public guest search API.
 * Strictly enforces developer/coding role filter — non-coding jobs are dropped.
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
            const cleanUrl = link.split("?")[0];

            // Strictly enforce coding & remote developer role filter
            if (!isStrictlyRemoteDeveloperRole(title, rawLocation, title)) {
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
              location: rawLocation ? `Remote (${rawLocation})` : "Remote",
              isRemote: true,
              postedAt: datetime ? new Date(datetime) : null,
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
