import { NextRequest, NextResponse } from "next/server";
import { PlatformSource } from "@prisma/client";
import * as cheerio from "cheerio";
import { db } from "@/lib/db";
import { isSparseDescription, sourceTextToReadableText } from "@/lib/jobDescription";

const ALLOWED_SOURCE_HOSTS = new Set(["weworkremotely.com", "www.weworkremotely.com", "jobs.ashbyhq.com"]);

function isApprovedSourceHost(platform: PlatformSource, hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  if (platform === PlatformSource.WEWORKREMOTELY || platform === PlatformSource.ASHBY) return ALLOWED_SOURCE_HOSTS.has(normalizedHost);
  if (platform === PlatformSource.GREENHOUSE) return normalizedHost === "greenhouse.io" || normalizedHost.endsWith(".greenhouse.io");
  return false;
}

function selectLongestText(html: string, platform: PlatformSource): string {
  const $ = cheerio.load(html);
  const selectors = platform === PlatformSource.GREENHOUSE
    ? ["#content", "#app_body", ".job__description", "[data-mapped='true']", "article"]
    : ["#job_listing .listing-container", ".job_description", "#job_description", "[itemprop='description']", "article"];
  const candidates = selectors
    .map((selector) => sourceTextToReadableText($(selector).text()))
    .filter((value) => value.length > 0);
  return candidates.sort((left, right) => right.length - left.length)[0] ?? "";
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await db.jobPosting.findUnique({
    where: { id },
    select: { id: true, platform: true, url: true, rawDescription: true, hasFullText: true },
  });

  if (!job) return NextResponse.json({ success: false, error: "Job posting not found." }, { status: 404 });

  if (job.hasFullText && !isSparseDescription(job.rawDescription)) {
    return NextResponse.json({ success: true, description: job.rawDescription, source: "stored" });
  }

  const supportedPlatforms: PlatformSource[] = [PlatformSource.WEWORKREMOTELY, PlatformSource.GREENHOUSE, PlatformSource.ASHBY];
  if (!supportedPlatforms.includes(job.platform)) {
    return NextResponse.json({
      success: false,
      error: "This provider supplied a listing summary only. Open the original application page for the complete description.",
    }, { status: 409 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(job.url);
  } catch {
    return NextResponse.json({ success: false, error: "The stored source URL is invalid." }, { status: 422 });
  }
  if (sourceUrl.protocol !== "https:" || !isApprovedSourceHost(job.platform, sourceUrl.hostname)) {
    return NextResponse.json({ success: false, error: "This source URL is not approved for on-demand description retrieval." }, { status: 422 });
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "CareerAgent/2.0 (Job Detail Reader)" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ success: false, error: `The source page returned HTTP ${response.status}.` }, { status: 502 });

    const description = selectLongestText(await response.text(), job.platform);
    if (description.length < 180) {
      return NextResponse.json({ success: false, error: "The source page did not expose a complete readable description." }, { status: 422 });
    }

    await db.jobPosting.update({ where: { id: job.id }, data: { rawDescription: description, hasFullText: true } });
    return NextResponse.json({ success: true, description, source: "source_page" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to retrieve the source description." }, { status: 502 });
  }
}
