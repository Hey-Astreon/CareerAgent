import crypto from "crypto";
import { NormalizedJob } from "./types";

/**
 * Normalizes job posting URLs and produces a deterministic SHA-256 hash.
 */
export function generateUrlHash(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const cleanParams = new URLSearchParams();
    parsed.searchParams.forEach((val, key) => {
      if (!key.startsWith("utm_") && !key.startsWith("ref") && key !== "gh_src" && key !== "lk") {
        cleanParams.append(key, val);
      }
    });
    parsed.search = cleanParams.toString();
    const cleanUrl = parsed.toString().toLowerCase().replace(/\/$/, "");
    return crypto.createHash("sha256").update(cleanUrl).digest("hex");
  } catch {
    return crypto.createHash("sha256").update(rawUrl.toLowerCase().trim()).digest("hex");
  }
}

/**
 * Determines whether a URL is a direct ATS link (Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Recruitee, or official domain).
 */
export function isDirectAtsUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("greenhouse.io") ||
    lower.includes("lever.co") ||
    lower.includes("ashbyhq.com") ||
    lower.includes("workable.com") ||
    lower.includes("smartrecruiters.com") ||
    lower.includes("recruitee.com")
  );
}

/**
 * Computes a deterministic multi-signal deduplication key using:
 * 1. ATS Source Job ID + Provider Key (Exact ATS match)
 * 2. Canonical Application URL Hash (Exact Link match)
 * 3. Multi-signal tuple: companySlug + title + location + experienceLevel + description MD5 snippet
 */
export function computeDeduplicationKey(job: NormalizedJob): string {
  // Signal 1: ATS Provider + Source Job ID
  if (
    job.sourceJobId &&
    ["GREENHOUSE", "LEVER", "ASHBY", "WORKABLE", "SMARTRECRUITERS", "RECRUITEE"].includes(job.providerKey)
  ) {
    return `ats:${job.providerKey.toLowerCase()}:${job.companySlug}:${job.sourceJobId}`;
  }

  // Signal 2: Direct Canonical Application URL Hash
  if (job.canonicalAppUrl && isDirectAtsUrl(job.canonicalAppUrl)) {
    const cleanUrl = generateUrlHash(job.canonicalAppUrl);
    return `url:${cleanUrl}`;
  }

  // Signal 3: Multi-Signal Tuple (Location + Title + Company + Experience + Description Snippet MD5)
  const normCompany = job.companySlug.toLowerCase().trim();
  const normTitle = job.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normLocation = job.location.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normExp = job.experienceLevel.toLowerCase().replace(/[^a-z0-9]/g, "");
  const descSnippet = (job.rawDescription || "").slice(0, 200).toLowerCase().replace(/[^a-z0-9]/g, "");
  const descHash = crypto.createHash("md5").update(descSnippet).digest("hex").slice(0, 8);

  return `sig:${normCompany}:${normTitle}:${normLocation}:${normExp}:${descHash}`;
}
