import axios from "axios";
import { PlatformSource } from "@prisma/client";
import { generateUrlHash } from "./dedup";
import {
  cleanHtmlText,
  determineCategory,
  determineJobType,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
  parseRemoteScope,
  formatRemoteScopeLabel,
} from "../providers/normalize";

export {
  cleanHtmlText,
  determineCategory,
  determineJobType,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
  parseRemoteScope,
  formatRemoteScopeLabel,
};

export interface ScrapedJob {
  url: string;
  urlHash: string;
  company: string;
  title: string;
  category: string;
  jobType: string;
  experienceLevel: string;
  platform: PlatformSource;
  location: string;
  isRemote: boolean;
  postedAt: Date | null;
  rawDescription: string;
}

export async function scrapeGreenhouseCompany(companySlug: string): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  try {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs?content=true`;
    const res = await axios.get(apiUrl, { timeout: 10000 });

    if (res.data && Array.isArray(res.data.jobs)) {
      for (const item of res.data.jobs) {
        const title = item.title || "";
        const locationName = item.location?.name || "";
        const rawContent = cleanHtmlText(item.content || "");
        const jobUrl = item.absolute_url;

        if (!isStrictlyRemoteDeveloperRole(title, locationName, rawContent)) {
          continue;
        }

        const postedAtRaw = item.first_published || null;
        const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
        const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;

        jobs.push({
          url: jobUrl,
          urlHash: generateUrlHash(jobUrl),
          company: companySlug.toUpperCase(),
          title,
          category: determineCategory(title, rawContent),
          jobType: determineJobType(title, rawContent),
          experienceLevel: determineExperienceLevel(title, rawContent),
          platform: PlatformSource.GREENHOUSE,
          location: locationName || "Remote",
          isRemote: true,
          postedAt: validPostedAt,
          rawDescription: rawContent,
        });
      }
    }
  } catch (err) {
    console.warn(`[Greenhouse Scraper Warning] Failed to parse ${companySlug}:`, (err as Error).message);
  }
  return jobs;
}

export async function scrapeLeverCompany(companySlug: string): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  try {
    const apiUrl = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;
    const res = await axios.get(apiUrl, { timeout: 10000 });

    if (Array.isArray(res.data)) {
      for (const item of res.data) {
        const title = item.text || "";
        const locationName = item.categories?.location || "";
        const rawContent = cleanHtmlText(item.descriptionPlain || item.description || "");
        const jobUrl = item.hostedUrl;

        if (!isStrictlyRemoteDeveloperRole(title, locationName, rawContent)) {
          continue;
        }

        const postedAt = item.createdAt ? new Date(item.createdAt) : null;
        const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;

        jobs.push({
          url: jobUrl,
          urlHash: generateUrlHash(jobUrl),
          company: companySlug.toUpperCase(),
          title,
          category: determineCategory(title, rawContent),
          jobType: determineJobType(title, rawContent),
          experienceLevel: determineExperienceLevel(title, rawContent),
          platform: PlatformSource.LEVER,
          location: locationName || "Remote",
          isRemote: true,
          postedAt: validPostedAt,
          rawDescription: rawContent,
        });
      }
    }
  } catch (err) {
    console.warn(`[Lever Scraper Warning] Failed to parse ${companySlug}:`, (err as Error).message);
  }
  return jobs;
}
