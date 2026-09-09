import { queryMultiProviderLLM } from "./router";
import { CandidateContext, extractSkills } from "./scorer";

export interface ResumeHeader {
  fullName: string;
  targetHeadline: string;
  location: string;
  phone: string;
  email: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
}

export interface ResumeSkillCategory {
  categoryName: string;
  skillsText: string;
}

export interface ResumeProject {
  title: string;
  techStack: string;
  liveDemoUrl: string;
  githubUrl: string;
  bullets: string[];
}

export interface ResumeSimulation {
  company: string;
  roleTitle: string;
  period: string;
  problemScope: string;
  actionTaken: string;
  engineeringOutcome: string;
}

export interface ResumeEducation {
  degree: string;
  university: string;
  period: string;
  coursework: string;
}

export interface OptimizedResume {
  header: ResumeHeader;
  summary: string;
  skills: ResumeSkillCategory[];
  projects: ResumeProject[];
  simulations: ResumeSimulation[];
  education: ResumeEducation;
  targetRole: string;
  targetCompany: string;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  tailoringNotes: string;
}

/**
 * Returns the candidate master baseline resume structure
 */
export function getMasterResumeBaseline(slug: string): OptimizedResume {
  const isAyushi = slug.toLowerCase() === "ayushi";

  if (isAyushi) {
    return {
      header: {
        fullName: "AYUSHI RAJ",
        targetHeadline: "AI-Powered Full Stack Software Engineer | Backend & Systems Specialist",
        location: "Bihar, India",
        phone: "+91-8709852305",
        email: "ayushi29507@gmail.com",
        portfolioUrl: "https://ayushiraj.me",
        githubUrl: "https://github.com/Silenttears-cloud",
        linkedinUrl: "https://www.linkedin.com/in/alrya404/",
      },
      summary:
        "Systems-focused Software Engineer with deep expertise in building low-latency REST APIs, multi-model LLM orchestration gateways, and full-stack web applications. Proficient across TypeScript, Node.js, Python FastAPI, C#/.NET Core, and Java Spring Boot, with a proven track record of architecting zero-knowledge cryptographic vaults and automated developer sandboxes. Demonstrated mastery in database normalization (3NF), Redis token-bucket caching, and automated testing (Jest, PyTest, xUnit) to deliver robust software systems.",
      skills: [
        {
          categoryName: "Backend & Systems",
          skillsText: "Node.js • Express.js • Fastify • Python (FastAPI) • C# (.NET Core) • Java (Spring Boot) • REST APIs",
        },
        {
          categoryName: "Databases & Caching",
          skillsText: "Redis • PostgreSQL • MongoDB • SQLite • Supabase • Schema Design (3NF)",
        },
        {
          categoryName: "Languages",
          skillsText: "C • Rust • TypeScript • JavaScript • Python • C# • Java • SQL • HTML5 • CSS3",
        },
        {
          categoryName: "Frontend UI & Full Stack",
          skillsText: "React.js • Next.js • Express.js • Redux • Monaco Editor • TailwindCSS • Bootstrap",
        },
        {
          categoryName: "Testing & DevOps",
          skillsText: "Jest • PyTest • xUnit • Moq • JUnit 5 • Docker • CI/CD • GCP • Git • Vercel • Render",
        },
        {
          categoryName: "AI Gateway & Security",
          skillsText: "Multi-Model Routing • Prometheus Telemetry • Web Crypto API (AES-GCM) • PBKDF2 • JWT Auth",
        },
      ],
      projects: [
        {
          title: "IDBI FinSync - AI-Powered Wealth & Financial Management Engine (Next.js, React, Fastify, Gemini API)",
          techStack: "Next.js, React, Fastify, Gemini API, PostgreSQL, Prisma",
          liveDemoUrl: "https://idbi-fin-sync-web.vercel.app/",
          githubUrl: "https://github.com/Silenttears-cloud/IDBI-FinSync",
          bullets: [
            "Product Architecture: Co-developed an intelligent financial tracking dashboard in a TypeScript monorepo, connecting a Fastify backend API to a responsive React frontend client.",
            "AI Integration Challenge: Implemented application-side integration for 'Mitra' AI advisor using Gemini API to analyze balance and financial metrics, designing custom client-side parsing for streaming AI responses.",
            "Database & Concurrency: Structured PostgreSQL transaction ledgers with Prisma ORM and Fastify microservice endpoints to process concurrent balance updates reliably.",
          ],
        },
        {
          title: "Alyra Lock - Secure Zero-Knowledge Password Vault (React, TypeScript, Express, MongoDB)",
          techStack: "React, TypeScript, Express, MongoDB, Web Crypto API",
          liveDemoUrl: "https://alyra-lock.vercel.app/",
          githubUrl: "https://github.com/Silenttears-cloud/Zero-knowledge-password-manager-",
          bullets: [
            "Product Architecture: Engineered a client-side zero-knowledge password vault ensuring master encryption keys remain entirely isolated inside user browser memory, mitigating cloud database leak risks.",
            "Cryptographic Engineering: Implemented Web Crypto API primitives utilizing AES-GCM (256-bit) payload encryption and PBKDF2 key derivation over 100,000 hashing iterations for key security.",
            "Performance & Security: Developed high-throughput Express.js REST API sync endpoints with JWT authentication and strict CORS headers, keeping vault database sync latency under 200ms.",
          ],
        },
        {
          title: "Astra Vision - AI Sandbox & Code Parsing Platform (FastAPI, Python, Monaco, Tree-Sitter)",
          techStack: "FastAPI, Python, Monaco, Tree-Sitter, ChromaDB",
          liveDemoUrl: "https://astra-frontend-mrfinklbba-uc.a.run.app/",
          githubUrl: "https://github.com/Silenttears-cloud/Astra_vision",
          bullets: [
            "Product Architecture: Architected an automated code-parsing platform and browser sandbox that allows developers to safely execute untrusted code while visualizing full-stack repository dependency graphs.",
            "Sandbox Runtime Challenge: Built a self-healing Python execution engine with subprocess isolation and security checkpoints to intercept unauthorized OS file system calls and network socket requests in real time.",
            "Indexing Performance: Integrated Tree-Sitter AST compilers and ChromaDB vector search to parse repository syntax nodes, enabling instant code graph dependency analysis under 200ms.",
          ],
        },
      ],
      simulations: [
        {
          company: "Commonwealth Bank (CommBank)",
          roleTitle: "Software Engineering Virtual Simulation",
          period: "June 2026",
          problemScope: "Diagnosed and resolved silent data overwrite bugs across high-traffic C#/.NET Core financial API controllers handling MongoDB document updates across financial services endpoints.",
          actionTaken: "Extended C# Web API controllers with $set atomic operators for partial payload updates and modernized an interactive React/Redux Goal Manager UI component for banking clients.",
          engineeringOutcome: "Authored comprehensive automated test suites using xUnit and Moq, covering complex boundary conditions to guarantee high reliability and transactional consistency.",
        },
        {
          company: "Y Combinator (YC Startup - Shiptivity)",
          roleTitle: "Software Engineering Virtual Simulation",
          period: "June 2026",
          problemScope: "Fixed key constraint collisions and slow re-rendering performance on a real-time drag-and-drop Kanban workflow board used by engineering teams to track task state transitions.",
          actionTaken: "Architected dynamic SQLite priority reordering logic using atomic transactions to update priority ranks sequentially and integrated Dragula drag-and-drop state hooks in React.",
          engineeringOutcome: "Reduced UI component re-render cycles by 30% and patched OpenSSL compilation bottlenecks in legacy Node.js Webpack configurations to optimize runtime builds.",
        },
        {
          company: "Walmart USA",
          roleTitle: "Advanced Software Engineering Virtual Simulation",
          period: "May 2026",
          problemScope: "Solved indexing overhead and performance bottlenecks in high-volume retail inventory processing queues handling unnormalized data ingestion from legacy spreadsheets.",
          actionTaken: "Implemented a generic K-ary Max Heap structure in Java using fast bitwise shift operators (<<, >>>) and built 3NF database schemas with design pattern abstractions.",
          engineeringOutcome: "Accelerated queue indexing calculations by 35% and engineered automated Python ETL pipelines using csv and sqlite3 to clean and consolidate disparate spreadsheets.",
        },
      ],
      education: {
        degree: "Bachelor of Computer Applications (BCA)",
        university: "Amity University Noida",
        period: "Expected July 2028",
        coursework: "Data Structures & Algorithms (DSA) • Database Management Systems (DBMS) • Operating Systems (OS) • Computer Networks • Object-Oriented Programming (OOP)",
      },
      targetRole: "Full Stack Software Engineer",
      targetCompany: "Global Remote",
      atsScore: 92,
      matchedKeywords: ["TypeScript", "React", "Node.js", "REST APIs", "PostgreSQL", "FastAPI"],
      missingKeywords: [],
      tailoringNotes: "Master Profile Baseline",
    };
  }

  // Roushan Kumar Baseline
  return {
    header: {
      fullName: "ROUSHAN KUMAR",
      targetHeadline: "Systems Engineer | Backend Architect | AI Developer Tools Specialist",
      location: "Patna, Bihar, India",
      phone: "+91-9431483512",
      email: "roushanraut404@gmail.com",
      portfolioUrl: "https://astreon.me",
      githubUrl: "https://github.com/Hey-Astreon",
      linkedinUrl: "https://linkedin.com/in/astreon4547",
    },
    summary:
      "Systems-focused Software Engineer with deep expertise in building low-latency REST APIs, concurrent microservice architectures, and full-stack web applications. Proficient across C#/.NET Core, Java Spring Boot, Python FastAPI, and modern TypeScript runtimes (Node.js, Express, React, Next.js), with a proven track record of architecting zero-knowledge cryptographic vaults and autonomous AI developer sandboxes. Demonstrated mastery in database normalization (3NF), asynchronous event loops, and automated test automation (xUnit, JUnit 5, PyTest) to deliver robust, enterprise-grade software products.",
    skills: [
      {
        categoryName: "Backend & Systems",
        skillsText: "C# (.NET Core Web API) • Java (Spring Boot) • Python (FastAPI) • Node.js • Fastify • Express.js • REST APIs",
      },
      {
        categoryName: "Databases & Caching",
        skillsText: "PostgreSQL • MongoDB • Redis • SQLite • Supabase • Schema Design (3NF)",
      },
      {
        categoryName: "Languages",
        skillsText: "C • Rust • C# • Java • Python • JavaScript • TypeScript • SQL • HTML5 • CSS3",
      },
      {
        categoryName: "Frontend UI & Full Stack",
        skillsText: "React.js • Next.js • Express.js • Redux • Monaco Editor • TailwindCSS • Bootstrap",
      },
      {
        categoryName: "Testing & DevOps",
        skillsText: "xUnit • Moq • JUnit 5 • PyTest • Jest • Docker • CI/CD • GCP • Git • Gradle • Vercel • Render",
      },
      {
        categoryName: "AI Tooling & Security",
        skillsText: "Gemini API • Tree-Sitter AST • Web Crypto API (AES-GCM) • PBKDF2 • JWT • Prompt Engineering",
      },
    ],
    projects: [
      {
        title: "Astra Vision - Developer Sandbox & Code Graph Parser (FastAPI, Python, Monaco, Tree-Sitter)",
        techStack: "FastAPI, Python, Monaco, Tree-Sitter, ChromaDB",
        liveDemoUrl: "https://astra-frontend-mrfinklbba-uc.a.run.app/",
        githubUrl: "https://github.com/Hey-Astreon/Astra-Vision",
        bullets: [
          "Product Architecture: Architected an automated code-parsing platform and browser sandbox that allows developers to safely execute untrusted code while visualizing full-stack repository dependency graphs.",
          "Sandbox Runtime Challenge: Built a self-healing Python execution engine with subprocess isolation and security checkpoints to intercept unauthorized OS file system calls and network socket requests in real time.",
          "Indexing Performance: Integrated Tree-Sitter AST compilers and ChromaDB vector search to parse repository syntax nodes, enabling instant code graph dependency analysis under 200ms.",
        ],
      },
      {
        title: "IDBI FinSync - AI-Powered Wealth & Financial Management Engine (Next.js, React, Fastify, Gemini API)",
        techStack: "Next.js, React, Fastify, Gemini API, PostgreSQL, Zod",
        liveDemoUrl: "https://idbi-fin-sync-web.vercel.app/",
        githubUrl: "https://github.com/Hey-Astreon/IDBI-FinSync",
        bullets: [
          "Product Architecture: Co-created an intelligent personal financial management web app in a monorepo that unifies bank ledgers, investment portfolios, and expense streams into a live interactive dashboard.",
          "AI Integration Challenge: Embedded \"Mitra,\" an interactive AI wealth consultant leveraging Gemini API to analyze spending habits, detect budget anomalies, and deliver personalized financial guidance.",
          "Database & Concurrency: Designed PostgreSQL transaction ledgers validated by Zod schemas and Fastify microservice endpoints, handling concurrent balance updates with zero data loss.",
        ],
      },
      {
        title: "Alyra Lock - Secure Zero-Knowledge Password Vault (React, TypeScript, Express, MongoDB)",
        techStack: "React, TypeScript, Express, MongoDB, Web Crypto API",
        liveDemoUrl: "https://alyra-lock.vercel.app/",
        githubUrl: "https://github.com/Hey-Astreon/Zero-Knowledge-Password-Manager",
        bullets: [
          "Product Architecture: Engineered a client-side zero-knowledge password vault ensuring master encryption keys remain entirely isolated inside user browser memory, mitigating cloud database leak risks.",
          "Cryptographic Engineering: Implemented Web Crypto API primitives utilizing AES-GCM (256-bit) payload encryption and PBKDF2 key derivation over 100,000 hashing iterations for key security.",
          "Performance & Security: Developed high-throughput Express.js REST API sync endpoints with JWT authentication and strict CORS headers, keeping vault database sync latency under 200ms.",
        ],
      },
    ],
    simulations: [
      {
        company: "Commonwealth Bank (CommBank)",
        roleTitle: "Software Engineering Virtual Simulation",
        period: "June 2026",
        problemScope: "Diagnosed and resolved silent data overwrite bugs across high-traffic C#/.NET Core financial API controllers handling MongoDB document updates across financial services endpoints.",
        actionTaken: "Extended C# Web API controllers with $set atomic operators for partial payload updates and modernized an interactive React/Redux Goal Manager UI component for banking clients.",
        engineeringOutcome: "Authored comprehensive automated test suites using xUnit and Moq, covering complex boundary conditions to guarantee high reliability and transactional consistency.",
      },
      {
        company: "Y Combinator (YC Startup - Shiptivity)",
        roleTitle: "Software Engineering Virtual Simulation",
        period: "June 2026",
        problemScope: "Fixed key constraint collisions and slow re-rendering performance on a real-time drag-and-drop Kanban workflow board used by engineering teams to track task state transitions.",
        actionTaken: "Architected dynamic SQLite priority reordering logic using atomic transactions to update priority ranks sequentially and integrated Dragula drag-and-drop state hooks in React.",
        engineeringOutcome: "Reduced UI component re-render cycles by 30% and patched OpenSSL compilation bottlenecks in legacy Node.js Webpack configurations to optimize runtime builds.",
      },
      {
        company: "Walmart USA",
        roleTitle: "Advanced Software Engineering Virtual Simulation",
        period: "May 2026",
        problemScope: "Solved indexing overhead and performance bottlenecks in high-volume retail inventory processing queues handling unnormalized data ingestion from legacy spreadsheets.",
        actionTaken: "Implemented a generic K-ary Max Heap structure in Java using fast bitwise shift operators (<<, >>>) and built 3NF database schemas with design pattern abstractions.",
        engineeringOutcome: "Accelerated queue indexing calculations by 35% and engineered automated Python ETL pipelines using csv and sqlite3 to clean and consolidate disparate spreadsheets.",
      },
    ],
    education: {
      degree: "Bachelor of Computer Applications (BCA)",
      university: "Amity University Noida",
      period: "Expected July 2028",
      coursework: "Data Structures & Algorithms (DSA) • Database Management Systems (DBMS) • Operating Systems (OS) • Computer Networks • Object-Oriented Programming (OOP)",
    },
    targetRole: "Systems & Backend Software Engineer",
    targetCompany: "Global Remote",
    atsScore: 94,
    matchedKeywords: ["C#", "Java", "Python", "FastAPI", "PostgreSQL", "REST APIs", "Docker"],
    missingKeywords: [],
    tailoringNotes: "Master Profile Baseline",
  };
}

/**
 * Optimizes and tailors the 1-page A4 resume for a specific target job using Big Tech Recruiter & Google XYZ standards
 */
export async function optimizeResumeForJob(
  profileSlug: string,
  jobTitle: string,
  company: string,
  jobDescription: string
): Promise<OptimizedResume> {
  const baseline = getMasterResumeBaseline(profileSlug);
  const targetSkills = extractSkills(jobDescription);

  const matchedKeywords = targetSkills.filter((sk) =>
    baseline.skills.some((cat) => cat.skillsText.toLowerCase().includes(sk.toLowerCase())) ||
    baseline.projects.some((p) => p.techStack.toLowerCase().includes(sk.toLowerCase())) ||
    baseline.summary.toLowerCase().includes(sk.toLowerCase())
  );

  const missingKeywords = targetSkills.filter((sk) => !matchedKeywords.includes(sk)).slice(0, 5);

  const systemPrompt = `You are a Senior Principal Recruiter and Hiring Director at a Tier-1 Big Tech MNC (Google, Meta, Stripe standard) tailoring an executive 1-page A4 resume for ${baseline.header.fullName} applying for '${jobTitle}' at '${company}'.

STRICT WRITING & RECRUITING RULES:
1. FACTUAL INTEGRITY (NO HALLUCINATIONS):
   - NEVER fabricate years of experience or enterprise domains the candidate never built (e.g. NEVER claim to be an SAP consultant, Salesforce developer, or 10-year veteran).
   - The candidate is a high-caliber Systems, Backend, and AI Full-Stack Engineer. Frame their real strengths (low-latency APIs, distributed microservices, database transactions, AST parsers, cryptographic security, automated testing) to demonstrate exceptional transferability for '${jobTitle}' at '${company}'.

2. BAN ROBOTIC AI BUZZWORDS & FLUFF:
   - FORBIDDEN WORDS: "Seasoned", "Proven track record", "Passionate", "Driving excellence", "Results-oriented", "Spearheaded", "Dynamic", "Adept at".
   - Use direct, authoritative, human technical statements.

3. GOOGLE XYZ POWER-VERB FORMULA FOR ALL BULLETS:
   - Structure: [Decisive Technical Verb] [Specific System Built/Optimized] using [Exact Tech Stack] to [Achieve concrete performance/reliability outcome].
   - Verbs to use: Architected, Engineered, Benchmarked, Streamlined, Hardened, Containerized, Decoupled, Orchestrated, Profiled, Accelerated.
   - Example: "Architected streaming financial analytics pipeline using Google Gemini SDK and Fastify microservices, slashing transaction anomaly detection latency by 35%."

4. ATS FORMATTING & GEOMETRY:
   - Strictly maintain the 6 standard sections (Header, Professional Summary, 6 Categorized Skill Groups, 3 Flagship Projects, 3 Virtual Simulations, Education).
   - Keep the summary to exactly 4 dense, impactful lines (no fluff).
   - Ensure standard capitalization: PostgreSQL, FastAPI, TypeScript, Node.js, xUnit, Web Crypto API (AES-GCM 256-bit), PBKDF2.
   - NEVER mention Coco AI.

Return ONLY a valid JSON object with keys:
- "targetHeadline": string (Punchy 1-line tailored professional title, e.g. "Software Engineer | Backend, Systems & Distributed Architecture")
- "summary": string (Dense, authoritative 4-line summary highlighting real systems strengths mapped to the role)
- "skills": array of 6 objects { "categoryName": string, "skillsText": string } (Front-load matching skills in each category)
- "projects": array of 3 objects { "title": string, "techStack": string, "liveDemoUrl": string, "githubUrl": string, "bullets": [string, string, string] } (Google XYZ bullet points)
`;

  const userPrompt = `
TARGET ROLE: ${jobTitle} at ${company}
JOB DESCRIPTION:
${jobDescription}

CANDIDATE FACTUAL BACKGROUND:
Candidate: ${baseline.header.fullName}
Headline: ${baseline.header.targetHeadline}
Education: ${baseline.education.degree}, ${baseline.education.university} (${baseline.education.period})
Summary: ${baseline.summary}
Skills:
${baseline.skills.map((s) => `- ${s.categoryName}: ${s.skillsText}`).join("\n")}
Projects:
${baseline.projects.map((p) => `### ${p.title} (${p.techStack})\n${p.bullets.join("\n")}`).join("\n\n")}

TASKS:
1. Write a punchy headline and authoritative 4-line Professional Summary tailored for ${jobTitle} at ${company} without fabricating fictitious domains.
2. Front-load relevant technical skills in the 6 categories.
3. Polish the 3 flagship projects into high-impact Google XYZ bullet points.
`;

  try {
    const aiRes = await queryMultiProviderLLM(systemPrompt, userPrompt, true);
    if (aiRes.text) {
      const parsed = JSON.parse(aiRes.text);

      const tailoredHeadline = parsed.targetHeadline || baseline.header.targetHeadline;
      const tailoredSummary = parsed.summary || baseline.summary;
      const tailoredSkills = Array.isArray(parsed.skills) && parsed.skills.length === 6 ? parsed.skills : baseline.skills;
      const tailoredProjects = Array.isArray(parsed.projects) && parsed.projects.length === 3 ? parsed.projects : baseline.projects;

      const fullText = (tailoredSummary + " " + JSON.stringify(tailoredSkills) + " " + JSON.stringify(tailoredProjects)).toLowerCase();
      const finalMatched = targetSkills.filter((s) => fullText.includes(s.toLowerCase()));
      const finalMissing = targetSkills.filter((s) => !finalMatched.includes(s)).slice(0, 5);

      const atsRatio = targetSkills.length > 0 ? (finalMatched.length / targetSkills.length) : 0.9;
      const atsScore = Math.min(99, Math.max(65, Math.round(atsRatio * 100)));

      return {
        header: {
          ...baseline.header,
          targetHeadline: tailoredHeadline,
        },
        summary: tailoredSummary,
        skills: tailoredSkills,
        projects: tailoredProjects,
        simulations: baseline.simulations,
        education: baseline.education,
        targetRole: jobTitle,
        targetCompany: company,
        atsScore,
        matchedKeywords: finalMatched,
        missingKeywords: finalMissing,
        tailoringNotes: `Tailored for ${jobTitle} at ${company} via Tier-1 Recruiter Engine (${aiRes.provider.toUpperCase()}).`,
      };
    }
  } catch (err) {
    console.warn("[Resume Optimizer Warning] AI generation failed, using dynamic recruiter fallback:", (err as Error).message);
  }

  // Dynamic Rule-Based Optimizer Fallback
  return generateDynamicOptimizedFallback(baseline, jobTitle, company, targetSkills, matchedKeywords, missingKeywords);
}

function generateDynamicOptimizedFallback(
  baseline: OptimizedResume,
  jobTitle: string,
  company: string,
  targetSkills: string[],
  matchedKeywords: string[],
  missingKeywords: string[]
): OptimizedResume {
  const topSkillStr = targetSkills.length > 0 ? targetSkills.slice(0, 4).join(", ") : "low-latency APIs, distributed microservices, and robust database design";

  const tailoredSummary = `Systems-focused Software Engineer with deep expertise in building high-throughput REST APIs, concurrent microservice architectures, and full-stack applications with emphasis on ${topSkillStr}. Demonstrated track record of architecting AST code-graph compilers, zero-knowledge cryptographic vaults, and AI-powered transaction ledgers. Proficient in database normalization (3NF), Redis caching, and automated testing (xUnit, Jest, PyTest) aligned with ${jobTitle} initiatives at ${company}.`;

  const tailoredSkills = baseline.skills.map((cat) => {
    const matching = targetSkills.filter((s) => cat.skillsText.toLowerCase().includes(s.toLowerCase()));
    if (matching.length > 0) {
      return {
        categoryName: cat.categoryName,
        skillsText: cat.skillsText,
      };
    }
    return cat;
  });

  const atsRatio = targetSkills.length > 0 ? (matchedKeywords.length / targetSkills.length) : 0.85;
  const atsScore = Math.min(98, Math.max(70, Math.round(atsRatio * 100)));

  return {
    ...baseline,
    header: {
      ...baseline.header,
      targetHeadline: `${jobTitle} | Backend, Systems & Full-Stack Specialist`,
    },
    summary: tailoredSummary,
    skills: tailoredSkills,
    targetRole: jobTitle,
    targetCompany: company,
    atsScore,
    matchedKeywords,
    missingKeywords,
    tailoringNotes: `Dynamic tailored resume calibrated for ${jobTitle} at ${company}.`,
  };
}

/**
 * Formats the optimized resume into clean Markdown matching the master resume files
 */
export function renderResumeMarkdown(resume: OptimizedResume): string {
  const { header, summary, skills, projects, simulations, education } = resume;

  return `# ${header.fullName}
**${header.targetHeadline}**
**${header.location} | ${header.phone} | ${header.email} | [${header.portfolioUrl.replace(/^https?:\/\//, "")}](${header.portfolioUrl}) | [${header.githubUrl.replace(/^https?:\/\//, "")}](${header.githubUrl}) | [${header.linkedinUrl.replace(/^https?:\/\//, "")}](${header.linkedinUrl})**

---

## PROFESSIONAL SUMMARY
${summary}

---

## TECHNICAL SKILLS
${skills.map((s) => `* **${s.categoryName}:** ${s.skillsText}`).join("\n")}

---

## TECHNICAL PROJECTS

${projects
  .map(
    (p) => `### **${p.title} (${p.techStack})** | [Live Demo](${p.liveDemoUrl}) | [GitHub](${p.githubUrl})
${p.bullets.map((b) => `* ${b}`).join("\n")}`
  )
  .join("\n\n")}

---

## TECHNICAL SIMULATIONS & VIRTUAL EXPERIENCES

${simulations
  .map(
    (s) => `### **${s.company} - ${s.roleTitle}** | ${s.period}
* **Problem & Scope:** ${s.problemScope}
* **Action Taken:** ${s.actionTaken}
* **Engineering Outcome:** ${s.engineeringOutcome}`
  )
  .join("\n\n")}

---

## EDUCATION
### **${education.degree}** - ${education.university} | ${education.period}
* **Relevant Coursework:** ${education.coursework}
`;
}

/**
 * Formats the resume into pure ATS-friendly ASCII plaintext
 */
export function renderResumePlaintext(resume: OptimizedResume): string {
  const { header, summary, skills, projects, simulations, education } = resume;

  return `${header.fullName.toUpperCase()}
${header.targetHeadline}
${header.location} | Phone: ${header.phone} | Email: ${header.email}
Portfolio: ${header.portfolioUrl} | GitHub: ${header.githubUrl} | LinkedIn: ${header.linkedinUrl}
================================================================================

PROFESSIONAL SUMMARY
--------------------------------------------------------------------------------
${summary}

TECHNICAL SKILLS
--------------------------------------------------------------------------------
${skills.map((s) => `${s.categoryName}: ${s.skillsText.replace(/•/g, ",")}`).join("\n")}

TECHNICAL PROJECTS
--------------------------------------------------------------------------------
${projects
  .map(
    (p) => `${p.title} (${p.techStack})
Demo: ${p.liveDemoUrl} | Code: ${p.githubUrl}
${p.bullets.map((b) => `- ${b}`).join("\n")}`
  )
  .join("\n\n")}

TECHNICAL SIMULATIONS & VIRTUAL EXPERIENCES
--------------------------------------------------------------------------------
${simulations
  .map(
    (s) => `${s.company} - ${s.roleTitle} (${s.period})
- Problem & Scope: ${s.problemScope}
- Action Taken: ${s.actionTaken}
- Engineering Outcome: ${s.engineeringOutcome}`
  )
  .join("\n\n")}

EDUCATION
--------------------------------------------------------------------------------
${education.degree} - ${education.university} (${education.period})
Coursework: ${education.coursework.replace(/•/g, ",")}
`;
}

/**
 * Injects a missing target keyword into the most appropriate technical skills category
 */
export function injectKeywordIntoResume(
  resume: OptimizedResume,
  keyword: string
): OptimizedResume {
  const kw = keyword.trim();
  if (!kw) return resume;

  const lower = kw.toLowerCase();
  let targetCategory = "Backend & Systems";

  if (
    lower.includes("sql") ||
    lower.includes("postgres") ||
    lower.includes("redis") ||
    lower.includes("mongo") ||
    lower.includes("sqlite") ||
    lower.includes("supabase") ||
    lower.includes("prisma") ||
    lower.includes("database") ||
    lower.includes("dynamo")
  ) {
    targetCategory = "Databases & Caching";
  } else if (
    ["rust", "python", "typescript", "javascript", "c#", "java", "c++", "c", "go", "golang", "ruby", "kotlin", "swift"].includes(lower)
  ) {
    targetCategory = "Languages";
  } else if (
    lower.includes("docker") ||
    lower.includes("k8s") ||
    lower.includes("kubernetes") ||
    lower.includes("ci/cd") ||
    lower.includes("git") ||
    lower.includes("gcp") ||
    lower.includes("aws") ||
    lower.includes("pytest") ||
    lower.includes("jest") ||
    lower.includes("xunit") ||
    lower.includes("junit") ||
    lower.includes("terraform") ||
    lower.includes("prometheus") ||
    lower.includes("grafana")
  ) {
    targetCategory = "Testing & DevOps";
  } else if (
    lower.includes("react") ||
    lower.includes("next") ||
    lower.includes("tailwind") ||
    lower.includes("redux") ||
    lower.includes("vue") ||
    lower.includes("frontend") ||
    lower.includes("css") ||
    lower.includes("html")
  ) {
    targetCategory = "Frontend UI & Full Stack";
  } else if (
    lower.includes("gemini") ||
    lower.includes("llm") ||
    lower.includes("ai") ||
    lower.includes("ast") ||
    lower.includes("crypto") ||
    lower.includes("jwt") ||
    lower.includes("security") ||
    lower.includes("encryption")
  ) {
    targetCategory = resume.skills.some((s) => s.categoryName.includes("AI Tooling"))
      ? "AI Tooling & Security"
      : "AI Gateway & Security";
  }

  const updatedSkills = resume.skills.map((cat) => {
    if (cat.categoryName.toLowerCase() === targetCategory.toLowerCase()) {
      if (!cat.skillsText.toLowerCase().includes(lower)) {
        return {
          ...cat,
          skillsText: `${cat.skillsText} • ${kw}`,
        };
      }
    }
    return cat;
  });

  const updatedMatched = Array.from(new Set([...resume.matchedKeywords, kw]));
  const updatedMissing = resume.missingKeywords.filter(
    (k) => k.toLowerCase() !== lower
  );

  const total = updatedMatched.length + updatedMissing.length;
  const atsRatio = total > 0 ? updatedMatched.length / total : 0.95;
  const atsScore = Math.min(99, Math.max(70, Math.round(atsRatio * 100)));

  return {
    ...resume,
    skills: updatedSkills,
    matchedKeywords: updatedMatched,
    missingKeywords: updatedMissing,
    atsScore,
  };
}
