import { describe, it, expect } from "vitest";
import { isStrictlyRemoteDeveloperRole, determineExperienceLevel } from "../src/lib/providers/normalize";

describe("Strict Remote & Entry-Level Integrity Guardrails", () => {
  it("rejects on-site and hybrid roles strictly", () => {
    expect(isStrictlyRemoteDeveloperRole("Software Engineer", "Zurich, Switzerland", "")).toBe(false);
    expect(isStrictlyRemoteDeveloperRole("Frontend Developer", "San Francisco, CA (Hybrid)", "")).toBe(false);
    expect(isStrictlyRemoteDeveloperRole("Backend Engineer", "Remote", "This position requires 3 days in office on-site.")).toBe(false);
    expect(isStrictlyRemoteDeveloperRole("Python Developer", "London, UK", "Hybrid work arrangement")).toBe(false);
  });

  it("accepts strictly remote developer roles", () => {
    expect(isStrictlyRemoteDeveloperRole("Software Engineer", "Remote (Worldwide)", "100% remote developer role.")).toBe(true);
    expect(isStrictlyRemoteDeveloperRole("Frontend Engineer", "Remote - India", "Build web applications with React.")).toBe(true);
    expect(isStrictlyRemoteDeveloperRole("Backend Developer", "Remote (APAC)", "Build APIs with Node.js and TypeScript.")).toBe(true);
  });

  it("rejects senior, staff, principal, and manager roles strictly", () => {
    expect(isStrictlyRemoteDeveloperRole("Senior Software Engineer", "Remote", "")).toBe(false);
    expect(isStrictlyRemoteDeveloperRole("Staff Backend Engineer", "Remote", "")).toBe(false);
    expect(isStrictlyRemoteDeveloperRole("Engineering Manager", "Remote", "")).toBe(false);
    expect(isStrictlyRemoteDeveloperRole("Tech Lead", "Remote", "")).toBe(false);
    expect(isStrictlyRemoteDeveloperRole("Software Engineer", "Remote", "Requires 7+ years of experience")).toBe(false);
  });

  it("classifies 0-3 YOE entry-level & junior roles correctly", () => {
    const level = determineExperienceLevel("Software Engineer", "0-2 years of experience required");
    expect(level.includes("0-1") || level.includes("Junior") || level.includes("0-3")).toBe(true);
    expect(determineExperienceLevel("Junior Developer", "Entry level position")).toContain("Junior");
  });
});
