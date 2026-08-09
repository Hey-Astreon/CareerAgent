import { ProviderResult, NormalizedJob } from './types';
import { isValidHttpUrl } from '@/lib/urlValidator';

/**
 * Helper to log detailed provider diagnostics.
 * It calculates various stages based on the ProviderResult.
 * The function is deliberately side‑effect free except for console output –
 * this keeps the production pipeline unchanged while providing the required
 * visibility for the D3.6 audit.
 */
export function logProviderDiagnostics(
  providerKey: string,
  result: ProviderResult
): void {
  // ProviderResult already contains counts of discovered and rejected jobs.
  const rawJobs = result.jobsDiscovered + result.jobsRejected; // total jobs the provider attempted to parse
  const parsedJobs = result.jobsDiscovered; // jobs that passed provider‑level parsing

  // Now inspect the NormalizedJob objects that made it through the provider.
  const jobs: NormalizedJob[] = result.jobs as NormalizedJob[];

  let validUrlJobs = 0;
  let developerJobs = 0;
  let remoteJobs = 0;
  let experienceJobs = 0;

  const devKeywords = [/developer/i, /engineer/i, /software/i, /frontend/i, /backend/i, /full[- ]?stack/i];
  const expPattern = /0-?3\s*years|entry|junior/i;

  for (const job of jobs) {
    if (job.canonicalAppUrl && isValidHttpUrl(job.canonicalAppUrl)) {
      validUrlJobs++;
    }
    const title = job.title ?? '';
    const category = job.category ?? '';
    const combined = `${title} ${category}`;
    if (devKeywords.some((re) => re.test(combined))) {
      developerJobs++;
    }
    if (job.isRemote) {
      remoteJobs++;
    }
    if (job.experienceLevel && expPattern.test(job.experienceLevel)) {
      experienceJobs++;
    }
  }

  const finalAcceptedJobs = jobs.length;

  const diagnostics = {
    provider: providerKey,
    RAW: rawJobs,
    PARSED: parsedJobs,
    VALID_URL: validUrlJobs,
    DEVELOPER: developerJobs,
    REMOTE: remoteJobs,
    EXPERIENCE_0_3: experienceJobs,
    FINAL: finalAcceptedJobs,
    STATUS: result.success ? 'SUCCESS' : 'FAIL',
    ERROR: result.error ?? null,
  };

  // Emit a structured JSON line – this can be captured by the report script later.
  console.log('[ProviderDiagnostics]', JSON.stringify(diagnostics));
}
