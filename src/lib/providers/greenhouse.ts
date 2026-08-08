import axios from "axios";
import { PlatformSource } from "@prisma/client";
import { JobSourceProvider, NormalizedJob, ProviderResult } from "./types";
import {
  cleanCompanySlug,
  cleanHtmlText,
  determineCategory,
  determineJobType,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
} from "./normalize";

const TARGET_GREENHOUSE_COMPANIES = [
  "vercel", "stripe", "gitlab", "discord", "cloudflare",
  "coinbase", "doordash", "hashicorp", "automattic", "elastic",
  "reddit", "airtable", "webflow", "sourcegraph", "zapier",
  "docker", "datadog", "sentry", "cockroachlabs", "databricks", "mongodb"
];

export class GreenhouseProvider implements JobSourceProvider {
  name = "Greenhouse ATS";
  providerKey = PlatformSource.GREENHOUSE;
  timeoutMs = 12000;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    const companyFetches = TARGET_GREENHOUSE_COMPANIES.map(async (companySlug) => {
      try {
        const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs?content=true`;
        const res = await axios.get(apiUrl, { timeout: 6000 });

        if (res.data && Array.isArray(res.data.jobs)) {
          const companyJobs: NormalizedJob[] = [];
          let companyDiscovered = 0;
          let companyRejected = 0;

          for (const item of res.data.jobs) {
            companyDiscovered++;
            const title = item.title || "";
            const locationName = item.location?.name || "";
            const rawContent = cleanHtmlText(item.content || "");
            const jobUrl = item.absolute_url;

            if (!isStrictlyRemoteDeveloperRole(title, locationName, rawContent)) {
              companyRejected++;
              continue;
            }

            const { company, companySlug: normSlug } = cleanCompanySlug(companySlug);

            companyJobs.push({
              sourceJobId: String(item.id),
              providerKey: PlatformSource.GREENHOUSE,
              company,
              companySlug: normSlug,
              title,
              category: determineCategory(title, rawContent),
              jobType: determineJobType(title, rawContent),
              experienceLevel: determineExperienceLevel(title, rawContent),
              location: "100% Remote",
              isRemote: true,
              remoteRegion: "Worldwide",
              discoveryUrl: jobUrl,
              canonicalAppUrl: jobUrl,
              postedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
              rawDescription: rawContent,
              hasFullText: true,
            });
          }

          return { companyJobs, companyDiscovered, companyRejected };
        }
      } catch {
        // Ignore single company board errors (e.g. 404)
      }
      return { companyJobs: [], companyDiscovered: 0, companyRejected: 0 };
    });

    const results = await Promise.all(companyFetches);
    for (const r of results) {
      jobs.push(...r.companyJobs);
      discoveredCount += r.companyDiscovered;
      rejectedCount += r.companyRejected;
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
