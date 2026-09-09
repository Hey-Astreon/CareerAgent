import { describe, expect, it } from "vitest";
import { calculateProviderReliability, calculateRejectionRate, sortProviderHealth, summarizeProviderHealth, type ProviderHealthSnapshot } from "@/lib/dashboardStats";

const source = (provider: string, status: string, lastSuccessfulSyncAt: string | null): ProviderHealthSnapshot => ({
  provider,
  status,
  lastSyncAttemptAt: lastSuccessfulSyncAt,
  lastSuccessfulSyncAt,
  lastFailedSyncAt: null,
  consecutiveFailures: 0,
  lastError: null,
  totalJobsSeen: 12,
});

describe("dashboard statistics", () => {
  it("calculates a bounded rejection percentage only when a real provider run has a valid denominator", () => {
    expect(calculateRejectionRate(9772, 9771)).toBe(100);
    expect(calculateRejectionRate(0, 0)).toBeNull();
    expect(calculateRejectionRate(undefined, 10)).toBeNull();
  });

  it("summarizes source status and surfaces the most recent successful source", () => {
    const summary = summarizeProviderHealth([
      source("GREENHOUSE", "HEALTHY", "2026-08-25T03:36:09.000Z"),
      source("SIMPLIFY", "DEGRADED", null),
      source("EXAMPLE", "FAILING", "2026-08-24T03:36:09.000Z"),
    ]);

    expect(summary).toMatchObject({ total: 3, healthy: 1, degraded: 1, failing: 1, issueCount: 2 });
    expect(summary.latestSuccessful?.provider).toBe("GREENHOUSE");
  });

  it("puts failing and degraded providers ahead of healthy providers for investigation", () => {
    expect(sortProviderHealth([
      source("HEALTHY", "HEALTHY", "2026-08-25T03:36:09.000Z"),
      source("DEGRADED", "DEGRADED", "2026-08-24T03:36:09.000Z"),
      source("FAILING", "FAILING", null),
    ]).map((item) => item.provider)).toEqual(["FAILING", "DEGRADED", "HEALTHY"]);
  });

  it("derives an operational reliability score from real status, freshness, and consecutive failures rather than invented uptime", () => {
    const reliability = calculateProviderReliability({
      ...source("DEGRADED", "DEGRADED", "2026-08-20T00:00:00.000Z"),
      consecutiveFailures: 2,
    }, new Date("2026-08-26T00:00:00.000Z").getTime());

    expect(reliability).toEqual({ score: 40, statusPenalty: 28, freshnessPenalty: 20, failurePenalty: 12 });
  });
});
