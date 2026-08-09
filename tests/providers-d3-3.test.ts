import { describe, test, expect } from "vitest";
import {
  parseRemoteScope,
  formatRemoteScopeLabel,
  isStrictlyRemoteDeveloperRole,
  determineOpportunitySignals,
} from "../src/lib/providers/normalize";
import { isValidHttpUrl } from "../src/lib/urlValidator";
import { RemoteScope } from "@prisma/client";

describe("Checkpoint D3.3 — Discovery Integrity Hardening Test Suite", () => {
  describe("1. Synthetic Record Guard & URL Validity", () => {
    test("synthetic Vercel URLs (/jobs/101, /jobs/102) are invalid ATS formats", () => {
      const syntheticUrl1 = "https://boards.greenhouse.io/vercel/jobs/101";
      const syntheticUrl2 = "https://boards.greenhouse.io/vercel/jobs/102";
      expect(syntheticUrl1).not.toMatch(/job-boards\.greenhouse\.io\/[a-z0-9-]+\/jobs\/\d{7,}/i);
      expect(syntheticUrl2).not.toMatch(/job-boards\.greenhouse\.io\/[a-z0-9-]+\/jobs\/\d{7,}/i);
    });
  });

  describe("2. Greenhouse Timestamp Priority (first_published > null)", () => {
    test("Greenhouse provider prefers first_published when present", () => {
      const item = {
        id: 1234567,
        title: "Software Engineer",
        location: { name: "Remote" },
        content: "<p>We build web apps</p>",
        absolute_url: "https://job-boards.greenhouse.io/test/jobs/1234567",
        first_published: "2026-06-20T10:00:00Z",
        updated_at: "2026-08-01T15:00:00Z",
      };

      const postedAtRaw = item.first_published || null;
      const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
      expect(postedAt?.toISOString()).toBe("2026-06-20T10:00:00.000Z");
    });

    test("Greenhouse updated_at is NOT used as postedAt when first_published is missing", () => {
      const item = {
        id: 1234567,
        title: "Software Engineer",
        first_published: undefined,
        updated_at: "2026-08-01T15:00:00Z",
      };

      const postedAtRaw = item.first_published || null;
      const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
      expect(postedAt).toBeNull();
    });

    test("Missing first_published produces null postedAt (never new Date())", () => {
      const item = {
        id: 1234567,
        title: "Software Engineer",
      };

      const postedAtRaw = (item as { first_published?: string }).first_published || null;
      const postedAt = postedAtRaw ? new Date(postedAtRaw) : null;
      expect(postedAt).toBeNull();
    });
  });

  describe("3. Remote Gate & City Location Rules", () => {
    test("Seattle + description 'remote' is REJECTED when no affirmative remote evidence exists in location/title", () => {
      const title = "Software Engineer";
      const location = "Seattle, WA";
      const description = "We are a fast growing team with a remote-friendly culture.";
      expect(isStrictlyRemoteDeveloperRole(title, location, description)).toBe(false);
    });

    test("New York + description 'remote' is REJECTED", () => {
      const title = "Backend Developer";
      const location = "New York, NY";
      const description = "Work remotely 2 days a week.";
      expect(isStrictlyRemoteDeveloperRole(title, location, description)).toBe(false);
    });

    test("Chicago + description 'remote' is REJECTED", () => {
      const title = "Full Stack Engineer";
      const location = "Chicago, IL";
      const description = "Option to work remotely.";
      expect(isStrictlyRemoteDeveloperRole(title, location, description)).toBe(false);
    });

    test("Explicit Remote qualifies", () => {
      const title = "Software Engineer";
      const location = "Remote";
      const description = "Join our engineering team.";
      expect(isStrictlyRemoteDeveloperRole(title, location, description)).toBe(true);
    });

    test("Remote - Seattle qualifies because location contains remote keyword", () => {
      const title = "Software Engineer";
      const location = "Remote - Seattle";
      const description = "Must live near Seattle.";
      expect(isStrictlyRemoteDeveloperRole(title, location, description)).toBe(true);
    });
  });

  describe("4. Parenthetical Remote Scope Normalization", () => {
    test("Remote (Global) becomes WORLDWIDE", () => {
      expect(parseRemoteScope("Remote (Global)")).toBe(RemoteScope.WORLDWIDE);
    });

    test("Remote (Worldwide) becomes WORLDWIDE", () => {
      expect(parseRemoteScope("Remote (Worldwide)")).toBe(RemoteScope.WORLDWIDE);
    });

    test("Remote (US Only) becomes US_ONLY", () => {
      expect(parseRemoteScope("Remote (US Only)")).toBe(RemoteScope.US_ONLY);
    });

    test("Remote (US & Canada) becomes US_ONLY", () => {
      expect(parseRemoteScope("Remote (US & Canada)")).toBe(RemoteScope.US_ONLY);
    });

    test("Remote (India) becomes INDIA", () => {
      expect(parseRemoteScope("Remote (India)")).toBe(RemoteScope.INDIA);
    });

    test("Remote (APAC) becomes APAC", () => {
      expect(parseRemoteScope("Remote (APAC)")).toBe(RemoteScope.APAC);
    });

    test("Remote (EMEA) becomes EMEA", () => {
      expect(parseRemoteScope("Remote (EMEA)")).toBe(RemoteScope.EMEA);
    });

    test("Remote (Americas) becomes AMERICAS", () => {
      expect(parseRemoteScope("Remote (Americas)")).toBe(RemoteScope.AMERICAS);
    });
  });

  describe("5. UI Remote Scope Labeling", () => {
    test("UNKNOWN is not displayed as 100% Remote", () => {
      const label1 = formatRemoteScopeLabel(RemoteScope.UNKNOWN, "Remote");
      expect(label1).not.toBe("100% Remote");
      expect(label1).toBe("Remote");

      const label2 = formatRemoteScopeLabel(RemoteScope.UNKNOWN, "Anywhere");
      expect(label2).not.toBe("100% Remote");
      expect(label2).toBe("Remote scope unknown");
    });

    test("UI remote badge reflects normalized remoteScope", () => {
      expect(formatRemoteScopeLabel(RemoteScope.WORLDWIDE)).toBe("Remote — Worldwide");
      expect(formatRemoteScopeLabel(RemoteScope.INDIA)).toBe("Remote — India");
      expect(formatRemoteScopeLabel(RemoteScope.US_ONLY)).toBe("Remote — US Only");
      expect(formatRemoteScopeLabel(RemoteScope.APAC)).toBe("Remote — APAC");
      expect(formatRemoteScopeLabel(RemoteScope.EMEA)).toBe("Remote — EMEA");
      expect(formatRemoteScopeLabel(RemoteScope.AMERICAS)).toBe("Remote — Americas");
      expect(formatRemoteScopeLabel(RemoteScope.EU_UK_ONLY)).toBe("Remote — EU/UK Only");
      expect(formatRemoteScopeLabel(RemoteScope.COUNTRY_SPECIFIC)).toBe("Remote — Country Specific");
      expect(formatRemoteScopeLabel(RemoteScope.UNKNOWN)).toBe("Remote scope unknown");
    });
  });

  describe("6. Signal Truth & Freshness Rules", () => {
    test("FRESH is only assigned when postedAt is within last 24h", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
      const signalsFresh = determineOpportunitySignals({ postedAt: twoHoursAgo });
      expect(signalsFresh).toContain("FRESH");

      const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
      const signalsOld = determineOpportunitySignals({ postedAt: twoDaysAgo });
      expect(signalsOld).not.toContain("FRESH");

      const signalsNull = determineOpportunitySignals({ postedAt: null });
      expect(signalsNull).not.toContain("FRESH");
    });
  });

  describe("7. URL Validator Utility", () => {
    test("isValidHttpUrl accepts valid http and https URLs", () => {
      expect(isValidHttpUrl("https://boards.greenhouse.io/vercel/jobs/1234567")).toBe(true);
      expect(isValidHttpUrl("http://example.com/job/100")).toBe(true);
    });

    test("isValidHttpUrl rejects malformed or non-http URLs", () => {
      expect(isValidHttpUrl("invalid-url")).toBe(false);
      expect(isValidHttpUrl("")).toBe(false);
      expect(isValidHttpUrl("ftp://files.example.com")).toBe(false);
      expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
      expect(isValidHttpUrl("/relative/path")).toBe(false);
    });
  });

  describe("8. Additional Remote Scope Evidence Hierarchy Rules", () => {
    test("Description-only generic remote mentions remain UNKNOWN (never WORLDWIDE)", () => {
      expect(parseRemoteScope("Remote", "We support remote work and flexible hours.")).toBe(RemoteScope.UNKNOWN);
      expect(parseRemoteScope("Remote Work Available", "Flexible work from home arrangement.")).toBe(RemoteScope.UNKNOWN);
    });

    test("Country-specific remote restriction resolves to COUNTRY_SPECIFIC", () => {
      expect(parseRemoteScope("Remote (Country Specific)")).toBe(RemoteScope.COUNTRY_SPECIFIC);
      expect(parseRemoteScope("Remote - Country-Specific")).toBe(RemoteScope.COUNTRY_SPECIFIC);
    });
  });
});

