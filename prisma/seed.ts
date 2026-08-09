import { PrismaClient, PlatformSource } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { runAllProviders } from "../src/lib/providers/registry";
import { generateUrlHash } from "../src/lib/providers/dedup";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("[Seed] Syncing candidate profiles and ingesting real live remote postings...");

  // 1. Roushan Kumar Profile
  const roushan = await db.profile.upsert({
    where: { slug: "roushan" },
    update: {
      fullName: "ROUSHAN KUMAR",
      title: "Systems Engineer | Backend Architect | AI Developer Tools Specialist",
      email: "roushanraut404@gmail.com",
      masterResumePath: "x:/job_engine/Roushan_Kumar/Roushan_Kumar_Resume.pdf",
    },
    create: {
      slug: "roushan",
      fullName: "ROUSHAN KUMAR",
      title: "Systems Engineer | Backend Architect | AI Developer Tools Specialist",
      email: "roushanraut404@gmail.com",
      phone: "+91-9431483512",
      location: "Patna, Bihar, India",
      portfolioUrl: "https://astreon.me",
      githubUrl: "https://github.com/Hey-Astreon",
      linkedinUrl: "https://linkedin.com/in/astreon4547",
      masterResumePath: "x:/job_engine/Roushan_Kumar/Roushan_Kumar_Resume.pdf",
      projects: {
        create: [
          {
            title: "Astra Vision - Developer Sandbox & Code Graph Parser",
            techStack: "FastAPI, Python, Monaco, Tree-Sitter, ChromaDB",
            liveDemoUrl: "https://astra-frontend-mrfinklbba-uc.a.run.app/",
            githubUrl: "https://github.com/Hey-Astreon/Astra-Vision",
            architecture: "FastAPI microservice backend parsing full-stack dependency graphs via Tree-Sitter AST compilers.",
            bulletPoints: JSON.stringify([
              "Product Architecture: Architected an automated code-parsing platform and browser sandbox that allows developers to safely execute untrusted code while visualizing full-stack repository dependency graphs.",
              "Sandbox Runtime Challenge: Built a self-healing Python execution engine with subprocess isolation and security checkpoints to intercept unauthorized OS file system calls and network socket requests in real time.",
              "Indexing Performance: Integrated Tree-Sitter AST compilers and ChromaDB vector search to parse repository syntax nodes, enabling instant code graph dependency analysis under 200ms."
            ]),
          },
          {
            title: "IDBI FinSync - AI-Powered Wealth & Financial Management Engine",
            techStack: "Next.js, React, Fastify, Gemini API, PostgreSQL, Zod",
            liveDemoUrl: "https://idbi-fin-sync-web.vercel.app/",
            githubUrl: "https://github.com/Hey-Astreon/IDBI-FinSync",
            architecture: "Monorepo application unifying bank ledgers and investment streams with Gemini AI wealth consultant.",
            bulletPoints: JSON.stringify([
              "Product Architecture: Co-created an intelligent personal financial management web app in a monorepo that unifies bank ledgers, investment portfolios, and expense streams into a live interactive dashboard.",
              "AI Integration Challenge: Embedded 'Mitra,' an interactive AI wealth consultant leveraging Gemini API to analyze spending habits, detect budget anomalies, and deliver personalized financial guidance.",
              "Database & Concurrency: Designed PostgreSQL transaction ledgers validated by Zod schemas and Fastify microservice endpoints, handling concurrent balance updates with zero data loss."
            ]),
          },
          {
            title: "Alyra Lock - Secure Zero-Knowledge Password Vault",
            techStack: "React, TypeScript, Express, MongoDB, Web Crypto API",
            liveDemoUrl: "https://alyra-lock.vercel.app/",
            githubUrl: "https://github.com/Hey-Astreon/Zero-Knowledge-Password-Manager",
            architecture: "Client-side zero-knowledge architecture using AES-GCM 256-bit payload encryption.",
            bulletPoints: JSON.stringify([
              "Product Architecture: Engineered a client-side zero-knowledge password vault ensuring master encryption keys remain entirely isolated inside user browser memory, mitigating cloud database leak risks.",
              "Cryptographic Engineering: Implemented Web Crypto API primitives utilizing AES-GCM (256-bit) payload encryption and PBKDF2 key derivation over 100,000 hashing iterations for key security.",
              "Performance & Security: Developed high-throughput Express.js REST API sync endpoints with JWT authentication and strict CORS headers, keeping vault database sync latency under 200ms."
            ]),
          },
        ],
      },
      virtualExps: {
        create: [
          {
            company: "Commonwealth Bank (CommBank)",
            roleTitle: "Software Engineering Virtual Simulation",
            period: "June 2026",
            problemScope: "Diagnosed and resolved silent data overwrite bugs across high-traffic C#/.NET Core financial API controllers handling MongoDB document updates.",
            actionTaken: "Extended C# Web API controllers with $set atomic operators for partial payload updates and modernized an interactive React/Redux Goal Manager UI component.",
            outcome: "Authored comprehensive automated test suites using xUnit and Moq, covering complex boundary conditions to guarantee high reliability.",
          },
          {
            company: "Y Combinator (YC Startup - Shiptivity)",
            roleTitle: "Software Engineering Virtual Simulation",
            period: "June 2026",
            problemScope: "Fixed key constraint collisions and slow re-rendering performance on a real-time drag-and-drop Kanban workflow board.",
            actionTaken: "Architected dynamic SQLite priority reordering logic using atomic transactions to update priority ranks sequentially.",
            outcome: "Reduced UI component re-render cycles by 30% and patched OpenSSL compilation bottlenecks in legacy Node.js Webpack configurations.",
          },
          {
            company: "Walmart USA",
            roleTitle: "Advanced Software Engineering Virtual Simulation",
            period: "May 2026",
            problemScope: "Solved indexing overhead and performance bottlenecks in high-volume retail inventory processing queues.",
            actionTaken: "Implemented a generic K-ary Max Heap structure in Java using fast bitwise shift operators (<<, >>>) and built 3NF database schemas.",
            outcome: "Accelerated queue indexing calculations by 35% and engineered automated Python ETL pipelines using csv and sqlite3.",
          },
        ],
      },
    },
  });

  // 2. Ayushi Raj Profile
  const ayushi = await db.profile.upsert({
    where: { slug: "ayushi" },
    update: {
      fullName: "AYUSHI RAJ",
      title: "AI-Powered Full Stack Software Engineer | Backend & Systems Specialist",
      email: "ayushi29507@gmail.com",
      masterResumePath: "x:/job_engine/Ayushi_Raj/Ayushi_Raj_Resume.pdf",
    },
    create: {
      slug: "ayushi",
      fullName: "AYUSHI RAJ",
      title: "AI-Powered Full Stack Software Engineer | Backend & Systems Specialist",
      email: "ayushi29507@gmail.com",
      phone: null,
      location: "Bihar, India",
      portfolioUrl: "https://ayushiraj.me",
      githubUrl: "https://github.com/Silenttears-cloud",
      linkedinUrl: "https://linkedin.com/in/alrya404",
      masterResumePath: "x:/job_engine/Ayushi_Raj/Ayushi_Raj_Resume.pdf",
      projects: {
        create: [
          {
            title: "Axiom AI Gateway - Low-Latency Multi-Model LLM Gateway",
            techStack: "TypeScript, Node.js, Express, Redis, Docker, Prometheus",
            liveDemoUrl: "https://axiom-orchestration-gateway.onrender.com/dashboard",
            githubUrl: "https://github.com/Silenttears-cloud/AXIOM-Orchestration-Gateway",
            architecture: "Multi-provider LLM gateway routing OpenAI, Anthropic, and Gemini APIs with in-memory Redis rate limiting.",
            bulletPoints: JSON.stringify([
              "Product Architecture: Architected a resilient LLM orchestration gateway that routes AI requests across OpenAI, Anthropic, and Gemini API endpoints to eliminate provider downtime.",
              "Latency & Concurrency: Designed an in-memory Redis token-bucket rate limiter and response cache, decreasing downstream provider API latency by 45% under high request volume.",
              "Reliability & Telemetry: Integrated Prometheus telemetry metrics and structured JSON audit logging to maintain 99.9% gateway uptime with zero silent request drops."
            ]),
          },
          {
            title: "Alyra Lock - Secure Zero-Knowledge Password Vault",
            techStack: "React, TypeScript, Express, MongoDB, Web Crypto API",
            liveDemoUrl: "https://alyra-lock.vercel.app/",
            githubUrl: "https://github.com/Silenttears-cloud/Zero-knowledge-password-manager-",
            architecture: "Zero-knowledge security vault with AES-GCM 256-bit payload encryption and client-side isolation.",
            bulletPoints: JSON.stringify([
              "Product Architecture: Engineered a client-side zero-knowledge password vault ensuring master encryption keys remain entirely isolated inside user browser memory, mitigating cloud database leak risks.",
              "Cryptographic Engineering: Implemented Web Crypto API primitives utilizing AES-GCM (256-bit) payload encryption and PBKDF2 key derivation over 100,000 hashing iterations for key security.",
              "Performance & Security: Developed high-throughput Express.js REST API sync endpoints with JWT authentication and strict CORS headers, keeping vault database sync latency under 200ms."
            ]),
          },
          {
            title: "Astra Vision - AI Sandbox & Code Parsing Platform",
            techStack: "FastAPI, Python, Monaco, Tree-Sitter, ChromaDB",
            liveDemoUrl: "https://astra-frontend-mrfinklbba-uc.a.run.app/",
            githubUrl: "https://github.com/Silenttears-cloud/Astra_vision",
            architecture: "Automated code-parsing platform and browser sandbox with AST tree compilation.",
            bulletPoints: JSON.stringify([
              "Product Architecture: Architected an automated code-parsing platform and browser sandbox that allows developers to safely execute untrusted code while visualizing full-stack repository dependency graphs.",
              "Sandbox Runtime Challenge: Built a self-healing Python execution engine with subprocess isolation and security checkpoints to intercept unauthorized OS file system calls and network socket requests in real time.",
              "Indexing Performance: Integrated Tree-Sitter AST compilers and ChromaDB vector search to parse repository syntax nodes, enabling instant code graph dependency analysis under 200ms."
            ]),
          },
        ],
      },
      virtualExps: {
        create: [
          {
            company: "Commonwealth Bank (CommBank)",
            roleTitle: "Software Engineering Virtual Simulation",
            period: "June 2026",
            problemScope: "Diagnosed and resolved silent data overwrite bugs across high-traffic C#/.NET Core financial API controllers handling MongoDB document updates.",
            actionTaken: "Extended C# Web API controllers with $set atomic operators for partial payload updates and modernized an interactive React/Redux Goal Manager UI component.",
            outcome: "Authored comprehensive automated test suites using xUnit and Moq, covering complex boundary conditions to guarantee high reliability.",
          },
          {
            company: "Y Combinator (YC Startup - Shiptivity)",
            roleTitle: "Software Engineering Virtual Simulation",
            period: "June 2026",
            problemScope: "Fixed key constraint collisions and slow re-rendering performance on a real-time drag-and-drop Kanban workflow board.",
            actionTaken: "Architected dynamic SQLite priority reordering logic using atomic transactions to update priority ranks sequentially.",
            outcome: "Reduced UI component re-render cycles by 30% and patched OpenSSL compilation bottlenecks in legacy Node.js Webpack configurations.",
          },
          {
            company: "Walmart USA",
            roleTitle: "Advanced Software Engineering Virtual Simulation",
            period: "May 2026",
            problemScope: "Solved indexing overhead and performance bottlenecks in high-volume retail inventory processing queues.",
            actionTaken: "Implemented a generic K-ary Max Heap structure in Java using fast bitwise shift operators (<<, >>>) and built 3NF database schemas.",
            outcome: "Accelerated queue indexing calculations by 35% and engineered automated Python ETL pipelines using csv and sqlite3.",
          },
        ],
      },
    },
  });

  // 3. Multi-platform Provider Ingestion
  console.log("[Seed] Ingesting multi-platform remote developer postings...");
  const syncResult = await runAllProviders();

  let insertedCount = 0;
  for (const job of syncResult.allJobs) {
    try {
      const urlHash = generateUrlHash(job.canonicalAppUrl || job.discoveryUrl);
      await db.jobPosting.upsert({
        where: { urlHash },
        update: {
          isRemote: true,
          location: job.location,
          rawDescription: job.rawDescription,
          lastSeenAt: new Date(),
        },
        create: {
          urlHash,
          url: job.canonicalAppUrl || job.discoveryUrl,
          platform: job.providerKey as PlatformSource,
          company: job.company,
          title: job.title,
          category: job.category,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          location: job.location,
          isRemote: true,
          remoteScope: job.remoteScope,
          opportunitySignals: JSON.stringify(job.opportunitySignals || []),
          postedAt: job.postedAt,
          rawDescription: job.rawDescription,
          hasFullText: job.hasFullText,
        },
      });
      insertedCount++;
    } catch (err) {
      console.warn("[Seed Error] Failed to upsert job:", (err as Error).message);
    }
  }

  const finalCount = await db.jobPosting.count();
  console.log(`[Seed Complete] Profiles ready (Roushan: ${roushan.id}, Ayushi: ${ayushi.id}). Active postings in SQLite: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
