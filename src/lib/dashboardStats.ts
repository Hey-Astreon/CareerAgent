export interface ProviderHealthSnapshot {
  provider: string;
  status: string;
  lastSyncAttemptAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastFailedSyncAt: string | null;
  consecutiveFailures: number;
  lastError: string | null;
  totalJobsSeen: number;
  activeJobs?: number;
  staleJobs?: number;
}

export interface ProviderReliability {
  score: number;
  statusPenalty: number;
  freshnessPenalty: number;
  failurePenalty: number;
}

export function calculateProviderReliability(source: ProviderHealthSnapshot, nowMs: number = Date.now()): ProviderReliability {
  const statusScore: Record<string, number> = { HEALTHY: 100, DEGRADED: 72, FAILING: 35, DISABLED: 0 };
  const statusBase = statusScore[source.status.toUpperCase()] ?? 55;
  const successfulAt = source.lastSuccessfulSyncAt ? new Date(source.lastSuccessfulSyncAt).getTime() : Number.NaN;
  const ageHours = Number.isFinite(successfulAt) ? Math.max(0, (nowMs - successfulAt) / 3_600_000) : Number.POSITIVE_INFINITY;
  const freshnessPenalty = ageHours > 72 ? 20 : ageHours > 24 ? 10 : 0;
  const failurePenalty = Math.min(18, Math.max(0, source.consecutiveFailures) * 6);
  return { score: Math.max(0, statusBase - freshnessPenalty - failurePenalty), statusPenalty: 100 - statusBase, freshnessPenalty, failurePenalty };
}

export function calculateRejectionRate(totalDiscovered?: number | null, totalRejected?: number | null): number | null {
  if (!Number.isFinite(totalDiscovered) || !Number.isFinite(totalRejected) || !totalDiscovered || totalDiscovered <= 0) return null;
  return Math.round(Math.min(100, Math.max(0, (totalRejected! / totalDiscovered) * 100)));
}

export function summarizeProviderHealth(sources: ProviderHealthSnapshot[]) {
  const byStatus = sources.reduce((totals, source) => {
    const status = source.status.toUpperCase();
    if (status === "HEALTHY") totals.healthy += 1;
    else if (status === "DEGRADED") totals.degraded += 1;
    else if (status === "FAILING") totals.failing += 1;
    else totals.other += 1;
    return totals;
  }, { healthy: 0, degraded: 0, failing: 0, other: 0 });

  const latestSuccessful = sources
    .filter((source) => source.lastSuccessfulSyncAt && Number.isFinite(new Date(source.lastSuccessfulSyncAt).getTime()))
    .sort((a, b) => new Date(b.lastSuccessfulSyncAt!).getTime() - new Date(a.lastSuccessfulSyncAt!).getTime())[0] || null;

  return {
    total: sources.length,
    ...byStatus,
    issueCount: byStatus.degraded + byStatus.failing + byStatus.other,
    latestSuccessful,
  };
}

export function sortProviderHealth(sources: ProviderHealthSnapshot[]) {
  const statusRank: Record<string, number> = { FAILING: 0, DEGRADED: 1, HEALTHY: 2 };
  return [...sources].sort((a, b) => {
    const rankDifference = (statusRank[a.status.toUpperCase()] ?? 3) - (statusRank[b.status.toUpperCase()] ?? 3);
    if (rankDifference !== 0) return rankDifference;
    const bTime = b.lastSuccessfulSyncAt ? new Date(b.lastSuccessfulSyncAt).getTime() : 0;
    const aTime = a.lastSuccessfulSyncAt ? new Date(a.lastSuccessfulSyncAt).getTime() : 0;
    return bTime - aTime;
  });
}
