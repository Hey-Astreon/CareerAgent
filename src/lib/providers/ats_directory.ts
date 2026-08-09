export type AtsBoardStatus = "ACTIVE" | "EMPTY" | "404/MIGRATED" | "BLOCKED";

export interface AtsBoardEntry {
  slug: string;
  name: string;
  status: AtsBoardStatus;
  lastVerifiedAt?: string;
}

export const GREENHOUSE_BOARDS: AtsBoardEntry[] = [
  { slug: "stripe", name: "Stripe", status: "ACTIVE" },
  { slug: "vercel", name: "Vercel", status: "ACTIVE" },
  { slug: "openai", name: "OpenAI", status: "ACTIVE" },
  { slug: "anthropic", name: "Anthropic", status: "ACTIVE" },
  { slug: "datadog", name: "Datadog", status: "ACTIVE" },
  { slug: "cloudflare", name: "Cloudflare", status: "ACTIVE" },
  { slug: "sentry", name: "Sentry", status: "ACTIVE" },
  { slug: "elastic", name: "Elastic", status: "ACTIVE" },
  { slug: "mongodb", name: "MongoDB", status: "ACTIVE" },
  { slug: "posthog", name: "PostHog", status: "ACTIVE" },
  { slug: "gitlab", name: "GitLab", status: "ACTIVE" },
  { slug: "hashicorp", name: "HashiCorp", status: "ACTIVE" },
  { slug: "cockroachlabs", name: "Cockroach Labs", status: "ACTIVE" },
  { slug: "plaid", name: "Plaid", status: "ACTIVE" },
  { slug: "coinbase", name: "Coinbase", status: "ACTIVE" },
  { slug: "robinhood", name: "Robinhood", status: "ACTIVE" },
  { slug: "doordash", name: "DoorDash", status: "ACTIVE" },
  { slug: "airbnb", name: "Airbnb", status: "ACTIVE" },
  { slug: "instacart", name: "Instacart", status: "ACTIVE" },
  { slug: "duolingo", name: "Duolingo", status: "ACTIVE" },
  { slug: "affinity", name: "Affinity", status: "ACTIVE" },
  { slug: "brex", name: "Brex", status: "ACTIVE" },
  { slug: "chime", name: "Chime", status: "ACTIVE" },
  { slug: "grafana", name: "Grafana Labs", status: "ACTIVE" },
  { slug: "confluent", name: "Confluent", status: "ACTIVE" },
  { slug: "checkr", name: "Checkr", status: "ACTIVE" },
  { slug: "gusto", name: "Gusto", status: "ACTIVE" },
  { slug: "intercom", name: "Intercom", status: "ACTIVE" },
  { slug: "lucid", name: "Lucid", status: "ACTIVE" },
  { slug: "monzo", name: "Monzo", status: "ACTIVE" },
  { slug: "notion", name: "Notion", status: "ACTIVE" },
  { slug: "pagerduty", name: "PagerDuty", status: "ACTIVE" },
  { slug: "patreon", name: "Patreon", status: "ACTIVE" },
  { slug: "pinterest", name: "Pinterest", status: "ACTIVE" },
  { slug: "rubrik", name: "Rubrik", status: "ACTIVE" },
  { slug: "segment", name: "Segment", status: "ACTIVE" },
  { slug: "snowflake", name: "Snowflake", status: "ACTIVE" },
  { slug: "squarespace", name: "Squarespace", status: "ACTIVE" },
  { slug: "twilio", name: "Twilio", status: "ACTIVE" },
  { slug: "uipath", name: "UiPath", status: "ACTIVE" },
  { slug: "unity3d", name: "Unity", status: "ACTIVE" },
  { slug: "vanta", name: "Vanta", status: "ACTIVE" },
  { slug: "verkada", name: "Verkada", status: "ACTIVE" },
  { slug: "waymo", name: "Waymo", status: "ACTIVE" },
  { slug: "wiz", name: "Wiz", status: "ACTIVE" },
  { slug: "workato", name: "Workato", status: "ACTIVE" },
  { slug: "xero", name: "Xero", status: "ACTIVE" },
  { slug: "zendesk", name: "Zendesk", status: "ACTIVE" },
  { slug: "ziprecruiter", name: "ZipRecruiter", status: "ACTIVE" },
  { slug: "dbtlabs", name: "dbt Labs", status: "ACTIVE" },
  { slug: "clickhouse", name: "ClickHouse", status: "ACTIVE" },
  { slug: "snyk", name: "Snyk", status: "ACTIVE" },
  { slug: "canonical", name: "Canonical", status: "ACTIVE" },
  { slug: "duckduckgo", name: "DuckDuckGo", status: "ACTIVE" },
  { slug: "asana", name: "Asana", status: "ACTIVE" },
  { slug: "atlassian", name: "Atlassian", status: "ACTIVE" },
  { slug: "autodesk", name: "Autodesk", status: "ACTIVE" },
  { slug: "box", name: "Box", status: "ACTIVE" },
  { slug: "braze", name: "Braze", status: "ACTIVE" },
  { slug: "brave", name: "Brave Software", status: "ACTIVE" },
  { slug: "doximity", name: "Doximity", status: "ACTIVE" },
  { slug: "dropbox", name: "Dropbox", status: "ACTIVE" },
  { slug: "hubspot", name: "HubSpot", status: "ACTIVE" },
  { slug: "lyft", name: "Lyft", status: "ACTIVE" },
  { slug: "nextdoor", name: "Nextdoor", status: "ACTIVE" },
  { slug: "okta", name: "Okta", status: "ACTIVE" },
  { slug: "purestorage", name: "Pure Storage", status: "ACTIVE" },
  { slug: "redhat", name: "Red Hat", status: "ACTIVE" },
  { slug: "reddit", name: "Reddit", status: "ACTIVE" },
  { slug: "roku", name: "Roku", status: "ACTIVE" },
  { slug: "sailpoint", name: "SailPoint", status: "ACTIVE" },
  { slug: "servicenow", name: "ServiceNow", status: "ACTIVE" },
  { slug: "slack", name: "Slack", status: "ACTIVE" },
  { slug: "smartsheet", name: "Smartsheet", status: "ACTIVE" },
  { slug: "splunk", name: "Splunk", status: "ACTIVE" },
  { slug: "thoughtspot", name: "ThoughtSpot", status: "ACTIVE" },
  { slug: "uber", name: "Uber", status: "ACTIVE" },
  { slug: "upwork", name: "Upwork", status: "ACTIVE" },
  { slug: "zoom", name: "Zoom", status: "ACTIVE" },
  { slug: "zuora", name: "Zuora", status: "ACTIVE" },
];

export const LEVER_BOARDS: AtsBoardEntry[] = [
  { slug: "secureframe", name: "Secureframe", status: "ACTIVE" },
  { slug: "anyscale", name: "Anyscale", status: "ACTIVE" },
];

export const ASHBY_BOARDS: AtsBoardEntry[] = [
  { slug: "anysphere", name: "Anysphere (Cursor)", status: "ACTIVE" },
  { slug: "modal", name: "Modal Labs", status: "ACTIVE" },
  { slug: "replit", name: "Replit", status: "ACTIVE" },
  { slug: "temporal", name: "Temporal", status: "ACTIVE" },
  { slug: "launchdarkly", name: "LaunchDarkly", status: "ACTIVE" },
  { slug: "pinecone", name: "Pinecone", status: "ACTIVE" },
  { slug: "weaviate", name: "Weaviate", status: "ACTIVE" },
  { slug: "langchain", name: "LangChain", status: "ACTIVE" },
  { slug: "resend", name: "Resend", status: "ACTIVE" },
  { slug: "clerk", name: "Clerk", status: "ACTIVE" },
  { slug: "cohere", name: "Cohere", status: "ACTIVE" },
  { slug: "cursor", name: "Cursor", status: "ACTIVE" },
  { slug: "dagster", name: "Dagster", status: "ACTIVE" },
  { slug: "decagon", name: "Decagon", status: "ACTIVE" },
  { slug: "duckdb", name: "DuckDB", status: "ACTIVE" },
  { slug: "fly", name: "Fly.io", status: "ACTIVE" },
  { slug: "hyperbolic", name: "Hyperbolic", status: "ACTIVE" },
  { slug: "luma", name: "Luma", status: "ACTIVE" },
  { slug: "mistralai", name: "Mistral AI", status: "ACTIVE" },
  { slug: "motherduck", name: "MotherDuck", status: "ACTIVE" },
  { slug: "neon", name: "Neon", status: "ACTIVE" },
  { slug: "ollama", name: "Ollama", status: "ACTIVE" },
  { slug: "perplexity", name: "Perplexity", status: "ACTIVE" },
  { slug: "posthog", name: "PostHog", status: "ACTIVE" },
  { slug: "replicate", name: "Replicate", status: "ACTIVE" },
  { slug: "runway", name: "Runway", status: "ACTIVE" },
  { slug: "scale", name: "Scale AI", status: "ACTIVE" },
  { slug: "smallstep", name: "Smallstep", status: "ACTIVE" },
  { slug: "superhuman", name: "Superhuman", status: "ACTIVE" },
  { slug: "togetherai", name: "Together AI", status: "ACTIVE" },
  { slug: "unstructured", name: "Unstructured", status: "ACTIVE" },
  { slug: "valtown", name: "Val Town", status: "ACTIVE" },
  { slug: "vantage", name: "Vantage", status: "ACTIVE" },
  { slug: "warp", name: "Warp", status: "ACTIVE" },
  { slug: "fal", name: "Fal.ai", status: "ACTIVE" },
];

export const WORKABLE_BOARDS: AtsBoardEntry[] = [
  { slug: "epignosis", name: "Epignosis", status: "ACTIVE" },
  { slug: "learnworlds", name: "LearnWorlds", status: "ACTIVE" },
];
export const SMARTRECRUITERS_BOARDS: AtsBoardEntry[] = [
  { slug: "Visa", name: "Visa", status: "ACTIVE" },
  { slug: "Accenture1", name: "Accenture", status: "ACTIVE" },
];
export const RECRUITEE_BOARDS: AtsBoardEntry[] = [
  { slug: "hostaway", name: "Hostaway", status: "ACTIVE" },
  { slug: "gorgias", name: "Gorgias", status: "ACTIVE" },
];

/**
 * Strict 6-Step Board Verification Logic
 * Classifies ATS endpoints based on HTTP reachability, payload validity, and active job presence.
 * CRITICAL RULE: HTTP 200 alone is NOT sufficient to mark as ACTIVE.
 */
export function classifyAtsResponse(
  httpStatus: number,
  hasValidPayload: boolean,
  jobsLength: number
): AtsBoardStatus {
  if (httpStatus === 404 || httpStatus === 410) {
    return "404/MIGRATED";
  }
  if (httpStatus === 403 || httpStatus === 429) {
    return "BLOCKED";
  }
  if (httpStatus === 200 && hasValidPayload) {
    return jobsLength > 0 ? "ACTIVE" : "EMPTY";
  }
  return "BLOCKED";
}
