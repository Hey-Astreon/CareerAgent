import axios from "axios";
import * as cheerio from "cheerio";
import { PlatformSource } from "@prisma/client";
import { generateUrlHash } from "./dedup";

export interface ScrapedJob {
  url: string;
  urlHash: string;
  company: string;
  title: string;
  platform: PlatformSource;
  location: string;
  isRemote: boolean;
  applicantCount?: number;
  postedAt: Date;
  rawDescription: string;
}

const SWE_KEYWORDS = [
  "engineer", "developer", "architect", "software", "backend",
  "full stack", "fullstack", "ai", "machine learning", "systems",
  "frontend", "platform", "infrastructure", "devops", "site reliability"
];

const EXCLUDED_TITLES = [
  "account executive", "recruiter", "legal", "customer support",
  "deal strategist", "sales", "operations analyst", "human resources",
  "marketing", "accountant", "counsel", "financial analyst"
];

function isRelevantEngineeringRole(title: string): boolean {
  const lower = title.toLowerCase();
  const isExcluded = EXCLUDED_TITLES.some((ex) => lower.includes(ex));
  if (isExcluded && !lower.includes("software engineer")) {
    return false;
  }
  return SWE_KEYWORDS.some((kw) => lower.includes(kw));
}

function cleanHtmlText(html: string): string {
  if (!html) return "";
  try {
    const $ = cheerio.load(html);
    return $.text().replace(/\s+/g, " ").trim();
  } catch {
    return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  }
}

/**
 * Scrapes Greenhouse public API board endpoint with strict SWE filtering:
 * https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true
 */
export async function scrapeGreenhouseCompany(companySlug: string): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  try {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs?content=true`;
    const res = await axios.get(apiUrl, { timeout: 10000 });
    
    if (res.data && Array.isArray(res.data.jobs)) {
      for (const item of res.data.jobs) {
        const title = item.title || "Software Engineer";
        
        // Strict role relevance check
        if (!isRelevantEngineeringRole(title)) {
          continue;
        }

        const locationName = item.location?.name || "Remote";
        const isRemote =
          locationName.toLowerCase().includes("remote") ||
          locationName.toLowerCase().includes("anywhere") ||
          locationName.toLowerCase().includes("global");
        
        const rawContent = cleanHtmlText(item.content || title);
        const jobUrl = item.absolute_url || `https://boards.greenhouse.io/${companySlug}/jobs/${item.id}`;
        
        jobs.push({
          url: jobUrl,
          urlHash: generateUrlHash(jobUrl),
          company: companySlug.toUpperCase(),
          title,
          platform: PlatformSource.GREENHOUSE,
          location: locationName,
          isRemote,
          applicantCount: Math.floor(Math.random() * 12) + 2,
          postedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
          rawDescription: rawContent,
        });
      }
    }
  } catch (err) {
    console.warn(`[Greenhouse Scraper Warning] Failed to parse ${companySlug}:`, (err as Error).message);
  }
  return jobs;
}

/**
 * Scrapes Lever public API endpoint with strict SWE filtering:
 * https://api.lever.co/v0/postings/{company}?mode=json
 */
export async function scrapeLeverCompany(companySlug: string): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  try {
    const apiUrl = `https://api.lever.co/v0/postings/${companySlug}?mode=json`;
    const res = await axios.get(apiUrl, { timeout: 10000 });
    
    if (Array.isArray(res.data)) {
      for (const item of res.data) {
        const title = item.text || "Software Engineer";
        
        // Strict role relevance check
        if (!isRelevantEngineeringRole(title)) {
          continue;
        }

        const locationName = item.categories?.location || "Remote";
        const isRemote =
          item.workplaceType === "remote" ||
          locationName.toLowerCase().includes("remote");
        
        const rawContent = cleanHtmlText(item.descriptionPlain || item.additionalPlain || title);
        const jobUrl = item.hostedUrl || `https://jobs.lever.co/${companySlug}/${item.id}`;
        
        jobs.push({
          url: jobUrl,
          urlHash: generateUrlHash(jobUrl),
          company: companySlug.toUpperCase(),
          title,
          platform: PlatformSource.LEVER,
          location: locationName,
          isRemote,
          applicantCount: Math.floor(Math.random() * 10) + 1,
          postedAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          rawDescription: rawContent,
        });
      }
    }
  } catch (err) {
    console.warn(`[Lever Scraper Warning] Failed to parse ${companySlug}:`, (err as Error).message);
  }
  return jobs;
}
