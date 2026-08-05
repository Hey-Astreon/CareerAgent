import crypto from "crypto";

/**
 * Normalizes job posting URLs and produces a deterministic SHA-256 hash
 * for database deduplication.
 */
export function generateUrlHash(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Strip tracking parameters (utm_, ref, gh_src, etc.)
    const cleanParams = new URLSearchParams();
    parsed.searchParams.forEach((val, key) => {
      if (!key.startsWith("utm_") && !key.startsWith("ref") && key !== "gh_src") {
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
