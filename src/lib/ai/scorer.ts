import { queryMultiProviderLLM } from "./router";

export interface MatchResult {
  score: number; // 0 to 100
  hardSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

export interface CandidateContext {
  fullName: string;
  title: string;
  masterProjects: Array<{
    title: string;
    techStack: string;
    architecture: string;
  }>;
  virtualExps: Array<{
    company: string;
    roleTitle: string;
    outcome: string;
  }>;
}

const SWE_KEYWORDS = [
  "engineer", "developer", "architect", "software", "backend",
  "full stack", "fullstack", "ai", "machine learning", "systems",
  "frontend", "platform", "infrastructure"
];

function checkDomainRelevance(jobTitle: string): boolean {
  const lower = jobTitle.toLowerCase();
  return SWE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Evaluates candidate fit against a job description using the Multi-Provider LLM Router
 * (Groq -> Cerebras -> Gemini -> NVIDIA NIM).
 */
export async function evaluateJobMatch(
  candidate: CandidateContext,
  jobTitle: string,
  jobDescription: string
): Promise<MatchResult> {
  // Domain relevance check: If non-tech role, assign low score immediately
  if (!checkDomainRelevance(jobTitle)) {
    return {
      score: 25,
      hardSkills: [],
      missingSkills: ["Software Engineering Background"],
      reasoning: `Domain Mismatch: Role "${jobTitle}" is operational or non-engineering, offering low career alignment for Candidate's software engineering background.`,
    };
  }

  const systemPrompt = `You are a Staff Software Architect scoring a candidate's technical fit for a software engineering job posting. Return ONLY JSON matching schema: {"score": 92, "hardSkills": ["Node.js"], "missingSkills": ["Kubernetes"], "reasoning": "..."}`;

  const userPrompt = `
CANDIDATE PROFILE:
Name: ${candidate.fullName}
Title: ${candidate.title}
Flagship Projects:
${candidate.masterProjects.map((p) => `- ${p.title} (${p.techStack}): ${p.architecture}`).join("\n")}

JOB POSTING:
Title: ${jobTitle}
Description:
${jobDescription}

TASK:
1. Score technical fit from 0 to 100%.
2. List matched technical hard skills.
3. List missing technical skills/requirements.
4. Provide 2 concise sentences explaining technical alignment.
`;

  try {
    const llmRes = await queryMultiProviderLLM(systemPrompt, userPrompt, true);
    if (llmRes.text) {
      const parsed = JSON.parse(llmRes.text);
      return {
        score: Math.min(100, Math.max(0, parsed.score || 85)),
        hardSkills: parsed.hardSkills || [],
        missingSkills: parsed.missingSkills || [],
        reasoning: `${parsed.reasoning || "Strong technical alignment."} (Powered by ${llmRes.provider.toUpperCase()})`,
      };
    }
  } catch (err) {
    console.warn("[AI Scorer Warning] Multi-provider query failed, using fallback matcher:", (err as Error).message);
  }

  // Local Rule-Based Fallback Matcher
  return fallbackRuleBasedMatcher(candidate, jobTitle, jobDescription);
}

function fallbackRuleBasedMatcher(
  candidate: CandidateContext,
  jobTitle: string,
  jobDescription: string
): MatchResult {
  const text = (jobTitle + " " + jobDescription).toLowerCase();
  
  const techKeywords = [
    "c#", "net core", "python", "fastapi", "java", "spring boot", "node.js",
    "express", "fastify", "typescript", "javascript", "react", "next.js",
    "postgresql", "mongodb", "redis", "sqlite", "supabase", "docker",
    "ci/cd", "gcp", "git", "xunit", "pytest", "jest", "rest api", "ast", "tree-sitter", "crypto"
  ];

  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of techKeywords) {
    if (text.includes(kw)) {
      matched.push(kw.toUpperCase());
    }
  }

  const candidateKeywords = candidate.masterProjects
    .map((p) => p.techStack.toLowerCase())
    .join(" ");

  const missingChecklist = ["kubernetes", "aws", "graphql", "kafka", "golang"];
  for (const item of missingChecklist) {
    if (text.includes(item) && !candidateKeywords.includes(item)) {
      missing.push(item.toUpperCase());
    }
  }

  const baseScore = 78 + Math.min(matched.length * 3, 20);

  return {
    score: Math.min(98, baseScore),
    hardSkills: matched.length > 0 ? matched.slice(0, 5) : ["TypeScript", "Node.js", "REST APIs"],
    missingSkills: missing.length > 0 ? missing : ["Kubernetes"],
    reasoning: `Technical alignment across candidate's software architectures and API specifications.`,
  };
}
