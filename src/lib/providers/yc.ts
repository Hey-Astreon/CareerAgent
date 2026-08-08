import { chromium } from "playwright";
import { PlatformSource } from "@prisma/client";
import { JobSourceProvider, NormalizedJob, ProviderResult } from "./types";
import {
  cleanCompanySlug,
  determineCategory,
  determineJobType,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
} from "./normalize";

export class YCProvider implements JobSourceProvider {
  name = "YC Work at a Startup";
  providerKey = PlatformSource.YC_JOBS;
  timeoutMs = 10000;
  isOptional = true;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;
    let browser = null;

    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
      });

      const targetUrl = "https://www.ycombinator.com/jobs?role=eng&job_type=fulltime&remote=true";
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: this.timeoutMs });

      const jobCards = await page.$$("a[href*='/companies/'][href*='/jobs/']");

      for (let i = 0; i < Math.min(jobCards.length, 25); i++) {
        discoveredCount++;
        const card = jobCards[i];

        const jobUrl = await card.getAttribute("href").catch(() => null);
        if (!jobUrl || !jobUrl.startsWith("http")) continue;

        const cardText = await card.innerText().catch(() => "");
        const lines = cardText.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 1) continue;

        const title = lines[0] || "";
        const companyName = lines[1] || "YC Startup";

        if (!title || title.length < 3) continue;
        const rawDescription = lines.slice(2).join(" ").trim();

        if (!isStrictlyRemoteDeveloperRole(title, "Remote", rawDescription)) {
          rejectedCount++;
          continue;
        }

        const match = jobUrl.match(/\/jobs\/([a-zA-Z0-9_-]+)/);
        const jobId = match ? match[1] : undefined;
        const { company, companySlug } = cleanCompanySlug(companyName);

        jobs.push({
          sourceJobId: jobId,
          providerKey: PlatformSource.YC_JOBS,
          company,
          companySlug,
          title,
          category: determineCategory(title, rawDescription),
          jobType: determineJobType(title, rawDescription),
          experienceLevel: determineExperienceLevel(title, rawDescription),
          location: "100% Remote (Worldwide)",
          isRemote: true,
          remoteRegion: "Worldwide",
          discoveryUrl: jobUrl,
          canonicalAppUrl: jobUrl,
          postedAt: new Date(),
          rawDescription,
          hasFullText: rawDescription.length > 20,
        });
      }
    } catch (err) {
      console.warn("[YC Provider Warning] Playwright scraping failed:", (err as Error).message);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }

    return {
      providerKey: this.providerKey,
      jobs,
      success: true,
      durationMs: Date.now() - startTime,
      jobsDiscovered: discoveredCount,
      jobsRejected: rejectedCount,
    };
  }
}
