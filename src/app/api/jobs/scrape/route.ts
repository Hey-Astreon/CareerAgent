import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapeGreenhouseCompany, scrapeLeverCompany, ScrapedJob } from "@/lib/scrapers/ats";
import { scrapeYCJobs } from "@/lib/scrapers/playwright";

// Top remote engineering tech companies using Greenhouse / Lever ATS
const TARGET_GREENHOUSE_COMPANIES = ["vercel", "stripe", "gitlab", "discord", "cloudflare"];
const TARGET_LEVER_COMPANIES = ["anthropic", "palantir", "scaleai"];

export async function POST() {
  try {
    const allScraped: ScrapedJob[] = [];

    // 1. Run Greenhouse scrapers
    for (const company of TARGET_GREENHOUSE_COMPANIES) {
      const companyJobs = await scrapeGreenhouseCompany(company);
      allScraped.push(...companyJobs);
    }

    // 2. Run Lever scrapers
    for (const company of TARGET_LEVER_COMPANIES) {
      const companyJobs = await scrapeLeverCompany(company);
      allScraped.push(...companyJobs);
    }

    // 3. Run YC Playwright scraper
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
            platform: job.platform,
            location: job.location,
            isRemote: job.isRemote,
            applicantCount: job.applicantCount,
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
      take: 20,
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
      take: 20,
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
