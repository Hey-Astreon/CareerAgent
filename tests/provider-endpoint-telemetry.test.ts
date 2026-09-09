import { describe, expect, it } from "vitest";
import { PlatformSource } from "@prisma/client";
import { buildProviderEndpointRunInserts, clampHistoryDays, summarizeDailyEndpointRuns, summarizeProviderFailureAlerts } from "../src/lib/providerEndpointTelemetry";

describe("provider endpoint telemetry helpers", () => {
  it("clamps diagnostics history requests to a bounded read-only range", () => {
    expect(clampHistoryDays(null)).toBe(30);
    expect(clampHistoryDays("0")).toBe(1);
    expect(clampHistoryDays("365")).toBe(90);
    expect(clampHistoryDays("14")).toBe(14);
  });

  it("summarizes daily endpoint latency and failure rate without mutating raw runs", () => {
    const daily = summarizeDailyEndpointRuns([
      { providerKey: "SIMPLIFY", endpointKey: "new_grad_positions", observedAt: new Date("2026-08-26T01:00:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "SIMPLIFY", endpointKey: "new_grad_positions", observedAt: new Date("2026-08-26T02:00:00.000Z"), success: false, latencyMs: 300 },
      { providerKey: "SIMPLIFY", endpointKey: "summer_2026_internships", observedAt: new Date("2026-08-26T02:00:00.000Z"), success: true, latencyMs: 200 },
    ]);

    expect(daily).toEqual([
      {
        date: "2026-08-26",
        providerKey: "SIMPLIFY",
        endpointKey: "new_grad_positions",
        totalRequests: 2,
        successfulRequests: 1,
        failedRequests: 1,
        failureRatePercent: 50,
        averageLatencyMs: 200,
        maxLatencyMs: 300,
      },
      {
        date: "2026-08-26",
        providerKey: "SIMPLIFY",
        endpointKey: "summer_2026_internships",
        totalRequests: 1,
        successfulRequests: 1,
        failedRequests: 0,
        failureRatePercent: 0,
        averageLatencyMs: 200,
        maxLatencyMs: 200,
      },
    ]);
  });

  it("builds append-only endpoint rows with the scrape run identifier and bounded error text", () => {
    const rows = buildProviderEndpointRunInserts("scrape-123", [
      {
        providerKey: PlatformSource.SIMPLIFY,
        jobs: [],
        success: true,
        durationMs: 10,
        jobsDiscovered: 0,
        jobsRejected: 0,
        endpointTelemetry: [{
          endpointKey: "new_grad_positions",
          endpoint: "https://example.test/listings.json",
          latencyMs: 125,
          attempts: 2,
          success: false,
          statusCode: 429,
          retryAfterMs: 1000,
          error: "x".repeat(600),
        }],
      },
    ]);

    expect(rows).toEqual([{
      scrapeRunId: "scrape-123",
      providerKey: "SIMPLIFY",
      endpointKey: "new_grad_positions",
      endpointUrl: "https://example.test/listings.json",
      success: false,
      latencyMs: 125,
      attemptCount: 2,
      statusCode: 429,
      retryAfterMs: 1000,
      errorMessage: "x".repeat(500),
    }]);
  });

  it("raises a provider alert only when its aggregate 24-hour failure rate exceeds 10%", () => {
    const alerts = summarizeProviderFailureAlerts([
      { providerKey: "SIMPLIFY", endpointKey: "new_grad_positions", observedAt: new Date("2026-08-26T01:00:00.000Z"), success: false, latencyMs: 100 },
      { providerKey: "SIMPLIFY", endpointKey: "summer_2026_internships", observedAt: new Date("2026-08-26T01:00:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:00:00.000Z"), success: false, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:01:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:02:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:03:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:04:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:05:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:06:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:07:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:08:00.000Z"), success: true, latencyMs: 100 },
      { providerKey: "GREENHOUSE", endpointKey: "board", observedAt: new Date("2026-08-26T01:09:00.000Z"), success: true, latencyMs: 100 },
    ]);

    expect(alerts).toEqual([{ providerKey: "SIMPLIFY", totalRequests: 2, failedRequests: 1, failureRatePercent: 50 }]);
  });
});
