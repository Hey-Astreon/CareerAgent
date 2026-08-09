import axios from "axios";
import { PlatformSource } from "@prisma/client";
import { ScrapedJob, determineCategory, determineJobType, determineExperienceLevel, isStrictlyRemoteDeveloperRole } from "./ats";
import { generateUrlHash } from "./dedup";

/**
 * Scrapes real live software engineering jobs directly from Ashby public job board APIs.
 * Enforces strict developer & coding role filter — non-coding jobs are strictly dropped.
 */
export async function scrapeAshbyCompany(companySlug: string): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  try {
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${companySlug}`;
    const res = await axios.get(apiUrl, { timeout: 10000 });

    if (res.data && Array.isArray(res.data.jobs)) {
      for (const item of res.data.jobs) {
        const title = item.title || "";
        const locationName = item.location || "Remote";
        const jobUrl = item.jobUrl || `https://jobs.ashbyhq.com/${companySlug}/${item.id}`;
        const rawContent = item.descriptionPlain || title;

        // Strictly enforce remote developer & coding role filter
        if (!isStrictlyRemoteDeveloperRole(title, locationName, rawContent)) {
          continue;
        }

        jobs.push({
          url: jobUrl,
          urlHash: generateUrlHash(jobUrl),
          company: companySlug.toUpperCase(),
          title,
          category: determineCategory(title, rawContent),
          jobType: determineJobType(title, rawContent),
          experienceLevel: determineExperienceLevel(title, rawContent),
          platform: PlatformSource.ASHBY,
          location: locationName || "Remote",
          isRemote: true,
          postedAt: item.publishedAt ? new Date(item.publishedAt) : null,
          rawDescription: rawContent,
        });
      }
    }
  } catch (err) {
    console.warn(`[Ashby Scraper Warning] Failed to parse ${companySlug}:`, (err as Error).message);
  }
  return jobs;
}
