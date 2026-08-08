import { PlatformSource } from "@prisma/client";

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
  discoveryUrl: string;
  canonicalAppUrl: string;
  postedAt: Date;
  rawDescription: string;
  hasFullText: boolean;
  technologies?: string[];
  metadata?: Record<string, any>;
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
