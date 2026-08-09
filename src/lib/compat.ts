import { Opportunity, JobOccurrence, JobPosting, RemoteScope } from "@prisma/client";

export interface LegacyJobItem {
  id: string;
  urlHash: string;
  url: string;
  company: string;
  title: string;
  category: string;
  jobType: string;
  experienceLevel: string;
  platform: string;
  location: string;
  isRemote: boolean;
  remoteScope?: RemoteScope;
  opportunitySignals?: string[];
  postedAt?: string | null;
  firstSeenAt?: string | null;
  rawDescription: string;
}

/**
 * Transforms an Opportunity into the legacy JobItem structure expected by frontend components.
 */
export function formatOpportunityForLegacyView(
  opp: Opportunity & { occurrences?: JobOccurrence[] }
): LegacyJobItem {
  const primaryOccurrence = opp.occurrences?.[0];
  let signals: string[] = [];
  try {
    signals = JSON.parse(opp.opportunitySignals || "[]");
  } catch {
    signals = [];
  }

  return {
    id: opp.id,
    urlHash: primaryOccurrence ? `${primaryOccurrence.providerKey.toLowerCase()}-${primaryOccurrence.sourceJobId || opp.id}` : opp.id,
    url: opp.canonicalAppUrl || primaryOccurrence?.discoveryUrl || "",
    company: opp.company,
    title: opp.title,
    category: opp.category,
    jobType: opp.jobType,
    experienceLevel: opp.experienceLevel,
    platform: primaryOccurrence?.providerKey || "DIRECT_PORTAL",
    location: opp.location,
    isRemote: opp.isRemote,
    remoteScope: opp.remoteScope,
    opportunitySignals: signals,
    postedAt: opp.postedAt ? opp.postedAt.toISOString() : null,
    firstSeenAt: opp.firstSeenAt ? opp.firstSeenAt.toISOString() : null,
    rawDescription: opp.rawDescription,
  };
}

/**
 * Formats a JobPosting into legacy JobItem format.
 */
export function formatJobPostingForLegacyView(posting: JobPosting): LegacyJobItem {
  let signals: string[] = [];
  try {
    signals = JSON.parse(posting.opportunitySignals || "[]");
  } catch {
    signals = [];
  }

  return {
    id: posting.id,
    urlHash: posting.urlHash,
    url: posting.url,
    company: posting.company,
    title: posting.title,
    category: posting.category,
    jobType: posting.jobType,
    experienceLevel: posting.experienceLevel,
    platform: posting.platform,
    location: posting.location,
    isRemote: posting.isRemote,
    remoteScope: posting.remoteScope,
    opportunitySignals: signals,
    postedAt: posting.postedAt ? posting.postedAt.toISOString() : null,
    firstSeenAt: posting.createdAt ? posting.createdAt.toISOString() : null,
    rawDescription: posting.rawDescription,
  };
}
