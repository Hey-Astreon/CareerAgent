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
  postedAt: Date;
  rawDescription: string;
}

// ─── Keyword Lists ────────────────────────────────────────────────────────────

const SWE_TITLE_KEYWORDS = [
  "engineer", "developer", "architect", "software", "backend", "back-end",
  "full stack", "fullstack", "full-stack", "ai engineer", "machine learning",
  "systems", "frontend", "front-end", "platform", "infrastructure",
  "web developer", "python developer", "data engineer", "devops", "sre",
  "mobile developer", "ios developer", "android developer", "coder", "programmer",
];

const EXCLUDED_TITLES = [
  // Sales & Business Development
  "account executive", "recruiter", "talent acquisition", "sales", "business development", "bde", "sdr", "bdr", "account manager", "growth manager", "deal strategist", "sales engineer",
  // Product Management & Project Management
  "product manager", "project manager", "program manager", "product owner", "scrum master", "agile coach",
  // Design & Content
  "designer", "ux", "ui designer", "product designer", "graphic designer", "content writer", "copywriter", "seo", "editor",
  // Support, Operations & Admin
  "support engineer", "technical support", "customer support", "customer success", "support specialist", "helpdesk", "community manager", "social media", "operations analyst", "human resources", "hr ", "people ops", "office manager", "executive assistant", "admin",
  // Legal, Finance & Executive
  "legal", "counsel", "compliance", "accountant", "financial analyst", "payroll", "director", "vp ", "vice president", "chief ", "cto", "ceo", "cfo", "coo", "head of", "general manager", "solutions architect",
  // Senior field/account roles
  "forward deployed", "field engineer", "technical account",
];

const ONSITE_KEYWORDS = [
  "on-site", "onsite", "in-office", "office only", "must relocate",
  "in office", "on site", "not remote", "hybrid"
];

// Seniority signals in DESCRIPTION body (not just title)
const SENIOR_DESC_SIGNALS = [
  "staff-level", "staff level", "principal engineer", "staff engineer",
  "lead engineer", "tech lead", "engineering manager", "senior engineer",
  "8+ years", "7+ years", "6+ years", "5+ years",
  "minimum 5 years", "minimum 6 years", "minimum 7 years", "minimum 8 years",
  "at least 5 years", "at least 6 years", "at least 7 years", "at least 8 years",
  "10+ years", "12+ years", "15+ years",
  "you have led", "you have managed", "you will lead", "will manage a team",
  "manage engineers", "people manager",
];

export function cleanHtmlText(html: string): string {
  if (!html) return "";
  try {
    const $ = cheerio.load(html);
    $("br").replaceWith("\n");
    $("p, div, h1, h2, h3, h4").each((_, el) => {
      $(el).prepend("\n\n");
    });
    $("li").each((_, el) => {
      $(el).prepend("\n• ");
    });

    const rawText = $.text();
    return rawText
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\r\n/g, "\n")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .trim();
  } catch {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<[^>]*>?/gm, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

function containsWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
  return regex.test(text);
}

// ─── Classification Functions ─────────────────────────────────────────────────

export function determineCategory(title: string, description: string = ""): string {
  const t = title.toLowerCase();
  const d = description.toLowerCase();

  if (t.includes("python")) return "Python Developer";
  if (t.includes("machine learning") || t.includes("ml engineer") || t.includes("llm") || t.includes("ai engineer")) return "AI / ML Engineer";
  if (t.includes("data engineer") || t.includes("data pipeline")) return "Data Engineer";
  if (t.includes("security engineer") || t.includes("appsec") || t.includes("devsecops")) return "Security / DevSecOps Engineer";
  if (t.includes("site reliability") || t.includes("sre")) return "Site Reliability Engineer";
  if (t.includes("devops")) return "DevOps Engineer";
  if (t.includes("infrastructure") || t.includes("infra engineer") || t.includes("platform engineer")) return "Infrastructure / Platform Engineer";
  if (t.includes("fullstack") || t.includes("full stack") || t.includes("full-stack")) return "Full Stack Developer";
  if (t.includes("frontend") || t.includes("front-end") || t.includes("ui engineer") || t.includes("ui developer")) return "Frontend Developer";
  if (t.includes("backend") || t.includes("back-end") || t.includes("api engineer")) return "Backend Developer";
  if (t.includes("web developer") || t.includes("web dev")) return "Web Developer";
  if (t.includes("mobile") || t.includes("ios") || t.includes("android")) return "Mobile Developer";

  if (d.includes("python") && !d.includes("javascript")) return "Python Developer";
  if (d.includes("machine learning") || d.includes("llm") || d.includes("neural network")) return "AI / ML Engineer";
  if (d.includes("devops") || d.includes("ci/cd pipelines")) return "DevOps Engineer";
  if (d.includes("react") || d.includes("vue") || d.includes("angular") || d.includes("css") || d.includes("html")) return "Frontend Developer";

  return "Software Developer";
}

export function determineJobType(title: string, description: string = ""): string {
  const text = (title + " " + description).toLowerCase();

  if (
    containsWord(text, "internship") ||
    containsWord(text, "intern") ||
    containsWord(text, "trainee") ||
    containsWord(text, "co-op") ||
    containsWord(text, "coop")
  ) {
    return "Remote Internship";
  }

  if (
    containsWord(text, "contract") ||
    containsWord(text, "freelance") ||
    containsWord(text, "contractor")
  ) {
    return "Remote Contract";
  }

  return "Remote Full-Time";
}

export function determineExperienceLevel(title: string, description: string = ""): string {
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  const fullText = t + " " + d;

  if (
    t.includes("staff") ||
    t.includes("principal") ||
    t.includes("tech lead") ||
    t.includes("lead engineer") ||
    t.includes("engineering manager") ||
    t.includes("senior") ||
    t.includes("sr.") ||
    t.includes("sr ") ||
    t.includes("manager")
  ) {
    return "Senior / Staff Level (5+ Yrs)";
  }

  const hasSeniorDescSignal = SENIOR_DESC_SIGNALS.some((sig) => fullText.includes(sig));
  if (hasSeniorDescSignal) {
    return "Senior / Staff Level (5+ Yrs)";
  }

  if (
    containsWord(fullText, "internship") ||
    containsWord(fullText, "intern") ||
    fullText.includes("fresher") ||
    fullText.includes("fresh graduate") ||
    fullText.includes("new grad") ||
    fullText.includes("recent graduate") ||
    fullText.includes("0-1 year") ||
    fullText.includes("0 to 1 year")
  ) {
    return "Fresher / Entry Level (0-1 Yr)";
  }

  if (
    fullText.includes("junior") ||
    fullText.includes("associate engineer") ||
    fullText.includes("1-2 year") ||
    fullText.includes("1-3 year") ||
    fullText.includes("entry level") ||
    fullText.includes("entry-level")
  ) {
    return "Junior (1-3 Yrs)";
  }

  if (
    fullText.includes("2+ years") ||
    fullText.includes("3+ years") ||
    fullText.includes("4+ years") ||
    fullText.includes("2-4 year") ||
    fullText.includes("mid-level") ||
    fullText.includes("mid level")
  ) {
    return "Mid-Level (2-4 Yrs)";
  }

  return "0-3 Years (Entry/Junior)";
}

/**
 * STRICT FILTER: Excludes non-coding, non-developer jobs, on-site roles, and senior/staff roles.
 */
export function isStrictlyRemoteDeveloperRole(title: string, location: string = "", description: string = ""): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerLoc = location.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // 1. Exclude non-coding / non-developer titles explicitly
  const isNonCodingExcluded = EXCLUDED_TITLES.some((ex) => lowerTitle.includes(ex));
  if (isNonCodingExcluded) return false;

  // 2. MUST contain a software engineering / developer title keyword
  const isCodingRole = SWE_TITLE_KEYWORDS.some((kw) => lowerTitle.includes(kw));
  if (!isCodingRole) return false;

  // 3. Exclude On-Site / Hybrid jobs or specific city locations lacking remote tags
  if (lowerLoc) {
    const isOnSiteKeyword = ONSITE_KEYWORDS.some((kw) => lowerLoc.includes(kw) || lowerDesc.includes(kw));
    if (isOnSiteKeyword) return false;

    // If location is specified (e.g. "Québec, QC", "Toronto, ON") but lacks any remote keywords, it is ON-SITE!
    const REMOTE_KEYWORDS = ["remote", "telecommute", "anywhere", "wfh", "work from home", "home-based", "virtual", "work from anywhere"];
    const hasRemoteKeyword = REMOTE_KEYWORDS.some((kw) => lowerLoc.includes(kw) || lowerTitle.includes(kw) || lowerDesc.includes(kw));
    if (!hasRemoteKeyword) return false;
  }

  // 4. Exclude Senior / Staff / Principal / Lead by TITLE
  if (
    lowerTitle.includes("senior") ||
    lowerTitle.includes("sr.") ||
    /\bsr\b/.test(lowerTitle) ||
    lowerTitle.includes("staff") ||
    lowerTitle.includes("principal") ||
    lowerTitle.includes("tech lead") ||
    lowerTitle.includes("lead engineer") ||
    lowerTitle.includes("manager") ||
    lowerTitle.includes("director") ||
    lowerTitle.includes("head of")
  ) {
    return false;
  }

  // 5. Exclude Senior / Staff signals in DESCRIPTION body
  if (lowerDesc) {
    const hasSeniorDescSignal = SENIOR_DESC_SIGNALS.some((sig) => lowerDesc.includes(sig));
    if (hasSeniorDescSignal) return false;
  }

  return true;
}

// ─── Scrapers ─────────────────────────────────────────────────────────────────

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
