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
  "web developer", "python developer", "data engineer", "devops",
];

const EXCLUDED_TITLES = [
  "account executive", "recruiter", "talent acquisition", "legal", "counsel",
  "customer support", "customer success manager", "deal strategist", "sales",
  "operations analyst", "human resources", "hr ", "marketing", "accountant",
  "financial analyst", "director", "vp ", "vice president", "chief ", "cto",
  "ceo", "cfo", "coo", "head of", "general manager", "solutions architect",
  "forward deployed", // Always field-facing senior role at companies like GitLab, Palantir
  "field engineer",   // Senior customer-facing engineering
  "technical account", // TAM/TAE roles are client-facing senior
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

// ─── Utility Functions ────────────────────────────────────────────────────────

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
 * Word-boundary safe check — prevents "internals" matching "intern", etc.
 */
function containsWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
  return regex.test(text);
}

// ─── Classification Functions ─────────────────────────────────────────────────

/**
 * BUG FIXED: Previously, "systems" in description matched "Backend Developer"
 * for ANY job mentioning systems (e.g. "systems thinking", "distributed systems").
 * Now uses ordered, title-first priority with proper specificity.
 */
export function determineCategory(title: string, description: string = ""): string {
  const t = title.toLowerCase();
  const d = description.toLowerCase();

  // 1. Check TITLE first (most reliable signal) with specificity order
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

  // 2. Fall back to description signals (secondary, less precise)
  if (d.includes("python") && !d.includes("javascript")) return "Python Developer";
  if (d.includes("machine learning") || d.includes("llm") || d.includes("neural network")) return "AI / ML Engineer";
  if (d.includes("devops") || d.includes("ci/cd pipelines")) return "DevOps Engineer";
  if (d.includes("react") || d.includes("vue") || d.includes("angular") || d.includes("css") || d.includes("html")) return "Frontend Developer";

  // 3. Generic fallback — if it passed the SWE filter but nothing more specific matched
  return "Software Developer";
}

/**
 * BUG FIXED: Previously used text.includes("intern") which matched:
 *   "internals" → Git internals → false "Remote Internship" classification
 *   "international" → false positive
 *   "internal tooling" → false positive
 * Now uses word-boundary regex check.
 */
export function determineJobType(title: string, description: string = ""): string {
  const text = (title + " " + description).toLowerCase();

  // Word-boundary safe checks — prevents "internals" from matching "intern"
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

/**
 * BUG FIXED: Previously returned "0-3 Years (Entry/Junior)" as a catch-all for
 * ANY role that didn't explicitly say junior/fresher — including Staff-level,
 * Principal, and Lead Engineer roles. Now detects senior signals properly.
 */
export function determineExperienceLevel(title: string, description: string = ""): string {
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  const fullText = t + " " + d;

  // First: check for explicit SENIOR / STAFF / LEAD signals in TITLE
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

  // Second: check description body for senior experience requirements
  const hasSeniorDescSignal = SENIOR_DESC_SIGNALS.some((sig) => fullText.includes(sig));
  if (hasSeniorDescSignal) {
    return "Senior / Staff Level (5+ Yrs)";
  }

  // Third: Internship / Entry / Fresher signals
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

  // Fourth: Junior / Associate signals
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

  // Fifth: Mid-level catch (2-4 years experience mentioned)
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

  // Default: Only reach here if no signals found → treat as "0-3 Years"
  return "0-3 Years (Entry/Junior)";
}

/**
 * BUG FIXED: Previously only checked TITLE for senior/staff/principal.
 * "Staff Forward Deployed Engineer" had "Staff" inside H2 of description body,
 * not in the Greenhouse API title field — so it slipped through the filter.
 * Also added: "forward deployed", "field engineer", "solutions architect"
 * as role exclusions (always senior customer-facing, NOT entry-level SWE).
 */
function isStrictlyRemoteAndEarlyCareer(title: string, location: string, description: string): boolean {
  const lowerTitle = title.toLowerCase();
  const lowerLoc = location.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // ── 1. Exclude On-Site / Hybrid / In-Office jobs ─────────────────────────
  const isOnSite = ONSITE_KEYWORDS.some((kw) => lowerLoc.includes(kw) || lowerDesc.includes(kw));
  if (isOnSite) return false;

  // ── 2. Must have explicit Remote indicator ────────────────────────────────
  const isRemote =
    lowerLoc.includes("remote") ||
    lowerLoc.includes("anywhere") ||
    lowerLoc.includes("global") ||
    lowerLoc.includes("united states") ||
    lowerLoc.includes("india") ||
    lowerLoc.includes("worldwide") ||
    lowerLoc.includes("ireland") ||
    lowerLoc.includes("denmark") ||
    lowerLoc.includes("france") ||
    lowerLoc.includes("germany") ||
    lowerLoc.includes("uk") ||
    lowerLoc.includes("united kingdom") ||
    lowerDesc.includes("remote work") ||
    lowerDesc.includes("work from home") ||
    lowerDesc.includes("fully remote") ||
    lowerDesc.includes("work remotely") ||
    lowerDesc.includes("remote-first") ||
    lowerDesc.includes("all remote") ||
    lowerDesc.includes("all-remote");

  if (!isRemote) return false;

  // ── 3. Exclude non-tech / sales / senior field roles by title ─────────────
  const isExcluded = EXCLUDED_TITLES.some((ex) => lowerTitle.includes(ex));
  if (isExcluded) return false;

  // ── 4. Exclude Senior / Staff / Principal by TITLE ───────────────────────
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

  // ── 5. Exclude Senior / Staff signals in DESCRIPTION BODY (critical fix) ──
  const hasSeniorDescSignal = SENIOR_DESC_SIGNALS.some((sig) => lowerDesc.includes(sig));
  if (hasSeniorDescSignal) return false;

  // ── 6. Must match SWE / AI / Web keywords in TITLE ───────────────────────
  return SWE_TITLE_KEYWORDS.some((kw) => lowerTitle.includes(kw));
}

// ─── Scrapers ─────────────────────────────────────────────────────────────────

/**
 * Scrapes Greenhouse public API board endpoint with strict Remote & Early Career filtering.
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
 * Scrapes Lever public API endpoint with strict Remote & Early Career filtering.
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
