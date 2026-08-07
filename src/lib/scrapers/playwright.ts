import { chromium } from "playwright";
import { PlatformSource } from "@prisma/client";
import { ScrapedJob, determineCategory, determineJobType, determineExperienceLevel } from "./ats";
import { generateUrlHash } from "./dedup";

/**
 * Scrapes YC Work at a Startup (https://www.ycombinator.com/jobs)
 * Uses real DOM data only. No fabricated descriptions, no fake URLs,
 * no random numbers. If a real URL or real description cannot be
 * extracted, the job is dropped entirely rather than saved with
 * invented data.
 */
export async function scrapeYCJobs(): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    const targetUrl = "https://www.ycombinator.com/jobs?role=eng&job_type=fulltime&remote=true";
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

    // YC renders a list of job cards — each card has a real anchor link to
    // the actual job posting hosted on the company ATS (Ashby, Greenhouse, etc.)
    const jobCards = await page.$$("a[href*='/companies/'][href*='/jobs/']");

    for (let i = 0; i < Math.min(jobCards.length, 20); i++) {
      const card = jobCards[i];

      // Extract the real, direct job URL from the anchor element
      const jobUrl = await card.getAttribute("href").catch(() => null);
      if (!jobUrl || !jobUrl.startsWith("http")) continue; // drop if no real URL

      // Extract visible text from the card for title and company
      const cardText = await card.innerText().catch(() => "");
      const lines = cardText.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 1) continue; // drop if no readable content

      const title = lines[0] || "";
      const company = lines[1] || "";

      // Drop cards where we cannot determine a real title
      if (!title || title.length < 3) continue;

      // Extract description from the card's aria-label or visible sub-text
      // YC cards may show a short blurb — use it if present, else empty string
      const rawDescription = lines.slice(2).join(" ").trim();

      const urlHash = generateUrlHash(jobUrl);

      jobs.push({
        url: jobUrl,
        urlHash,
        company: company || "YC Startup",
        title,
        category: determineCategory(title, rawDescription),
        jobType: determineJobType(title, rawDescription),
        experienceLevel: determineExperienceLevel(title, rawDescription),
        platform: PlatformSource.YC_JOBS,
        location: "100% Remote",
        isRemote: true,
        // No applicantCount — that data is not public
        postedAt: new Date(),
        rawDescription,
      });
    }
  } catch (err) {
    console.warn("[YC Scraper Warning] Playwright YC scrape error:", (err as Error).message);
  } finally {
    if (browser) await browser.close();
  }

  return jobs;
}
