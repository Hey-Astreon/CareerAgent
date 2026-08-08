import axios from "axios";
import * as cheerio from "cheerio";
import { PlatformSource } from "@prisma/client";
import { JobSourceProvider, NormalizedJob, ProviderResult } from "./types";
import {
  cleanCompanySlug,
  determineCategory,
  determineJobType,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
} from "./normalize";

export class WellfoundProvider implements JobSourceProvider {
  name = "Wellfound Startup Jobs";
  providerKey = PlatformSource.WELLFOUND;
  timeoutMs = 8000;
  isOptional = true;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    const queryRoles = ["react-developer", "full-stack-developer", "backend-developer", "software-engineer", "python-developer"];

    for (const roleSlug of queryRoles) {
      try {
        const url = `https://wellfound.com/role/l/${roleSlug}/remote`;
        const response = await axios.get(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
          timeout: this.timeoutMs,
        });

        const $ = cheerio.load(response.data);

        // Parse job listing state script if present
        $("script[id='__NEXT_DATA__']").each((_, element) => {
          try {
            const jsonText = $(element).html();
            if (jsonText) {
              const parsed = JSON.parse(jsonText);
              const apolloState = parsed?.props?.pageProps?.apolloState || {};

              for (const key of Object.keys(apolloState)) {
                if (key.startsWith("JobListing:")) {
                  const item = apolloState[key];
                  if (item && item.title && item.id) {
                    discoveredCount++;
                    const companyName = item.startupName || item.companyName || "Wellfound Startup";
                    const title = item.title;
                    const jobUrl = item.url || `https://wellfound.com/jobs/${item.id}`;
                    const location = item.location || "Remote";
                    const rawDesc = item.description || title;

                    if (!isStrictlyRemoteDeveloperRole(title, location, rawDesc)) {
                      rejectedCount++;
                      continue;
                    }

                    const { company, companySlug } = cleanCompanySlug(companyName);

                    jobs.push({
                      sourceJobId: String(item.id),
                      providerKey: PlatformSource.WELLFOUND,
                      company,
                      companySlug,
                      title,
                      category: determineCategory(title, rawDesc),
                      jobType: determineJobType(title, rawDesc),
                      experienceLevel: determineExperienceLevel(title, rawDesc),
                      location: location ? `Remote (${location})` : "100% Remote",
                      isRemote: true,
                      remoteRegion: location || "Remote",
                      discoveryUrl: jobUrl,
                      canonicalAppUrl: jobUrl,
                      postedAt: item.postedAt ? new Date(item.postedAt) : new Date(),
                      rawDescription: rawDesc,
                      hasFullText: rawDesc.length > 30,
                    });
                  }
                }
              }
            }
          } catch {
            // Ignore parse errors
          }
        });
      } catch (err) {
        console.warn(`[Wellfound Provider Warning] Query ${roleSlug} failed:`, (err as Error).message);
      }
    }

    // ZERO fabricated fallback! Return real jobs or empty list.
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
