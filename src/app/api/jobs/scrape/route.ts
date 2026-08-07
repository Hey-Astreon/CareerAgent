import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeGreenhouseCompany, scrapeLeverCompany, ScrapedJob } from "@/lib/scrapers/ats";
import { scrapeAshbyCompany } from "@/lib/scrapers/ashby";
import { scrapeLinkedInRemoteJobs } from "@/lib/scrapers/linkedin";
import { scrapeYCJobs } from "@/lib/scrapers/playwright";

// Verified high-impact public Greenhouse boards
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

// Verified public Lever boards
const TARGET_LEVER_COMPANIES = ["scaleai", "brex"];

// Verified public Ashby boards
const TARGET_ASHBY_COMPANIES = ["linear", "supabase", "ramp"];

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

    // Deduplicate & save new jobs to SQLite database
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

    // Fetch updated jobs list
    const activeJobs = await db.jobPosting.findMany({
      orderBy: { postedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      scrapedTotal: allScraped.length,
      newJobsInserted: insertedCount,
      jobs: activeJobs,
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
    const jobs = await db.jobPosting.findMany({
      orderBy: { postedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve job postings" },
      { status: 500 }
    );
  }
}
