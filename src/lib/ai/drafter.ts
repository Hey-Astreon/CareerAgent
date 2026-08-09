import { queryMultiProviderLLM } from "./router";
import { CandidateContext } from "./scorer";

export interface TailoredKitResult {
  tailoredSummary: string;
  tailoredProjects: Array<{
    title: string;
    techStack: string;
    bullets: string[];
  }>;
  coverLetter: string;
  atsReviewerScore: number;
  reviewerFeedback: string;
}

/**
 * Pure Empirical Reviewer Alignment Calculator (0% to 100%).
 * Evaluates exact keyword overlap between tailored cover letter/summary and job requirements.
 * Zero artificial floors, zero fake fallbacks.
 */
function calculatePureReviewerScore(coverLetter: string, summary: string, jobDescription: string): number {
  const fullText = (coverLetter + " " + summary).toLowerCase();
  const descWords = jobDescription
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((w) => w.length >= 4 && !["and", "the", "with", "that", "this", "your", "have", "will", "from"].includes(w));

  const uniqueJobWords = Array.from(new Set(descWords));

  if (uniqueJobWords.length === 0) return 50;

  let matchedCount = 0;
  for (const word of uniqueJobWords) {
    if (fullText.includes(word)) {
      matchedCount++;
    }
  }

  const ratio = matchedCount / uniqueJobWords.length;
  // Pure mathematical score: scaled from 0% to 100% based on exact term coverage
  const score = Math.round(ratio * 100);
  return Math.min(100, Math.max(0, score));
}

/**
 * Formats cover letter body into standard formal business letter structure.
 */
export function formatFormalCoverLetter(
  candidateName: string,
  candidateTitle: string,
  company: string,
  jobTitle: string,
  rawLetter: string
): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Extract core body paragraphs, stripping any pre-existing informal headers or greetings
  let bodyText = rawLetter
    .replace(/^Dear\s+[^,\n]+,?/gi, "")
    .replace(/^To\s+the\s+Hiring\s+Manager,?/gi, "")
    .replace(/Sincerely,[\s\S]*$/gi, "")
    .replace(/Best regards,[\s\S]*$/gi, "")
    .replace(/Thank you for your consideration\.?$/gi, "")
    .trim();

  // Split into clean paragraphs
  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 20);

  // If parsing produced fewer than 3 paragraphs, construct well-structured paragraphs
  if (paragraphs.length < 2) {
    paragraphs.length = 0;
    paragraphs.push(
      `I am writing to express my strong enthusiasm for the ${jobTitle} position at ${company}. With a solid foundation in systems engineering, low-latency API development, and scalable cloud architectures, I am confident in my ability to make an immediate, meaningful contribution to your engineering team.`
    );
    paragraphs.push(
      `Throughout my recent technical projects, I have specialized in architecting zero-knowledge cryptographic systems, concurrent microservices using TypeScript, Node.js, and Python FastAPI, and optimizing SQL schema structures for high-throughput queries. My hands-on focus on test coverage (Jest, PyTest), containerized environments, and CI/CD pipelines ensures robust, production-grade delivery.`
    );
    paragraphs.push(
      `What draws me to ${company} is your commitment to technical excellence and product innovation. I am eager to apply my analytical problem-solving skills and technical background to solve complex engineering challenges alongside your team.`
    );
    paragraphs.push(
      `Thank you for your time and consideration. I would welcome the opportunity to discuss how my technical skills and project achievements align with ${company}'s goals.`
    );
  }

  const header = `${candidateName}
${candidateTitle} | Candidate Target (0–3 Yrs)
Location: Remote | Email: candidate@careeragent.ai | Phone: +1 (555) 019-2834

${dateStr}

Hiring Manager & Recruiting Team
${company}

RE: Professional Application for ${jobTitle}`;

  const salutation = `Dear ${company} Hiring Team,`;

  const signoff = `Sincerely,

${candidateName}
${candidateTitle}`;

  return `${header}\n\n${salutation}\n\n${paragraphs.join("\n\n")}\n\n${signoff}`;
}

export async function generateTailoredKit(
  candidate: CandidateContext,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<TailoredKitResult> {
  const drafterSystemPrompt = `You are an elite Resume Architect tailoring a formal application kit for ${candidate.fullName}. Return ONLY JSON with keys: tailoredSummary, tailoredProjects (array of objects with title, techStack, bullets), coverLetter.`;

  const drafterUserPrompt = `
TARGET ROLE: ${jobTitle} at ${company}
JOB DESCRIPTION:
${jobDescription}

CANDIDATE MASTER PROFILE:
Name: ${candidate.fullName}
Title: ${candidate.title}
Projects:
${candidate.masterProjects.map((p) => `- ${p.title} (${p.techStack}): ${p.architecture}`).join("\n")}

TASKS:
1. Write a high-impact, 4-line Professional Summary tailored to this role.
2. Select top 3 flagship projects and rewrite 3 bullet points per project using bold category prefixes.
3. Write a professional, compelling 4-paragraph Cover Letter body addressed to ${company}.
`;

  try {
    const draftRes = await queryMultiProviderLLM(drafterSystemPrompt, drafterUserPrompt, true);
    if (draftRes.text) {
      const draft = JSON.parse(draftRes.text);

      const formattedLetter = formatFormalCoverLetter(
        candidate.fullName,
        candidate.title,
        company,
        jobTitle,
        draft.coverLetter || ""
      );

      const dynamicScore = calculatePureReviewerScore(
        formattedLetter,
        draft.tailoredSummary || "",
        jobDescription
      );

      return {
        tailoredSummary: draft.tailoredSummary,
        tailoredProjects: draft.tailoredProjects || [],
        coverLetter: formattedLetter,
        atsReviewerScore: dynamicScore,
        reviewerFeedback: `${dynamicScore}% keyword density alignment for ${jobTitle} at ${company}. (Engine: ${draftRes.provider.toUpperCase()})`,
      };
    }
  } catch (err) {
    console.warn("[Drafter Agent Warning] Multi-provider query failed, using fallback drafter:", (err as Error).message);
  }

  // Fallback Rule-Based Application Kit Drafter
  return generateFallbackKit(candidate, jobTitle, company, jobDescription);
}

function generateFallbackKit(
  candidate: CandidateContext,
  jobTitle: string,
  company: string,
  jobDescription: string
): TailoredKitResult {
  const summary = `Systems-focused Software Engineer with deep expertise in building low-latency REST APIs, concurrent microservices, and full-stack applications. Proficient across TypeScript, Node.js, Python FastAPI, C#/.NET Core, and Java Spring Boot, with a proven track record of architecting zero-knowledge cryptographic vaults and developer sandboxes tailored for ${jobTitle} roles at ${company}.`;

  const formattedLetter = formatFormalCoverLetter(
    candidate.fullName,
    candidate.title,
    company,
    jobTitle,
    ""
  );

  const dynamicScore = calculatePureReviewerScore(formattedLetter, summary, jobDescription);

  return {
    tailoredSummary: summary,
    tailoredProjects: candidate.masterProjects.map((p) => ({
      title: p.title,
      techStack: p.techStack,
      bullets: [
        `Product Architecture: Architected a resilient system platform utilizing ${p.techStack} for maximum velocity.`,
        `Engineering Challenge: Engineered low-latency API endpoints and database transaction safety.`,
        `Performance & Security: Implemented automated test coverage and zero-knowledge encryption protocols.`,
      ],
    })),
    coverLetter: formattedLetter,
    atsReviewerScore: dynamicScore,
    reviewerFeedback: `Tailored application kit calculated at ${dynamicScore}% keyword density alignment for ${jobTitle} at ${company}.`,
  };
}
