import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { scrapeGreenhouseCompany, scrapeLeverCompany } from "../src/lib/scrapers/ats";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const db = new PrismaClient({ adapter });

const TARGET_GREENHOUSE_COMPANIES = ["vercel", "stripe", "gitlab", "discord", "cloudflare", "github"];
const TARGET_LEVER_COMPANIES = ["scaleai"];

async function main() {
  console.log("Seeding database with Roushan Kumar & Ayushi Raj profiles and ingesting 100% REAL live remote postings...");

  // Reset existing data cleanly
  await db.interviewPrep.deleteMany();
  await db.application.deleteMany();
  await db.matchScore.deleteMany();
  await db.jobPosting.deleteMany();
  await db.virtualExperience.deleteMany();
  await db.project.deleteMany();
  await db.profile.deleteMany();

  // 1. Roushan Kumar Profile
  const roushan = await db.profile.create({
    data: {
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
  const ayushi = await db.profile.create({
    data: {
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

  // 3. Ingest REAL Live Remote Postings from Greenhouse & Lever APIs
  const realJobs = [];
  for (const company of TARGET_GREENHOUSE_COMPANIES) {
    const scraped = await scrapeGreenhouseCompany(company);
    realJobs.push(...scraped);
  }
  for (const company of TARGET_LEVER_COMPANIES) {
    const scraped = await scrapeLeverCompany(company);
    realJobs.push(...scraped);
  }

  let insertedCount = 0;
  for (const j of realJobs) {
    await db.jobPosting.create({
      data: {
        urlHash: j.urlHash,
        url: j.url,
        company: j.company,
        title: j.title,
        category: j.category,
        jobType: j.jobType,
        experienceLevel: j.experienceLevel,
        platform: j.platform,
        location: j.location,
        isRemote: j.isRemote,
        applicantCount: j.applicantCount,
        postedAt: j.postedAt,
        rawDescription: j.rawDescription,
      },
    });
    insertedCount++;
  }

  console.log(`Successfully seeded profiles & ingested REAL live jobs:\n - Roushan (ID: ${roushan.id})\n - Ayushi (ID: ${ayushi.id})\n - Real Live Scraped Postings: ${insertedCount}`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
