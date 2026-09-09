import { PlatformSource, RemoteScope } from "@prisma/client";

export type OpportunitySignal =
  | "FRESH"
  | "DIRECT_APPLICATION"
  | "NICHE_SOURCE"
  | "EXPLICIT_APPLICANT_COUNT"
  | "UNKNOWN";

export type ApplicationUrlType =
  | "DIRECT_ATS"
  | "DIRECT_EMPLOYER_SITE"
  | "AGGREGATOR_PAGE"
  | "COMMUNITY_POST";

export type VerificationStatusType =
  | "VERIFIED_DIRECT_ATS"
  | "VERIFIED_AGGREGATOR"
  | "COMMUNITY_SUBMITTED"
  | "UNVERIFIED";

export interface NormalizedJob {
  sourceJobId?: string;
  providerKey: PlatformSource;
  company: string;
  companySlug: string;
  title: string;
  category: string;
  jobType: string;
  experienceLevel: string;
  location: string;
  isRemote: boolean;
  remoteRegion?: string;
  remoteScope: RemoteScope;
  discoveryUrl: string;
  canonicalAppUrl: string;
  applicationUrlType?: ApplicationUrlType;
  verificationStatus?: VerificationStatusType;
  postedAt?: Date | null;
  applicantCount?: number | null;
  opportunitySignals: OpportunitySignal[];
  rawDescription: string;
  hasFullText: boolean;
  technologies?: string[];
  metadata?: Record<string, unknown>;
}

export interface ProviderStageDiagnostics {
  /** Number of source records/elements examined before normalization. */
  rawCandidates: number;
  missingTitle: number;
  invalidUrl: number;
  roleGateRejected: number;
  accepted: number;
  /** True when the provider supplied exact stage counters rather than legacy estimates. */
  instrumented: boolean;
}

/** Per-endpoint timing and outcome captured during a single provider run. */
export interface ProviderEndpointTelemetry {
  endpointKey: string;
  endpoint: string;
  latencyMs: number;
  attempts: number;
  success: boolean;
  statusCode?: number;
  retryAfterMs?: number;
  error?: string;
}

/** Aggregate endpoint reliability for one provider run; derived only from that run's endpoint telemetry. */
export interface ProviderEndpointTelemetrySummary {
  totalEndpoints: number;
  successfulEndpoints: number;
  failedEndpoints: number;
  failureRatePercent: number;
  averageLatencyMs: number;
}

export interface ProviderResult {
  providerKey: PlatformSource;
  jobs: NormalizedJob[];
  success: boolean;
  error?: string;
  durationMs: number;
  jobsDiscovered: number;
  jobsRejected: number;
  diagnostics?: ProviderStageDiagnostics;
  endpointTelemetry?: ProviderEndpointTelemetry[];
  endpointTelemetrySummary?: ProviderEndpointTelemetrySummary;
}

export interface JobSourceProvider {
  name: string;
  providerKey: PlatformSource;
  timeoutMs: number;
  isOptional?: boolean;
  fetch(): Promise<ProviderResult>;
}
