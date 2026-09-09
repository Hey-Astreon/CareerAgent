const APPROVED_SOURCE_TEXT_PLATFORMS = new Set(["WEWORKREMOTELY", "GREENHOUSE", "ASHBY"]);

/** Match Studio mirrors the existing server-side source allowlist before displaying the enrichment action. */
export function canFetchMatchSourceText(platform: string, sourceUrl: string): boolean {
  const normalizedPlatform = platform.trim().toUpperCase();
  if (!APPROVED_SOURCE_TEXT_PLATFORMS.has(normalizedPlatform)) return false;

  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();
    if (normalizedPlatform === "GREENHOUSE") return hostname === "greenhouse.io" || hostname.endsWith(".greenhouse.io");
    if (normalizedPlatform === "ASHBY") return hostname === "jobs.ashbyhq.com";
    return hostname === "weworkremotely.com" || hostname === "www.weworkremotely.com";
  } catch {
    return false;
  }
}
