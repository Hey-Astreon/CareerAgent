import axios from "axios";
import * as cheerio from "cheerio";
import { PlatformSource } from "@prisma/client";
import { JobSourceProvider, NormalizedJob, ProviderResult } from "./types";
import {
  cleanCompanySlug,
  cleanHtmlText,
  determineCategory,
  determineJobType,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
  parseRemoteScope,
  determineOpportunitySignals,
} from "./normalize";

export class YCProvider implements JobSourceProvider {
  name = "Y Combinator Jobs";
  providerKey = PlatformSource.YC_JOBS;
  timeoutMs = 8000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      const url = "https://www.workatastartup.com/jobs?role=eng&remote=yes";
      const res = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 4000,
      });

      if (res.data) {
        const $ = cheerio.load(res.data);
        $(".job-row, .job-card, .company-row").each((_, element) => {
          discoveredCount++;
          const title = $(element).find(".job-name, .title, h3").text().trim();
          const companyName = $(element).find(".company-name, .company").text().trim();
          const href = $(element).find("a").attr("href");
          const rawDescription = cleanHtmlText($(element).find(".description, .details").text().trim());

          if (title && companyName && href) {
            const jobUrl = href.startsWith("http") ? href : `https://www.workatastartup.com${href}`;
            const match = jobUrl.match(/\/jobs\/(\d+)/);
            const jobId = match ? match[1] : undefined;

            if (!isStrictlyRemoteDeveloperRole(title, "Remote", rawDescription)) {
              rejectedCount++;
              return;
            }

            const { company, companySlug } = cleanCompanySlug(companyName);
            const remoteScope = parseRemoteScope("Remote", rawDescription);
            const opportunitySignals = determineOpportunitySignals({
              postedAt: null,
              applicationUrlType: "DIRECT_EMPLOYER_SITE",
              canonicalAppUrl: jobUrl,
              providerKey: PlatformSource.YC_JOBS,
            });

            jobs.push({
              sourceJobId: jobId,
              providerKey: PlatformSource.YC_JOBS,
              company,
              companySlug,
              title,
              category: determineCategory(title, rawDescription),
              jobType: determineJobType(title, rawDescription),
              experienceLevel: determineExperienceLevel(title, rawDescription),
              location: "Remote",
              isRemote: true,
              remoteRegion: undefined,
              remoteScope,
              discoveryUrl: jobUrl,
              canonicalAppUrl: jobUrl,
              applicationUrlType: "DIRECT_EMPLOYER_SITE",
              verificationStatus: "VERIFIED_AGGREGATOR",
              postedAt: null,
              opportunitySignals,
              rawDescription,
              hasFullText: rawDescription.length > 20,
            });
          }
        });
      }
    } catch (err) {
      console.warn("[YC Provider Warning] Sandbox parse attempt:", (err as Error).message);
    }

    return {
      providerKey: PlatformSource.YC_JOBS,
      jobs,
      success: true,
      durationMs: Date.now() - startTime,
      jobsDiscovered: discoveredCount,
      jobsRejected: rejectedCount,
    };
  }
}
