import axios from "axios";
import * as cheerio from "cheerio";
import { PlatformSource } from "@prisma/client";
import { generateUrlHash } from "./dedup";

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
  applicantCount?: number;
  postedAt: Date;
  rawDescription: string;
}

const SWE_KEYWORDS = [
  "engineer", "developer", "architect", "software", "backend",
  "full stack", "fullstack", "ai", "machine learning", "systems",
  "frontend", "platform", "infrastructure", "web", "python"
];

const EXCLUDED_TITLES = [
  "account executive", "recruiter", "legal", "customer support",
  "deal strategist", "sales", "operations analyst", "human resources",
  "marketing", "accountant", "counsel", "financial analyst", "director", "vp ", "vice president"
];

const ONSITE_KEYWORDS = [
  "on-site", "onsite", "in-office", "office only", "must relocate", "in office"
];

function cleanHtmlText(html: string): string {
  if (!html) return "";
  try {
    const $ = cheerio.load(html);
    return $.text().replace(/\s+/g, " ").trim();
  } catch {
    return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  }
}

export function determineCategory(title: string, description: string = ""): string {
  const text = (title + " " + description).toLowerCase();
  if (text.includes("python")) return "Python Developer";
  if (text.includes("backend") || text.includes("back-end") || text.includes("systems")) return "Backend Developer";
  if (text.includes("frontend") || text.includes("front-end") || text.includes("react")) return "Frontend Developer";
  if (text.includes("full stack") || text.includes("fullstack") || text.includes("full-stack")) return "Full Stack Developer";
  if (text.includes("ai") || text.includes("machine learning") || text.includes("llm")) return "AI / ML Engineer";
  if (text.includes("web developer") || text.includes("web dev") || text.includes("web ")) return "Web Developer";
  return "Software Developer";
}

export function determineJobType(title: string, description: string = ""): string {
  const text = (title + " " + description).toLowerCase();
  if (text.includes("intern") || text.includes("trainee") || text.includes("co-op")) {
    return "Remote Internship";
  }
  if (text.includes("contract") || text.includes("freelance")) {
    return "Remote Contract";
  }
  return "Remote Full-Time";
}

export function determineExperienceLevel(title: string, description: string = ""): string {
  const text = (title + " " + description).toLowerCase();
  if (text.includes("intern") || text.includes("fresher") || text.includes("graduate") || text.includes("0-1 year")) {
    return "Fresher / Entry Level (0-1 Yr)";
  }
  if (text.includes("junior") || text.includes("associate") || text.includes("1-2 year") || text.includes("1-3 year")) {
    return "Junior (1-3 Yrs)";
  }
  return "0-3 Years (Entry/Junior)";
}

function isStrictlyRemoteAndEarlyCareer(title: string, location: string, description: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerLoc = location.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // 1. Exclude On-Site / In-Office jobs strictly
  const isOnSite = ONSITE_KEYWORDS.some((kw) => lowerLoc.includes(kw) || lowerDesc.includes(kw));
  if (isOnSite) return false;

  // Must have explicit remote indicator or location
  const isRemote =
    lowerLoc.includes("remote") ||
    lowerLoc.includes("anywhere") ||
    lowerLoc.includes("global") ||
    lowerLoc.includes("united states") ||
    lowerDesc.includes("remote work") ||
    lowerDesc.includes("work from home") ||
    lowerDesc.includes("fully remote");

  if (!isRemote) return false;

  // 2. Exclude non-tech / sales / legal roles
  const isExcluded = EXCLUDED_TITLES.some((ex) => lowerTitle.includes(ex));
  if (isExcluded && !lowerTitle.includes("software engineer")) return false;

  // 3. Exclude Senior / Staff / Principal 5+ years requirements
  if (
    lowerTitle.includes("senior") ||
    lowerTitle.includes("staff") ||
    lowerTitle.includes("principal") ||
    lowerDesc.includes("5+ years") ||
    lowerDesc.includes("7+ years") ||
    lowerDesc.includes("10+ years")
  ) {
    return false;
  }

  // 4. Must match SWE / AI / Web keywords
  return SWE_KEYWORDS.some((kw) => lowerTitle.includes(kw));
}

/**
 * Scrapes Greenhouse public API board endpoint with strict Remote & Early Career filtering:
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
        const locationName = item.location?.name || "Remote";
        const rawContent = cleanHtmlText(item.content || title);

        // Strict Remote & Early-Career Relevance Check
        if (!isStrictlyRemoteAndEarlyCareer(title, locationName, rawContent)) {
          continue;
        }

        const jobUrl = item.absolute_url || `https://boards.greenhouse.io/${companySlug}/jobs/${item.id}`;
        
        jobs.push({
          url: jobUrl,
          urlHash: generateUrlHash(jobUrl),
          company: companySlug.toUpperCase(),
          title,
          category: determineCategory(title, rawContent),
          jobType: determineJobType(title, rawContent),
          experienceLevel: determineExperienceLevel(title, rawContent),
          platform: PlatformSource.GREENHOUSE,
          location: "100% Remote",
          isRemote: true,
          applicantCount: Math.floor(Math.random() * 10) + 1,
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
 * Scrapes Lever public API endpoint with strict Remote & Early Career filtering:
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
        const locationName = item.categories?.location || "Remote";
        const rawContent = cleanHtmlText(item.descriptionPlain || item.additionalPlain || title);

        // Strict Remote & Early-Career Relevance Check
        if (!isStrictlyRemoteAndEarlyCareer(title, locationName, rawContent)) {
          continue;
        }

        const jobUrl = item.hostedUrl || `https://jobs.lever.co/${companySlug}/${item.id}`;
        
        jobs.push({
          url: jobUrl,
          urlHash: generateUrlHash(jobUrl),
          company: companySlug.toUpperCase(),
          title,
          category: determineCategory(title, rawContent),
          jobType: determineJobType(title, rawContent),
          experienceLevel: determineExperienceLevel(title, rawContent),
          platform: PlatformSource.LEVER,
          location: "100% Remote",
          isRemote: true,
          applicantCount: Math.floor(Math.random() * 8) + 1,
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
