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

export interface ProviderResult {
  providerKey: PlatformSource;
  jobs: NormalizedJob[];
  success: boolean;
  error?: string;
  durationMs: number;
  jobsDiscovered: number;
  jobsRejected: number;
}

export interface JobSourceProvider {
  name: string;
  providerKey: PlatformSource;
  timeoutMs: number;
  isOptional?: boolean;
  fetch(): Promise<ProviderResult>;
}
