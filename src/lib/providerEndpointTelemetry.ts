import type { ProviderResult } from "@/lib/providers/types";

export type ProviderEndpointRunInsert = {
  scrapeRunId: string;
  providerKey: string;
  endpointKey: string;
  endpointUrl: string;
  success: boolean;
  latencyMs: number;
  attemptCount: number;
  statusCode?: number;
  retryAfterMs?: number;
  errorMessage?: string;
};

export type ProviderEndpointRunSample = Pick<
  ProviderEndpointRunInsert,
  "providerKey" | "endpointKey" | "success" | "latencyMs"
> & {
  observedAt: Date;
};

export const PROVIDER_FAILURE_ALERT_THRESHOLD_PERCENT = 10;

export type ProviderFailureAlert = {
  providerKey: string;
  totalRequests: number;
  failedRequests: number;
  failureRatePercent: number;
};

export function buildProviderEndpointRunInserts(
  scrapeRunId: string,
  providerResults: ProviderResult[]
): ProviderEndpointRunInsert[] {
  return providerResults.flatMap((provider) =>
    (provider.endpointTelemetry ?? []).map((endpoint) => ({
      scrapeRunId,
      providerKey: String(provider.providerKey),
      endpointKey: endpoint.endpointKey,
      endpointUrl: endpoint.endpoint,
      success: endpoint.success,
      latencyMs: endpoint.latencyMs,
      attemptCount: endpoint.attempts,
      ...(endpoint.statusCode !== undefined ? { statusCode: endpoint.statusCode } : {}),
      ...(endpoint.retryAfterMs !== undefined ? { retryAfterMs: endpoint.retryAfterMs } : {}),
      ...(endpoint.error ? { errorMessage: endpoint.error.slice(0, 500) } : {}),
    }))
  );
}

export function clampHistoryDays(value: string | null, fallback = 30): number {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 90);
}

export function summarizeDailyEndpointRuns(runs: ProviderEndpointRunSample[]) {
  const groups = new Map<string, ProviderEndpointRunSample[]>();

  for (const run of runs) {
    const day = run.observedAt.toISOString().slice(0, 10);
    const key = `${day}|${run.providerKey}|${run.endpointKey}`;
    groups.set(key, [...(groups.get(key) ?? []), run]);
  }

  return [...groups.entries()]
    .map(([key, entries]) => {
      const [date, providerKey, endpointKey] = key.split("|");
      const successfulRequests = entries.filter((entry) => entry.success).length;
      const failedRequests = entries.length - successfulRequests;
      const totalLatencyMs = entries.reduce((total, entry) => total + entry.latencyMs, 0);
      return {
        date,
        providerKey,
        endpointKey,
        totalRequests: entries.length,
        successfulRequests,
        failedRequests,
        failureRatePercent: Math.round((failedRequests / entries.length) * 10000) / 100,
        averageLatencyMs: Math.round(totalLatencyMs / entries.length),
        maxLatencyMs: Math.max(...entries.map((entry) => entry.latencyMs)),
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date) || left.providerKey.localeCompare(right.providerKey) || left.endpointKey.localeCompare(right.endpointKey));
}

export function summarizeProviderFailureAlerts(
  runs: ProviderEndpointRunSample[],
  thresholdPercent = PROVIDER_FAILURE_ALERT_THRESHOLD_PERCENT
): ProviderFailureAlert[] {
  const groups = new Map<string, ProviderEndpointRunSample[]>();
  for (const run of runs) groups.set(run.providerKey, [...(groups.get(run.providerKey) ?? []), run]);

  return [...groups.entries()]
    .map(([providerKey, entries]) => {
      const failedRequests = entries.filter((entry) => !entry.success).length;
      return {
        providerKey,
        totalRequests: entries.length,
        failedRequests,
        failureRatePercent: Math.round((failedRequests / entries.length) * 10000) / 100,
      };
    })
    .filter((alert) => alert.failureRatePercent > thresholdPercent)
    .sort((left, right) => right.failureRatePercent - left.failureRatePercent || right.failedRequests - left.failedRequests);
}
