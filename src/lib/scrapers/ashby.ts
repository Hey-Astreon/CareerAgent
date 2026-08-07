import axios from "axios";
import { PlatformSource } from "@prisma/client";
import { ScrapedJob, determineCategory, determineJobType, determineExperienceLevel } from "./ats";
import { generateUrlHash } from "./dedup";

/**
 * Scrapes real live software engineering jobs directly from Ashby public job board APIs.
 * (Used by Linear, Supabase, Ramp, OpenAI, etc.)
 */
export async function scrapeAshbyCompany(companySlug: string): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  try {
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${companySlug}`;
    const res = await axios.get(apiUrl, { timeout: 10000 });

    if (res.data && Array.isArray(res.data.jobs)) {
      for (const item of res.data.jobs) {
        const title = item.title || "Software Engineer";
        const locationName = item.location || "Remote";
        const jobUrl = item.jobUrl || `https://jobs.ashbyhq.com/${companySlug}/${item.id}`;
        const rawContent = item.descriptionPlain || title;

        const lowerTitle = title.toLowerCase();
        const lowerLoc = locationName.toLowerCase();

        // 1. Must be Remote
        const isRemote =
          lowerLoc.includes("remote") ||
          lowerLoc.includes("anywhere") ||
          lowerLoc.includes("global") ||
          lowerLoc.includes("europe") ||
          lowerLoc.includes("united states") ||
          lowerLoc.includes("us") ||
          lowerLoc.includes("worldwide");

        if (!isRemote) continue;

        // 2. Filter out Senior / Staff / Principal / Lead roles
        if (
          lowerTitle.includes("senior") ||
          lowerTitle.includes("staff") ||
          lowerTitle.includes("principal") ||
          lowerTitle.includes("lead") ||
          lowerTitle.includes("director") ||
          lowerTitle.includes("head of") ||
          lowerTitle.includes("manager")
        ) {
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
          location: "100% Remote",
          isRemote: true,
          postedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
          rawDescription: rawContent,
        });
      }
    }
  } catch (err) {
    console.warn(`[Ashby Scraper Warning] Failed to parse ${companySlug}:`, (err as Error).message);
  }
  return jobs;
}
