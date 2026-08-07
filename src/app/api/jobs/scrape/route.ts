import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeGreenhouseCompany, scrapeLeverCompany, ScrapedJob } from "@/lib/scrapers/ats";
import { scrapeAshbyCompany } from "@/lib/scrapers/ashby";
import { scrapeLinkedInRemoteJobs } from "@/lib/scrapers/linkedin";
import { scrapeYCJobs } from "@/lib/scrapers/playwright";

const TARGET_GREENHOUSE_COMPANIES = [
  "vercel",
  "stripe",
  "gitlab",
  "discord",
  "cloudflare",
  "coinbase",
  "doordash",
  "hashicorp",
  "automattic",
  "elastic",
  "reddit",
  "airtable",
  "webflow",
  "sourcegraph",
  "zapier",
  "docker",
  "datadog",
  "sentry",
  "cockroachlabs",
  "databricks",
  "mongodb",
];

const TARGET_LEVER_COMPANIES = ["scaleai", "brex"];
const TARGET_ASHBY_COMPANIES = ["linear", "supabase", "ramp"];

/**
 * Interleaves jobs from different platforms (LinkedIn, Ashby, Greenhouse, Lever, YC)
 * in round-robin fashion so candidates see a rich mix on page load rather than 50 Greenhouse jobs in a row.
 */
function interleavePlatforms<T extends { platform: string }>(jobsList: T[]): T[] {
  const groups: Record<string, T[]> = {};
  for (const item of jobsList) {
    const key = item.platform || "OTHER";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  const keys = Object.keys(groups);
  const result: T[] = [];
  let added = true;
  let idx = 0;

  while (added) {
    added = false;
    for (const k of keys) {
      if (idx < groups[k].length) {
        result.push(groups[k][idx]);
        added = true;
      }
    }
    idx++;
  }

  return result;
}

export async function POST() {
  try {
    const allScraped: ScrapedJob[] = [];

    // 1. Run LinkedIn Remote Jobs scraper (Real Live LinkedIn Postings)
    console.log("Ingesting LinkedIn Remote Jobs...");
    const linkedinJobs = await scrapeLinkedInRemoteJobs();
    allScraped.push(...linkedinJobs);

    // 2. Run Greenhouse scrapers
    console.log("Ingesting Greenhouse Company Boards...");
    for (const company of TARGET_GREENHOUSE_COMPANIES) {
      const companyJobs = await scrapeGreenhouseCompany(company);
      allScraped.push(...companyJobs);
    }

    // 3. Run Lever scrapers
    console.log("Ingesting Lever Company Boards...");
    for (const company of TARGET_LEVER_COMPANIES) {
      const companyJobs = await scrapeLeverCompany(company);
      allScraped.push(...companyJobs);
    }

    // 4. Run Ashby scrapers
    console.log("Ingesting Ashby Company Boards...");
    for (const company of TARGET_ASHBY_COMPANIES) {
      const companyJobs = await scrapeAshbyCompany(company);
      allScraped.push(...companyJobs);
    }

    // 5. Run YC Playwright scraper
    console.log("Ingesting YC Remote Jobs...");
    const ycJobs = await scrapeYCJobs();
    allScraped.push(...ycJobs);

    let insertedCount = 0;

    for (const job of allScraped) {
      const existing = await db.jobPosting.findUnique({
        where: { urlHash: job.urlHash },
      });

      if (!existing) {
        await db.jobPosting.create({
          data: {
            urlHash: job.urlHash,
            url: job.url,
            company: job.company,
            title: job.title,
            category: job.category || "Software Developer",
            jobType: job.jobType || "Remote Full-Time",
            experienceLevel: job.experienceLevel || "0-3 Years (Entry/Junior)",
            platform: job.platform,
            location: job.location,
            isRemote: job.isRemote,
            postedAt: job.postedAt,
            rawDescription: job.rawDescription,
          },
        });
        insertedCount++;
      }
    }

    const rawActive = await db.jobPosting.findMany({
      orderBy: { postedAt: "desc" },
      take: 500,
    });

    const mixedJobs = interleavePlatforms(rawActive);

    return NextResponse.json({
      success: true,
      scrapedTotal: allScraped.length,
      newJobsInserted: insertedCount,
      jobs: mixedJobs,
    });
  } catch (error) {
    console.error("Scraper API Error:", error);
    return NextResponse.json(
      { success: false, error: "Scraping pipeline failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const rawActive = await db.jobPosting.findMany({
      orderBy: { postedAt: "desc" },
      take: 500,
    });

    const mixedJobs = interleavePlatforms(rawActive);

    return NextResponse.json({ success: true, jobs: mixedJobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve job postings" },
      { status: 500 }
    );
  }
}
