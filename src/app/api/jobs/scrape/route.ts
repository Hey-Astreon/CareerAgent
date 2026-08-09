import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runAllProviders, ingestNormalizedJobs } from "@/lib/providers/registry";
import { parseRemoteScope } from "@/lib/providers/normalize";

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
    console.log("[Discovery Engine Phase 1] Running provider registry concurrently...");
    
    // Execute all providers with bounded timeouts & failure isolation
    const { providerResults, allJobs, totalDiscovered, totalRejected } = await runAllProviders();

    // Dual-ingest into Opportunity/Occurrence and JobPosting
    const { insertedCount, updatedCount } = await ingestNormalizedJobs(allJobs);

    const STALENESS_SAFETY_NET_MS = 7 * 24 * 60 * 60 * 1000;
    const safetyCutoff = new Date(Date.now() - STALENESS_SAFETY_NET_MS);

    const rawActive = await db.jobPosting.findMany({
      where: {
        isExpired: false,
        lastSeenAt: { gte: safetyCutoff },
      },
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
      take: 500,
    });

    const populatedActive = rawActive.map((j) => {
      let scope = j.remoteScope;
      if (!scope || scope === "UNKNOWN") {
        scope = parseRemoteScope(j.location || "", j.rawDescription || "");
      }
      return { ...j, remoteScope: scope };
    });

    const mixedJobs = interleavePlatforms(populatedActive);

    return NextResponse.json({
      success: true,
      providerSummary: providerResults.map((p) => ({
        provider: p.providerKey,
        success: p.success,
        durationMs: p.durationMs,
        discovered: p.jobsDiscovered,
        error: p.error,
      })),
      totalDiscovered,
      totalRejected,
      newJobsInserted: insertedCount,
      jobsUpdated: updatedCount,
      jobs: mixedJobs,
    });
  } catch (error) {
    console.error("Scraper Pipeline Error:", error);
    return NextResponse.json(
      { success: false, error: "Scraping pipeline failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const STALENESS_SAFETY_NET_MS = 7 * 24 * 60 * 60 * 1000;
    const safetyCutoff = new Date(Date.now() - STALENESS_SAFETY_NET_MS);

    const rawActive = await db.jobPosting.findMany({
      where: {
        isExpired: false,
        lastSeenAt: { gte: safetyCutoff },
      },
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
      take: 500,
    });

    const populatedActive = rawActive.map((j) => {
      let scope = j.remoteScope;
      if (!scope || scope === "UNKNOWN") {
        scope = parseRemoteScope(j.location || "", j.rawDescription || "");
      }
      return { ...j, remoteScope: scope };
    });

    const mixedJobs = interleavePlatforms(populatedActive);

    return NextResponse.json({ success: true, jobs: mixedJobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve job postings" },
      { status: 500 }
    );
  }
}
