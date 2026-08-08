import { Opportunity, JobOccurrence, JobPosting } from "@prisma/client";

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
  postedAt: string;
  rawDescription: string;
}

/**
 * Transforms an Opportunity into the legacy JobItem structure expected by frontend components.
 */
export function formatOpportunityForLegacyView(
  opp: Opportunity & { occurrences?: JobOccurrence[] }
): LegacyJobItem {
  const primaryOccurrence = opp.occurrences?.[0];

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
    postedAt: opp.postedAt.toISOString(),
    rawDescription: opp.rawDescription,
  };
}

/**
 * Formats a JobPosting into legacy JobItem format.
 */
export function formatJobPostingForLegacyView(posting: JobPosting): LegacyJobItem {
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
    postedAt: posting.postedAt.toISOString(),
    rawDescription: posting.rawDescription,
  };
}
