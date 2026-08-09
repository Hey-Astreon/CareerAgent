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
  parseRemoteScope,
  determineOpportunitySignals,
} from "./normalize";

export class HackerNewsProvider implements JobSourceProvider {
  name = "Hacker News (Who is Hiring)";
  providerKey = PlatformSource.HN_HIRING;
  timeoutMs = 12000;
  isOptional = true;

  async fetch(): Promise<ProviderResult> {
    const startTime = Date.now();
    const jobs: NormalizedJob[] = [];
    let discoveredCount = 0;
    let rejectedCount = 0;

    try {
      // 1. Find latest "Who is hiring?" thread story ID via Algolia HN API
      const searchUrl =
        'https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query="Who%20is%20hiring"';
      const searchRes = await axios.get(searchUrl, { timeout: 6000 });

      if (
        searchRes.data &&
        Array.isArray(searchRes.data.hits) &&
        searchRes.data.hits.length > 0
      ) {
        const latestThread = searchRes.data.hits[0];
        const storyId = latestThread.objectID;
        const threadTitle = latestThread.title || "HN Who is Hiring";

        // 2. Fetch full comment tree for the latest hiring thread
        const itemUrl = `https://hn.algolia.com/api/v1/items/${storyId}`;
        const itemRes = await axios.get(itemUrl, { timeout: 8000 });

        if (itemRes.data && Array.isArray(itemRes.data.children)) {
          const comments = itemRes.data.children;

          for (const comment of comments) {
            if (!comment.text) continue;

            const rawText = comment.text;
            const lowerText = rawText.toLowerCase();

            // Filter for remote mentions
            if (
              !lowerText.includes("remote") &&
              !lowerText.includes("wfh") &&
              !lowerText.includes("anywhere")
            ) {
              continue;
            }

            discoveredCount++;

            // Clean HTML text from HN comment
            const $ = cheerio.load(rawText);
            const plainText = $.text().trim();
            const lines = plainText.split("\n").map((l) => l.trim()).filter(Boolean);

            if (lines.length < 1) continue;

            // Parse first line (typically: Company Name | Role Title | Location | Remote Status | Tech)
            const headerLine = lines[0];
            const parts = headerLine.split("|").map((p) => p.trim());

            let companyName = parts[0] || "HN Hiring Startup";
            let roleTitle = parts.length > 1 ? parts[1] : parts[0];
            const locationStr = parts.length > 2 ? parts[2] : "Remote";

            // If header line wasn't pipe-separated, extract company and title from text
            if (parts.length === 1) {
              const words = headerLine.split(" ");
              companyName = words.slice(0, 2).join(" ");
              roleTitle = headerLine;
            }

            // Extract apply URL from comment HTML if available
            let applyUrl = `https://news.ycombinator.com/item?id=${comment.id}`;
            const links: string[] = [];
            $("a").each((_, el) => {
              const href = $(el).attr("href");
              if (
                href &&
                href.startsWith("http") &&
                !href.includes("ycombinator.com")
              ) {
                links.push(href);
              }
            });

            if (links.length > 0) {
              applyUrl = links[0];
            }

            // Strict Candidate Filtering (0-3 Yrs Remote Developer)
            if (!isStrictlyRemoteDeveloperRole(roleTitle, locationStr, plainText)) {
              rejectedCount++;
              continue;
            }

            const { company, companySlug } = cleanCompanySlug(companyName);
            const postedAt = comment.created_at ? new Date(comment.created_at) : null;
            const validPostedAt = postedAt && !isNaN(postedAt.getTime()) ? postedAt : null;
            const remoteScope = parseRemoteScope(locationStr, plainText);
            const opportunitySignals = determineOpportunitySignals({
              postedAt: validPostedAt,
              applicationUrlType: "COMMUNITY_POST",
              canonicalAppUrl: applyUrl,
              providerKey: PlatformSource.HN_HIRING,
            });

            jobs.push({
              sourceJobId: String(comment.id),
              providerKey: PlatformSource.HN_HIRING,
              company,
              companySlug,
              title: roleTitle.slice(0, 100),
              category: determineCategory(roleTitle, plainText),
              jobType: determineJobType(roleTitle, plainText),
              experienceLevel: determineExperienceLevel(roleTitle, plainText),
              location: locationStr ? `Remote (${locationStr})` : "Remote",
              isRemote: true,
              remoteRegion: locationStr || "Worldwide",
              remoteScope,
              discoveryUrl: `https://news.ycombinator.com/item?id=${comment.id}`,
              canonicalAppUrl: applyUrl,
              applicationUrlType: "COMMUNITY_POST",
              verificationStatus: "COMMUNITY_SUBMITTED",
              postedAt: validPostedAt,
              opportunitySignals,
              rawDescription: plainText,
              hasFullText: plainText.length > 50,
              metadata: {
                threadTitle,
                commentId: comment.id,
                author: comment.author,
              },
            });
          }
        }
      }
    } catch (err) {
      console.warn(
        "[Hacker News Provider Warning] Query failed:",
        (err as Error).message
      );
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
