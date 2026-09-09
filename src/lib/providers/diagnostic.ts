import { ProviderResult, NormalizedJob } from './types';
import { isValidHttpUrl } from '@/lib/urlValidator';

/**
 * Emit a structured, provider-scoped pipeline summary.
 * Providers with exact counters should populate result.diagnostics. For legacy
 * providers, the fallback deliberately labels the estimates so dashboard users
 * do not mistake inferred stages for exact rejection counts.
 */
export function logProviderDiagnostics(providerKey: string, result: ProviderResult): void {
  const jobs: NormalizedJob[] = result.jobs as NormalizedJob[];
  const exact = result.diagnostics;

  let validUrlJobs = 0;
  let developerJobs = 0;
  let remoteJobs = 0;
  let experienceJobs = 0;

  const devKeywords = [/developer/i, /engineer/i, /software/i, /frontend/i, /backend/i, /full[- ]?stack/i];
  const expPattern = /0-?3\s*years|entry|junior/i;

  for (const job of jobs) {
    if (job.canonicalAppUrl && isValidHttpUrl(job.canonicalAppUrl)) validUrlJobs++;
    const combined = `${job.title ?? ''} ${job.category ?? ''}`;
    if (devKeywords.some((re) => re.test(combined))) developerJobs++;
    if (job.isRemote) remoteJobs++;
    if (job.experienceLevel && expPattern.test(job.experienceLevel)) experienceJobs++;
  }

  const diagnostics = {
    provider: providerKey,
    RAW: exact?.rawCandidates ?? result.jobsDiscovered + result.jobsRejected,
    PARSED: result.jobsDiscovered,
    MISSING_TITLE: exact?.missingTitle ?? null,
    INVALID_URL: exact?.invalidUrl ?? null,
    ROLE_GATE_REJECTED: exact?.roleGateRejected ?? result.jobsRejected,
    VALID_URL: validUrlJobs,
    DEVELOPER: developerJobs,
    REMOTE: remoteJobs,
    EXPERIENCE_0_3: experienceJobs,
    FINAL: exact?.accepted ?? jobs.length,
    COUNTER_MODE: exact?.instrumented ? 'EXACT' : 'LEGACY_ESTIMATE',
    STATUS: result.success ? 'SUCCESS' : 'FAIL',
    ERROR: result.error ?? null,
    ENDPOINT_TELEMETRY: result.endpointTelemetry ?? null,
    ENDPOINT_TELEMETRY_SUMMARY: result.endpointTelemetrySummary ?? null,
  };

  console.log('[ProviderDiagnostics]', JSON.stringify(diagnostics));
}
