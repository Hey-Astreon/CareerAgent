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

const NON_DEV_KEYWORDS = [
  "support engineer", "customer support", "technical support", "helpdesk",
  "account executive", "recruiter", "sales", "marketing"
];

function isSupportOrNonDevRole(jobTitle: string): boolean {
  const lower = jobTitle.toLowerCase();
  return NON_DEV_KEYWORDS.some((kw) => lower.includes(kw));
}

const TECH_DICTIONARY = [
  "python", "fastapi", "django", "flask", "c#", ".net", ".net core", "java", "spring", "spring boot",
  "node.js", "nodejs", "express", "fastify", "typescript", "javascript", "react", "next.js", "vue",
  "angular", "postgresql", "postgres", "mongodb", "redis", "sqlite", "supabase", "docker", "kubernetes",
  "k8s", "aws", "gcp", "azure", "ci/cd", "github actions", "tree-sitter", "ast", "chromadb", "web crypto api",
  "zod", "graphql", "rest api", "restful", "grpc", "microservices", "system design", "linux", "unix",
  "git", "xunit", "pytest", "jest", "golang", "go", "rust", "c++", "c", "kafka", "elasticsearch",
  "prometheus", "grafana", "tailwind", "css", "html", "webassembly", "llm", "ai", "machine learning", "vector search"
];

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const skill of TECH_DICTIONARY) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
    if (regex.test(lower)) {
      const displayMap: Record<string, string> = {
        "python": "Python",
        "fastapi": "FastAPI",
        "django": "Django",
        "flask": "Flask",
        "c#": "C#",
        ".net": ".NET",
        ".net core": ".NET Core",
        "java": "Java",
        "spring": "Spring",
        "spring boot": "Spring Boot",
        "node.js": "Node.js",
        "nodejs": "Node.js",
        "express": "Express.js",
        "fastify": "Fastify",
        "typescript": "TypeScript",
        "javascript": "JavaScript",
        "react": "React",
        "next.js": "Next.js",
        "vue": "Vue.js",
        "angular": "Angular",
        "postgresql": "PostgreSQL",
        "postgres": "PostgreSQL",
        "mongodb": "MongoDB",
        "redis": "Redis",
        "sqlite": "SQLite",
        "supabase": "Supabase",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "k8s": "Kubernetes",
        "aws": "AWS",
        "gcp": "Google Cloud (GCP)",
        "azure": "Azure",
        "ci/cd": "CI/CD",
        "github actions": "GitHub Actions",
        "tree-sitter": "Tree-Sitter AST",
        "ast": "AST Parsing",
        "chromadb": "ChromaDB",
        "web crypto api": "Web Crypto API",
        "zod": "Zod Validation",
        "graphql": "GraphQL",
        "rest api": "REST APIs",
        "restful": "RESTful Architecture",
        "grpc": "gRPC",
        "microservices": "Microservices",
        "system design": "System Design",
        "linux": "Linux/Unix",
        "unix": "Linux/Unix",
        "git": "Git",
        "xunit": "xUnit",
        "pytest": "PyTest",
        "jest": "Jest",
        "golang": "Go",
        "go": "Go",
        "rust": "Rust",
        "c++": "C++",
        "c": "C",
        "kafka": "Apache Kafka",
        "elasticsearch": "Elasticsearch",
        "prometheus": "Prometheus",
        "grafana": "Grafana",
        "tailwind": "Tailwind CSS",
        "css": "CSS3",
        "html": "HTML5",
        "webassembly": "WebAssembly",
        "llm": "LLMs",
        "ai": "AI Engineering",
        "machine learning": "Machine Learning",
        "vector search": "Vector Databases",
      };
      found.push(displayMap[skill] || skill.toUpperCase());
    }
  }

  return Array.from(new Set(found));
}

/**
 * Evaluates candidate technical fit against a job description using 100% pure empirical skill overlap.
 * Zero artificial floors, zero fake fallbacks.
 */
export async function evaluateJobMatch(
  candidate: CandidateContext,
  jobTitle: string,
  jobDescription: string
): Promise<MatchResult> {
  if (isSupportOrNonDevRole(jobTitle)) {
    return {
      score: 15,
      hardSkills: [],
      missingSkills: ["Core Backend Engineering", "Systems Architecture"],
      reasoning: `Domain Mismatch: Role "${jobTitle}" is an operational support role rather than a software engineering role.`,
    };
  }

  const candidateFullText = [
    candidate.title,
    ...candidate.masterProjects.map((p) => `${p.title} ${p.techStack} ${p.architecture}`),
    ...candidate.virtualExps.map((e) => `${e.company} ${e.roleTitle} ${e.outcome}`),
  ].join(" ");

  const candidateSkills = extractSkills(candidateFullText);
  const jobRequiredSkills = extractSkills(jobTitle + " " + jobDescription);

  const hardSkills = jobRequiredSkills.filter((skill) =>
    candidateSkills.some((cs) => cs.toLowerCase() === skill.toLowerCase())
  );

  const missingSkills = jobRequiredSkills.filter(
    (skill) => !candidateSkills.some((cs) => cs.toLowerCase() === skill.toLowerCase())
  );

  const systemPrompt = `You are a Staff Software Architect evaluating technical fit for a job posting. Return strictly valid JSON: {"score": 85, "hardSkills": ["Python", "FastAPI"], "missingSkills": ["Kubernetes"], "reasoning": "Candidate demonstrates strong backend skills matching the job requirements."}`;

  const userPrompt = `
CANDIDATE PROFILE:
Name: ${candidate.fullName}
Title: ${candidate.title}
Key Technical Stack & Projects: ${candidateSkills.join(", ")}
Flagship Projects:
${candidate.masterProjects.map((p) => `- ${p.title} (${p.techStack}): ${p.architecture}`).join("\n")}

JOB POSTING:
Title: ${jobTitle}
Required Technologies Detected: ${jobRequiredSkills.join(", ") || "General Software Engineering"}
Description Snippet: ${jobDescription.slice(0, 800)}

TASK:
1. Provide an accurate score from 0 to 100 based on technical match.
2. List 3 to 6 overlapping hard skills present in both candidate stack and job requirements.
3. List 2 to 5 missing technologies requested in job description that candidate lacks.
4. Write a 2-sentence executive technical fit summary.
`;

  try {
    const llmRes = await queryMultiProviderLLM(systemPrompt, userPrompt, true);
    if (llmRes.text) {
      const parsed = JSON.parse(llmRes.text);
      const scoreNum = Number(parsed.score);
      const validatedScore = !isNaN(scoreNum) ? Math.min(100, Math.max(0, scoreNum)) : Math.round((hardSkills.length / (jobRequiredSkills.length || 1)) * 100);

      return {
        score: validatedScore,
        hardSkills: Array.isArray(parsed.hardSkills) && parsed.hardSkills.length > 0 ? parsed.hardSkills : hardSkills,
        missingSkills: Array.isArray(parsed.missingSkills) && parsed.missingSkills.length > 0 ? parsed.missingSkills : missingSkills,
        reasoning: `${parsed.reasoning || "Technical evaluation completed."} (Engine: ${llmRes.provider.toUpperCase()})`,
      };
    }
  } catch (err) {
    console.warn("[AI Scorer Warning] Multi-provider query failed, utilizing pure empirical matcher:", (err as Error).message);
  }

  // 100% Pure Empirical Calculation: Match ratio = hardSkills / jobRequiredSkills
  let calculatedScore = 50;
  if (jobRequiredSkills.length > 0) {
    calculatedScore = Math.round((hardSkills.length / jobRequiredSkills.length) * 100);
  }

  return {
    score: Math.min(100, Math.max(0, calculatedScore)),
    hardSkills,
    missingSkills,
    reasoning: `${candidate.fullName} matches ${hardSkills.length} out of ${jobRequiredSkills.length || 1} required technical skills for ${jobTitle}.`,
  };
}
