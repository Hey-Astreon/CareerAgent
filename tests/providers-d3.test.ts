import { describe, test, expect } from "vitest";
import { parseRemoteScope, determineOpportunitySignals, determineJobType, determineExperienceLevel } from "../src/lib/providers/normalize";
import { classifyAtsResponse } from "../src/lib/providers/ats_directory";
import { RemoteScope, PlatformSource } from "@prisma/client";
import { WeWorkRemotelyProvider } from "../src/lib/providers/weworkremotely";
import { JobicyProvider } from "../src/lib/providers/jobicy";
import { ArbeitnowProvider } from "../src/lib/providers/arbeitnow";

describe("Checkpoint D3 — Expanded Discovery, Signals & Verification", () => {

  describe("1. FRESH Signal Semantics (Source Timestamp Mandatory Rule)", () => {
    test("assigns FRESH ONLY when genuine source postedAt is within the last 24 hours", () => {
      const realNowMs = Date.now();
      const threeHoursAgo = new Date(realNowMs - 3 * 3600 * 1000);
      const signals = determineOpportunitySignals({
        postedAt: threeHoursAgo,
        applicationUrlType: "DIRECT_ATS",
      });

      expect(signals).toContain("FRESH");
    });

    test("DOES NOT assign FRESH when source postedAt is 20 days ago (even if discovered today)", () => {
      const realNowMs = Date.now();
      const twentyDaysAgo = new Date(realNowMs - 20 * 86400 * 1000);
      const signals = determineOpportunitySignals({
        postedAt: twentyDaysAgo,
        applicationUrlType: "DIRECT_ATS",
      });

      expect(signals).not.toContain("FRESH");
    });

    test("DOES NOT assign FRESH when source postedAt is null/missing (never infers from firstSeenAt)", () => {
      const signals = determineOpportunitySignals({
        postedAt: null,
        applicationUrlType: "DIRECT_ATS",
      });

      expect(signals).not.toContain("FRESH");
    });
  });

  describe("2. Conservative Remote Scope Hierarchy", () => {
    test("classifies explicit Worldwide strings as WORLDWIDE", () => {
      expect(parseRemoteScope("Worldwide")).toBe(RemoteScope.WORLDWIDE);
      expect(parseRemoteScope("Work Anywhere")).toBe(RemoteScope.WORLDWIDE);
    });

    test("classifies explicit India strings as INDIA", () => {
      expect(parseRemoteScope("Remote - India")).toBe(RemoteScope.INDIA);
      expect(parseRemoteScope("Bengaluru, India")).toBe(RemoteScope.INDIA);
    });

    test("classifies explicit US strings as US_ONLY", () => {
      expect(parseRemoteScope("US Only")).toBe(RemoteScope.US_ONLY);
      expect(parseRemoteScope("Remote", "Must be W2 only in US")).toBe(RemoteScope.US_ONLY);
    });

    test("preserves UNKNOWN for generic or ambiguous 'Remote' locations (never defaults to Worldwide)", () => {
      expect(parseRemoteScope("Remote")).toBe(RemoteScope.UNKNOWN);
      expect(parseRemoteScope("Work from Home")).toBe(RemoteScope.UNKNOWN);
    });
  });

  describe("3. First-Class Remote Internship Support", () => {
    test("correctly identifies Software Engineering Intern titles", () => {
      const title = "Software Engineering Intern - Summer 2025";
      expect(determineJobType(title)).toBe("Remote Internship");
      expect(determineExperienceLevel(title)).toBe("Fresher / Entry Level (0-1 Yr)");
    });

    test("correctly identifies Developer Co-op / Apprentice titles", () => {
      const title = "Frontend Developer Co-op";
      expect(determineJobType(title)).toBe("Remote Internship");
    });
  });

  describe("4. Strict 6-Step ATS Directory Verification", () => {
    test("classifies HTTP 200 with active jobs as ACTIVE", () => {
      expect(classifyAtsResponse(200, true, 5)).toBe("ACTIVE");
    });

    test("classifies HTTP 200 with 0 jobs as EMPTY (HTTP 200 alone is NOT sufficient for ACTIVE)", () => {
      expect(classifyAtsResponse(200, true, 0)).toBe("EMPTY");
    });

    test("classifies HTTP 404 as 404/MIGRATED", () => {
      expect(classifyAtsResponse(404, false, 0)).toBe("404/MIGRATED");
    });

    test("classifies HTTP 403 as BLOCKED", () => {
      expect(classifyAtsResponse(403, false, 0)).toBe("BLOCKED");
    });
  });

  describe("5. Public Source Adapter Registrations", () => {
    test("WeWorkRemotelyProvider initializes with PlatformSource.WEWORKREMOTELY", () => {
      const provider = new WeWorkRemotelyProvider();
      expect(provider.providerKey).toBe(PlatformSource.WEWORKREMOTELY);
    });

    test("JobicyProvider initializes with PlatformSource.JOBICY", () => {
      const provider = new JobicyProvider();
      expect(provider.providerKey).toBe(PlatformSource.JOBICY);
    });

    test("ArbeitnowProvider initializes with PlatformSource.ARBEITNOW", () => {
      const provider = new ArbeitnowProvider();
      expect(provider.providerKey).toBe(PlatformSource.ARBEITNOW);
    });
  });
});
