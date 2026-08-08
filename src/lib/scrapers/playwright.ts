import { chromium } from "playwright";
import { PlatformSource } from "@prisma/client";
import { ScrapedJob, determineCategory, determineJobType, determineExperienceLevel, isStrictlyRemoteDeveloperRole } from "./ats";
import { generateUrlHash } from "./dedup";

/**
 * Scrapes YC Work at a Startup (https://www.ycombinator.com/jobs).
 * Strictly enforces developer/coding role filter.
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

    const jobCards = await page.$$("a[href*='/companies/'][href*='/jobs/']");

    for (let i = 0; i < Math.min(jobCards.length, 20); i++) {
      const card = jobCards[i];

      const jobUrl = await card.getAttribute("href").catch(() => null);
      if (!jobUrl || !jobUrl.startsWith("http")) continue;

      const cardText = await card.innerText().catch(() => "");
      const lines = cardText.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 1) continue;

      const title = lines[0] || "";
      const company = lines[1] || "";

      if (!title || title.length < 3) continue;
      const rawDescription = lines.slice(2).join(" ").trim();

      // Strictly enforce coding & developer role filter
      if (!isStrictlyRemoteDeveloperRole(title, "Remote", rawDescription)) {
        continue;
      }

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
