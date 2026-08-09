import { describe, test, expect } from "vitest";
import {
  GREENHOUSE_BOARDS,
  LEVER_BOARDS,
  ASHBY_BOARDS,
  classifyAtsResponse,
} from "../src/lib/providers/ats_directory";
import { RemoteOKProvider } from "../src/lib/providers/remoteok";
import { parseRemoteScope, isStrictlyRemoteDeveloperRole } from "../src/lib/providers/normalize";
import { isValidHttpUrl } from "../src/lib/urlValidator";
import { RemoteScope } from "@prisma/client";

describe("Checkpoint D4 — Discovery Coverage Expansion & Source Quality Test Suite", () => {
  describe("1. Verified ATS Directories Structure", () => {
    test("Greenhouse contains verified active boards", () => {
      expect(GREENHOUSE_BOARDS.length).toBeGreaterThanOrEqual(75);
      expect(GREENHOUSE_BOARDS.some((b) => b.slug === "stripe")).toBe(true);
      expect(GREENHOUSE_BOARDS.some((b) => b.slug === "vercel")).toBe(true);
      expect(GREENHOUSE_BOARDS.some((b) => b.slug === "anthropic")).toBe(true);
    });

    test("Lever contains verified active boards", () => {
      // Most companies migrated off Lever v0 API; only verified active boards remain
      expect(LEVER_BOARDS.length).toBeGreaterThanOrEqual(1);
      expect(LEVER_BOARDS.some((b) => b.slug === "secureframe")).toBe(true);
    });

    test("Ashby contains verified active boards", () => {
      expect(ASHBY_BOARDS.length).toBeGreaterThanOrEqual(30);
      expect(ASHBY_BOARDS.some((b) => b.slug === "modal")).toBe(true);
      expect(ASHBY_BOARDS.some((b) => b.slug === "anysphere")).toBe(true);
    });

    test("Strict 6-step ATS classification rules", () => {
      expect(classifyAtsResponse(200, true, 10)).toBe("ACTIVE");
      expect(classifyAtsResponse(200, true, 0)).toBe("EMPTY");
      expect(classifyAtsResponse(404, false, 0)).toBe("404/MIGRATED");
      expect(classifyAtsResponse(403, false, 0)).toBe("BLOCKED");
    });
  });

  describe("2. RemoteOK Provider Normalization", () => {
    test("RemoteOKProvider initializes with correct metadata", () => {
      const provider = new RemoteOKProvider();
      expect(provider.name).toBe("RemoteOK");
      expect(provider.providerKey).toBe("REMOTEOK");
      expect(provider.timeoutMs).toBe(8000);
    });
  });

  describe("3. Data Integrity & Safety Invariants", () => {
    test("0-3 YOE filter rejects Senior/Staff/Lead roles", () => {
      expect(isStrictlyRemoteDeveloperRole("Senior Software Engineer", "Remote", "")).toBe(false);
      expect(isStrictlyRemoteDeveloperRole("Staff Systems Architect", "Remote", "")).toBe(false);
      expect(isStrictlyRemoteDeveloperRole("Engineering Manager", "Remote", "")).toBe(false);
      expect(isStrictlyRemoteDeveloperRole("Lead Developer", "Remote", "")).toBe(false);
    });

    test("0-3 YOE filter accepts Entry/Junior/Associate/Intern roles", () => {
      expect(isStrictlyRemoteDeveloperRole("Junior Software Engineer", "Remote", "")).toBe(true);
      expect(isStrictlyRemoteDeveloperRole("Associate Backend Developer", "Remote", "")).toBe(true);
      expect(isStrictlyRemoteDeveloperRole("Software Engineer, Intern", "Remote", "")).toBe(true);
      expect(isStrictlyRemoteDeveloperRole("Full Stack Developer", "Remote", "")).toBe(true);
    });

    test("Remote scope hierarchy preserves explicit regional restrictions", () => {
      expect(parseRemoteScope("Remote (US Only)")).toBe(RemoteScope.US_ONLY);
      expect(parseRemoteScope("Remote (India)")).toBe(RemoteScope.INDIA);
      expect(parseRemoteScope("Remote (Worldwide)")).toBe(RemoteScope.WORLDWIDE);
      expect(parseRemoteScope("Remote (APAC)")).toBe(RemoteScope.APAC);
      expect(parseRemoteScope("Remote (EMEA)")).toBe(RemoteScope.EMEA);
      expect(parseRemoteScope("Remote")).toBe(RemoteScope.UNKNOWN);
    });

    test("URL validation utility enforces valid HTTP/HTTPS URLs", () => {
      expect(isValidHttpUrl("https://boards.greenhouse.io/stripe/jobs/123456")).toBe(true);
      expect(isValidHttpUrl("http://example.com/careers")).toBe(true);
      expect(isValidHttpUrl("invalid_url")).toBe(false);
      expect(isValidHttpUrl("")).toBe(false);
      expect(isValidHttpUrl("javascript:void(0)")).toBe(false);
    });
  });
});
