/**
 * Tests for src/lib/ai/scorer.ts
 *
 * Covers:
 * - Hard eligibility rules (URL validity, non-dev roles, seniority mismatch, on-site location)
 * - Deterministic match signals & base score computation
 * - Score boundaries (0–100 clamp)
 * - Deterministic reproducibility
 * - AI failure fallback behavior
 * - extractSkills helper
 */

import { describe, it, expect } from "vitest";
import {
  evaluateHardEligibility,
  calculateDeterministicSignals,
  computeCompositeMatchScore,
  extractSkills,
  CandidateContext,
} from "@/lib/ai/scorer";

const mockCandidate: CandidateContext = {
  fullName: "Roushan Kumar",
  title: "Full Stack Software Developer",
  masterProjects: [
    {
      title: "CareerAgent",
      techStack: "TypeScript, React, Next.js, Node.js, SQLite, Prisma, Python, FastAPI",
      architecture: "Microservices with multi-provider LLM router and Prisma ORM",
    },
    {
      title: "DevPortfolio",
      techStack: "React, Tailwind CSS, PostgreSQL, Docker",
      architecture: "RESTful API with Docker containerization",
    },
  ],
  virtualExps: [
    {
      company: "Tech Corp",
      roleTitle: "Software Developer Intern",
      outcome: "Built REST APIs with Python FastAPI and PostgreSQL",
    },
  ],
};

// ─── evaluateHardEligibility ──────────────────────────────────────────────────

describe("evaluateHardEligibility", () => {
  it("returns eligible=true for valid remote developer role with HTTP URL", () => {
    const res = evaluateHardEligibility(
      mockCandidate,
      "Software Engineer",
      "Building backend services with Python and FastAPI.",
      "100% Remote",
      "https://boards.greenhouse.io/company/jobs/123"
    );
    expect(res.eligible).toBe(true);
    expect(res.reason).toBeUndefined();
  });

  it("returns eligible=false for non-developer support/sales role", () => {
    const res = evaluateHardEligibility(
      mockCandidate,
      "Customer Support Engineer",
      "Help customers resolve ticket issues.",
      "Remote",
      "https://example.com/apply"
    );
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("operational support or sales role");
  });

  it("returns eligible=false for senior/staff/lead title", () => {
    const res = evaluateHardEligibility(
      mockCandidate,
      "Senior Software Engineer",
      "Lead our core infrastructure team.",
      "Remote",
      "https://example.com/apply"
    );
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("Seniority mismatch");
  });

  it("returns eligible=false for Staff Engineer title", () => {
    const res = evaluateHardEligibility(
      mockCandidate,
      "Staff Engineer",
      "Architect our global platform.",
      "Remote",
      "https://example.com/apply"
    );
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("Seniority mismatch");
  });

  it("returns eligible=false for on-site location", () => {
    const res = evaluateHardEligibility(
      mockCandidate,
      "Software Engineer",
      "In office role in San Francisco.",
      "On-site - San Francisco, CA",
      "https://example.com/apply"
    );
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("Location mismatch");
  });

  it("returns eligible=false for in-office location", () => {
    const res = evaluateHardEligibility(
      mockCandidate,
      "Software Engineer",
      "Required 5 days in office.",
      "In-Office",
      "https://example.com/apply"
    );
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("Location mismatch");
  });

  it("returns eligible=false when canonicalAppUrl is invalid or missing", () => {
    const res = evaluateHardEligibility(
      mockCandidate,
      "Software Engineer",
      "Great remote role.",
      "Remote",
      "invalid-url"
    );
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("Missing valid direct application URL");
  });
});

// ─── calculateDeterministicSignals ──────────────────────────────────────────

describe("calculateDeterministicSignals", () => {
  it("calculates high skill overlap when job requirements match candidate tech stack", () => {
    const signals = calculateDeterministicSignals(
      mockCandidate,
      "Python Backend Developer",
      "Looking for Python, FastAPI, PostgreSQL, and React developer.",
      new Date(),
      "GREENHOUSE"
    );
    expect(signals.skillOverlapScore).toBeGreaterThanOrEqual(50);
    expect(signals.deterministicBaseScore).toBeGreaterThan(50);
  });

  it("calculates title category score accurately (100 for exact category match, 80 for generic SWE)", () => {
    const exactMatch = calculateDeterministicSignals(
      mockCandidate,
      "Full Stack Developer",
      "Full stack work",
      new Date(),
      "GREENHOUSE"
    );
    const genericMatch = calculateDeterministicSignals(
      mockCandidate,
      "Software Engineer",
      "Software engineering",
      new Date(),
      "GREENHOUSE"
    );
    expect(exactMatch.titleCategoryScore).toBe(100);
    expect(genericMatch.titleCategoryScore).toBe(80);
  });

  it("calculates recency score based on posting age", () => {
    const freshJob = calculateDeterministicSignals(
      mockCandidate,
      "Software Engineer",
      "Code",
      new Date(),
      "GREENHOUSE"
    );
    const oldJob = calculateDeterministicSignals(
      mockCandidate,
      "Software Engineer",
      "Code",
      new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days old
      "GREENHOUSE"
    );
    expect(freshJob.recencyScore).toBe(100);
    expect(oldJob.recencyScore).toBe(30);
  });

  it("gives higher source quality score to primary ATS providers", () => {
    const greenhouse = calculateDeterministicSignals(mockCandidate, "Dev", "Code", undefined, "GREENHOUSE");
    const hn = calculateDeterministicSignals(mockCandidate, "Dev", "Code", undefined, "HN_HIRING");
    expect(greenhouse.sourceQualityScore).toBe(100);
    expect(hn.sourceQualityScore).toBe(80);
  });

  it("clamps deterministicBaseScore between 0 and 100", () => {
    const signals = calculateDeterministicSignals(
      mockCandidate,
      "Software Engineer",
      "Python React TypeScript Node.js PostgreSQL FastAPI Docker Kubernetes AWS",
      new Date(),
      "GREENHOUSE"
    );
    expect(signals.deterministicBaseScore).toBeGreaterThanOrEqual(0);
    expect(signals.deterministicBaseScore).toBeLessThanOrEqual(100);
  });
});

// ─── computeCompositeMatchScore ─────────────────────────────────────────────

describe("computeCompositeMatchScore – Layered Engine", () => {
  it("caps finalScore at 0 when job is hard-ineligible", async () => {
    const res = await computeCompositeMatchScore(
      mockCandidate,
      "Senior Software Engineer",
      "Senior role",
      "Remote",
      "https://example.com/apply",
      undefined,
      "GREENHOUSE",
      false // disable AI
    );
    expect(res.eligible).toBe(false);
    expect(res.finalScore).toBe(0);
    expect(res.rejectionReason).toBeDefined();
  });

  it("produces deterministic composite score when enableAiReasoning is false", async () => {
    const res = await computeCompositeMatchScore(
      mockCandidate,
      "Software Developer",
      "Python, FastAPI, TypeScript, React",
      "100% Remote",
      "https://example.com/apply",
      new Date(),
      "GREENHOUSE",
      false // disable AI
    );
    expect(res.eligible).toBe(true);
    expect(res.finalScore).toBeGreaterThan(0);
    expect(res.aiCallsCount).toBe(0);
    expect(res.version).toBe("v2.0-deterministic-ai");
  });

  it("falls back gracefully to deterministic base score when AI fails / is unconfigured", async () => {
    // Calling with enableAiReasoning=true will trigger queryMultiProviderLLM.
    // If no API keys are present (or all fail), it returns fallback text "", so aiSimilarityScore = deterministicBaseScore.
    const res = await computeCompositeMatchScore(
      mockCandidate,
      "Full Stack Engineer",
      "React, Node.js, Python, TypeScript",
      "Remote",
      "https://example.com/apply",
      new Date(),
      "GREENHOUSE",
      true // enable AI (will trigger fallback path if no keys set)
    );

    expect(res.eligible).toBe(true);
    expect(res.finalScore).toBeGreaterThanOrEqual(0);
    expect(res.finalScore).toBeLessThanOrEqual(100);
  });

  it("is reproducible for identical inputs", async () => {
    const run1 = await computeCompositeMatchScore(
      mockCandidate,
      "Python Engineer",
      "Python FastAPI Postgres",
      "Remote",
      "https://example.com/apply",
      new Date("2026-01-01"),
      "GREENHOUSE",
      false
    );
    const run2 = await computeCompositeMatchScore(
      mockCandidate,
      "Python Engineer",
      "Python FastAPI Postgres",
      "Remote",
      "https://example.com/apply",
      new Date("2026-01-01"),
      "GREENHOUSE",
      false
    );
    expect(run1.finalScore).toBe(run2.finalScore);
    expect(run1.deterministicSignals).toEqual(run2.deterministicSignals);
  });
});

// ─── extractSkills ────────────────────────────────────────────────────────────

describe("extractSkills", () => {
  it("extracts known technologies from raw text", () => {
    const text = "We need a Python developer who knows FastAPI, React, Docker, and PostgreSQL.";
    const skills = extractSkills(text);
    expect(skills).toContain("Python");
    expect(skills).toContain("FastAPI");
    expect(skills).toContain("React");
    expect(skills).toContain("Docker");
    expect(skills).toContain("PostgreSQL");
  });

  it("deduplicates extracted skills", () => {
    const text = "Python python PYTHON Python.js";
    const skills = extractSkills(text);
    const pythonCounts = skills.filter((s) => s.toLowerCase() === "python").length;
    expect(pythonCounts).toBe(1);
  });

  it("returns empty array for text with no recognized tech skills", () => {
    const text = "Looking for a enthusiastic team player with strong communication skills.";
    const skills = extractSkills(text);
    expect(skills).toEqual([]);
  });
});
