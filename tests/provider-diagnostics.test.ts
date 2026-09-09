import { describe, expect, it, vi } from "vitest";
import { PlatformSource, RemoteScope } from "@prisma/client";
import { logProviderDiagnostics } from "../src/lib/providers/diagnostic";
import type { ProviderResult } from "../src/lib/providers/types";

const baseResult = (overrides: Partial<ProviderResult> = {}): ProviderResult => ({
  providerKey: PlatformSource.HIRING_CAFE,
  jobs: [],
  success: true,
  durationMs: 10,
  jobsDiscovered: 0,
  jobsRejected: 0,
  ...overrides,
});

describe("provider diagnostics", () => {
  it("emits exact stage counters when a provider supplies instrumentation", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    logProviderDiagnostics(PlatformSource.HIRING_CAFE, baseResult({
      jobsDiscovered: 12,
      jobsRejected: 7,
      diagnostics: {
        rawCandidates: 19,
        missingTitle: 3,
        invalidUrl: 4,
        roleGateRejected: 0,
        accepted: 12,
        instrumented: true,
      },
    }));
    const payload = JSON.parse(String(spy.mock.calls[0][1]));
    expect(payload).toMatchObject({
      RAW: 19,
      MISSING_TITLE: 3,
      INVALID_URL: 4,
      ROLE_GATE_REJECTED: 0,
      FINAL: 12,
      COUNTER_MODE: "EXACT",
    });
    spy.mockRestore();
  });

  it("labels legacy counters instead of presenting inferred stages as exact", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    logProviderDiagnostics(PlatformSource.LINKEDIN, baseResult({
      providerKey: PlatformSource.LINKEDIN,
      jobsDiscovered: 8,
      jobsRejected: 2,
    }));
    const payload = JSON.parse(String(spy.mock.calls[0][1]));
    expect(payload).toMatchObject({
      RAW: 10,
      MISSING_TITLE: null,
      INVALID_URL: null,
      ROLE_GATE_REJECTED: 2,
      FINAL: 0,
      COUNTER_MODE: "LEGACY_ESTIMATE",
    });
    spy.mockRestore();
  });
});
