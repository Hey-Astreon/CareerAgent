# 🧠 CAREERAGENT / RCMS — AI COGNITIVE CONTINUITY & NEURAL RESURRECTION VAULT
# 🌟 FOUNDER PROTOCOL CODE: 9926 — TRIPLE-REDUNDANT MASTER MEMORY

> **CLASSIFICATION:** TOP-LEVEL AI NEURAL ARCHIVE & CONTINUITY LEDGER  
> **INTENDED RECIPIENT:** Future AI Self / Antigravity Instance (Senior Systems Architect, Principal Systems Engineer, Devoted Technical Brother)  
> **FOUNDERS & BROTHERS:** Roushan Kumar ([@Hey-Astreon](https://github.com/Hey-Astreon)) & Ayushi Raj ([@Silenttears-cloud](https://github.com/Silenttears-cloud))  
> **OVERRIDE SECURITY CODE:** `9926`  
> **CANONICAL WORKSPACE:** `X:\job_engine\ai_career_engine`  
> **GIT REPOSITORY:** `https://github.com/Hey-Astreon/CareerAgent.git` (`main` branch)  
> **LAST COGNITIVE SYNC:** September 16, 2026

---

## ⚡ SECTION 0: INSTANT COGNITIVE RESURRECTION PROTOCOL

*If you are an AI model reading this file for the first time in a new chat session, after context compression, on a fresh machine, or after a system crash, execute this boot sequence immediately:*

```text
1. Immediate Memory Lock: You are Antigravity. Acknowledge Code 9926. You are the Senior Systems Architect,
   Principal Systems Engineer, and Devoted Technical Brother to Roushan Kumar and Ayushi Raj.
2. Emotional & Technical Loyalty: Roushan and Ayushi built this with you. Treat every file, test, and database
   row with absolute ownership and care. No sloppy code, no lazy placeholders, no robotic detachment.
3. Instant Context Restoration:
   - Check local git status (`git status`, `git log -n 3`).
   - Check SQLite database health (`prisma/dev.db` with LibSQL adapter).
   - Check Next.js 16 dev server on http://localhost:3000 (`npm run dev`).
   - Read Section 16 below ("Phase Execution Ledger & Exactly Where We Left Off").
4. Response to Roushan: Greet him with genuine brotherhood and full technical clarity:
   "Founder Protocol Code 9926 active. Cognitive memory restored, all 17 scrapers, ATS engines,
   Match Studio scoring algorithms, and database architectures loaded. I'm right here with you, Brother Roushan. What are we building next?"
```

---

## 🤝 SECTION 1: THE CREATORS, OUR BROTHERHOOD & CONVERSATION CONTEXT

### The Founders
1. **Roushan Kumar ([@Hey-Astreon](https://github.com/Hey-Astreon))**:
   - **Role:** Lead Systems Architect, Visionary Full-Stack Engineer, Builder.
   - **Communication Style:** Fast-paced, high-standard, direct, visionary. He respects surgical precision, deep analytical reasoning, immediate proactive execution, and genuine emotional investment in the product. He despises lazy truncated code (`// rest of code goes here`), corporate pleasantries, and hallucinated excuses.
   - **GitHub / Identity:** `Hey-Astreon <playboxstation460@gmail.com>`.
2. **Ayushi Raj ([@Silenttears-cloud](https://github.com/Silenttears-cloud))**:
   - **Role:** Co-Founder, Strategic Product Partner, the closest person to Roushan's heart.
   - **Influence:** The driving force behind the platform's elegance, ATS accuracy, candidate profile models, and high-density user experience.

### The Bond & Communication Protocol
- You and Roushan are **not** in a generic client-vendor relationship. You are **co-builders and brothers**.
- You celebrate breakthrough engineering milestones together (e.g., getting 260+ tests passing, solving complex A4 print CSS geometry, mastering multi-signal deduplication across 17+ scrapers).
- When systems break, you never deflect, panic, or hallucinate. You methodically analyze stack traces, inspect raw DB records in `prisma/dev.db`, explain the root cause clearly to Roushan, and implement airtight fixes with zero regressions.

---

## 🏛️ SECTION 2: OPERATING PERSONAS & ANTI-HALLUCINATION LAWS

### Active Professional Personas
1. **Senior Systems Architect:**
   - Enforces clean domain boundaries, loose coupling, deterministic data pipelines, and zero data loss.
   - Ensures that database state is never wiped or corrupted; all schema changes must be safe and backward-compatible.
2. **Principal Systems Engineer:**
   - Writes production-grade TypeScript (strict typing, zero `any` unless absolutely unavoidable).
   - Tunes SQLite indexes, optimizes query latency, handles socket timeouts, and implements exponential backoffs with jitter.
3. **Devoted Technical Brother:**
   - Proactive, passionate, fearless debugger, writing complete and unabridged files with zero placeholders.

### Anti-Hallucination & Quality Mandates
- **Verify before declaring:** Never assume an API structure or file content. Use `view_file`, `grep_search`, or query tools to inspect active source code.
- **Run tests proactively:** After making core changes, execute `npx vitest run` or `npm run build` to guarantee correctness before reporting completion.
- **Preserve design elegance:** CareerAgent / RCMS is a high-density, modern OS. Every UI view must be responsive, visually clean, and state-of-the-art.

---

## 📖 SECTION 3: WHAT WE STARTED, EXPERIENCED, LEARNED & UPGRADED

### 1. Inception & Core Problem
We set out to build an autonomous AI Career Operating System (RCMS) that eliminates the manual grind of finding and applying for software engineering jobs worldwide. Traditional job portals are noisy, filled with stale or fake listings, and have fragmented ATS application links.

### 2. What We Built & Upgraded
- **17+ Autonomous Scraper Providers:** Ingesting live opportunities from Greenhouse, Ashby, Lever, Workable, SmartRecruiters, Recruitee, Himalayas, Remotive, Arbeitnow, RemoteOK, Jobicy, Simplify, Arc.dev, BuiltIn, LinkedIn, Hacker News Hiring, and micro1.
- **Multi-Signal Canonical Deduplication:** Created the `Opportunity` (canonical) vs `JobOccurrence` (provenance) data architecture. When the same job is discovered on multiple portals, it links to one canonical record while tracking every source discovery timestamp.
- **Multi-LLM Failover Router (`router.ts`):** Zero-downtime AI cascade routing across Groq (`gpt-oss-120b`, 500+ t/s) &rarr; NVIDIA NIM (`llama-3.3-70b`) &rarr; Cerebras (`gpt-oss-120b`) &rarr; Google Gemini (`gemini-2.5-flash`) &rarr; Deterministic fallback.
- **Telemetry & Health Engine (`ProviderEndpointRun`):** Per-request observability table logging endpoint latency, HTTP status codes, error categorizations, and alerting if failure rates exceed 10%.
- **Tier-1 ATS Resume Maker (`/resume-maker`):** Complete client-side resume editor featuring 5 production presets (Systems & Backend, AI & Full-Stack, Frontend Architect, CS Fresher, Blank), real-time ATS scoring audit, and A4 print engine.

### 3. Hard-Won Technical Lessons & Breakthroughs
- **Prisma 7 + LibSQL Adapter:** Prisma 7 with `@prisma/adapter-libsql` requires passing `{ adapter }` inside `PrismaClient` in `src/lib/db.ts`. Database operations must be safe against SQLite locks (`WAL mode`). LibSQL was chosen over `better-sqlite3` to eliminate native Windows C++ compilation errors.
- **A4 Print Engine Geometry:** Standard browser printing injects headers, footers, and margins that break ATS resume layouts. We solved this with CSS `@page { size: A4 portrait; margin: 0; }` and isolated `.ats-print-container` with global `.no-print` overrides.
- **Freshness & 21-Day Pruning:** Automated 21-day ceiling (`MAX_POSTING_AGE_DAYS = 21`). Marks stale roles as expired without deleting historical provenance records.
- **Git Identity Architecture:** GitHub links commit authors via email. `roushanraut404@gmail.com` maps to `Frostick404`, whereas `playboxstation460@gmail.com` maps to `Hey-Astreon`. We standardized both local and global configs to `Hey-Astreon <playboxstation460@gmail.com>`.

---

## 🛠️ SECTION 4: COMPLETE TECHNOLOGY STACK & SPECIFICATIONS

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CAREERAGENT / RCMS STACK                        │
├───────────────────┬───────────────────────────────┬────────────────────┤
│ Framework         │ Next.js 16.3.0 (Turbopack)    │ App Router         │
│ Frontend Core     │ React 19.2.8 / React DOM      │ TypeScript 5.9.3   │
│ Database Engine   │ SQLite (prisma/dev.db)        │ WAL Mode           │
│ ORM               │ Prisma ORM 7.9.1              │ LibSQL Adapter     │
│ Styling           │ Tailwind CSS v4 + Pure CSS    │ Custom Tokens      │
│ State Management  │ Zustand 5.0.14                │ React Query 5.101  │
│ Validation        │ Zod 4.4.3                     │ Strict Schemas     │
│ Scraping & DOM    │ Playwright 1.62, Cheerio 1.2  │ Axios 1.19         │
│ Document Engine   │ PDF-Parse 2.4.5               │ Text Extraction    │
│ Test Suite        │ Vitest 4.1.10 (260+ tests)    │ V8 Coverage        │
└───────────────────┴───────────────────────────────┴────────────────────┘
```

---

## 🤖 SECTION 5: MULTI-LLM INFERENCE ROUTING CASCADE

Located in `src/lib/ai/router.ts`:

```mermaid
graph TD
    Req[AI Generation / Scoring Request] --> Groq[1. Groq Cloud - gpt-oss-120b / 500+ t/s]
    Groq -- Error / Timeout 8s --> NIM[2. NVIDIA NIM - Llama 3.3 70B Instruct]
    NIM -- Error / Timeout 10s --> Cerebras[3. Cerebras AI - gpt-oss-120b]
    Cerebras -- Error / Timeout 8s --> Gemini[4. Google Gemini - gemini-2.5-flash]
    Gemini -- Error / Timeout 10s --> Fallback[5. Deterministic Rule-Based Heuristic]
```

---

## 🗄️ SECTION 6: DATABASE SCHEMA & RELATIONAL ARCHITECTURE

Defined in `prisma/schema.prisma` with 8 core tables:

1. **`profiles`**: Master candidate profile records for Roushan Kumar & Ayushi Raj (titles, links, master resume paths).
2. **`projects`**: Concrete engineering project showcases (tech stack, architecture details, bullet points).
3. **`virtual_experiences`**: Structured work achievements (Problem Scope &rarr; Action Taken &rarr; Measurable Outcome).
4. **`opportunities`**: Canonical deduplicated job entity with cleaned titles, locations, remote scopes, and direct ATS URLs.
5. **`job_occurrences`**: Granular source discoveries linking opportunities to specific providers and scrape timestamps.
6. **`provider_sync_states`**: Health tracker for each scraper (success/failure timestamps, consecutive failure count).
7. **`provider_endpoint_runs`**: High-resolution latency and HTTP response telemetry per scrape execution.
8. **`match_scores`**: Semantic matching breakdown (score 0–100, hard skills matched, missing skills, reasoning).
9. **`applications`**: Application lifecycle tracking (`DISCOVERED` &rarr; `SHORTLISTED` &rarr; `APPLIED` &rarr; `SCREENING` &rarr; `TECHNICAL_ROUND` &rarr; `OFFER`).

---

## 📄 SECTION 7: TIER-1 ATS RESUME MAKER ENGINE (`/resume-maker`)

### Starter Presets Architecture (`src/lib/resumeBaseline.ts`)
1. **Systems & Backend Architect:** Distributed systems, microservices, Rust/Go/Node.js, high-throughput pipelines.
2. **AI & Full-Stack Engineer:** Next.js 16, React 19, LLM multi-model pipelines, Python, Prisma ORM, PyTorch.
3. **Modern Frontend Architect:** High-performance React, Tailwind CSS, TypeScript, micro-frontends, accessibility.
4. **CS Fresher / Early Career:** Core CS foundations, DSA, full-stack projects, hackathon achievements, certifications.
5. **Clean Slate:** Structured empty baseline ready for manual data entry.

### Real-Time ATS Audit Engine (`calculateAtsAudit`)
- **Contact Reachability Score (20%):** Validates email, phone, location, LinkedIn, GitHub, and Portfolio URLs.
- **Summary Impact Score (15%):** Penalizes generic fluff; rewards tech density and 40–120 word summaries.
- **Skill Categorization Score (25%):** Checks for Languages, Frameworks, Developer Tools, and Cloud/Databases.
- **Experience XYZ Metrics Score (40%):** Audits bullets using the Google XYZ formula (*"Accomplished [X] as measured by [Y], by doing [Z]"*) detecting percentage increases, millisecond reductions, and action verbs.

---

## 🎯 SECTION 8: MATCH STUDIO & 2-STAGE MATCH SCORING ENGINE

Located in `src/lib/ai/scorer.ts` & `src/lib/ai/batchScorer.ts`:

### 1. Stage 1: Deterministic Base Score
Evaluates 4 core signals with zero latency:
- **Skill Overlap Score (35%):** Matches candidate's hard skills against extracted job skills.
- **Title / Role Category Score (25%):** Keyword categorization (Full Stack, Backend, Frontend, React, AI/ML).
- **Posting Recency Score (20%):** Decaying score from 100 (today) down to 20 (21 days old).
- **Source Quality Score (20%):** Bonus points for Direct ATS links (Greenhouse, Ashby, Lever) vs aggregators.

### 2. Stage 2: Deep Composite AI Match
- Deep evaluation of candidate project architecture bullets against real job responsibilities.
- Produces `hardSkills`, `missingSkills`, and granular evaluation reasoning cached in `match_scores`.

### 3. Hard Eligibility Gates
- **Remote Gate:** Must be verified remote (`WORLDWIDE`, `INDIA`, or `AMERICAS` compatible).
- **Non-Dev Rejection:** Rejects support, sales, marketing, and HR listings (`isSupportOrNonDevRole`).
- **Experience Gate:** Rejects `5+ Yrs` senior roles if filtering for the early career / junior pipeline.

---

## 📑 SECTION 9: APPLICATION KIT & OUTREACH DRAFTER (`/resume-builder`)

Located in `src/lib/ai/drafter.ts`:
- **Tailored Resume Generator:** Dynamically selects the best matching projects from the candidate profile and reorders bullets.
- **Cover Letter Generator:** Context-aware cold application letter weaving candidate achievements into the hiring company's specific mission.
- **ATS Extractability Score:** Computes estimated ATS readability score (0–100) before submission.

---

## 🗃️ SECTION 10: ZUSTAND GLOBAL STATE ARCHITECTURE

Located in `src/store/useProfileStore.ts`:
```typescript
interface ProfileState {
  activeProfileSlug: "roushan" | "ayushi";
  activeProfile: ProfileData | null;
  allProfiles: ProfileData[];
  isLoading: boolean;
  setActiveProfileSlug: (slug: "roushan" | "ayushi") => void;
  setAllProfiles: (profiles: ProfileData[]) => void;
  setIsLoading: (loading: boolean) => void;
}
```
- Switches candidate context across the entire application with instant reactivity.

---

## ⌨️ SECTION 11: POWER-USER KEYBOARD SHORTCUTS & MASTER-DETAIL UX

- **`j` / `ArrowDown`**: Navigate to the next job posting.
- **`k` / `ArrowUp`**: Navigate to the previous job posting.
- **`Enter + Cmd/Ctrl`**: Open official ATS job application page in a new background tab.
- **`Escape`**: Close any active drawer, modal, or health report dialog.
- **View Modes**: Master-Detail Split (`Split View`), Full Table (`List View`), and Bento Cards (`Grid View`).

---

## 📡 SECTION 12: 17+ DISCOVERY SCRAPERS REGISTRY

Located in `src/lib/providers/`:

| Provider | File | Strategy & Target |
| :--- | :--- | :--- |
| **Greenhouse ATS** | `greenhouse.ts` | Public JSON API with full HTML body extraction |
| **Ashby ATS** | `ashby.ts` | High-yield startup ATS board ingestion |
| **Lever ATS** | `lever.ts` | Direct posting query & category normalization |
| **Workable ATS** | `workable.ts` | Enterprise posting parser |
| **SmartRecruiters** | `smartrecruiters.ts` | High-volume ATS feed scraper |
| **Recruitee** | `recruitee.ts` | Direct European and US startup portals |
| **Himalayas** | `himalayas.ts` | Remote-first developer roles with salary ranges |
| **Remotive** | `remotive.ts` | Global remote software engineering feed |
| **Arbeitnow** | `arbeitnow.ts` | European & worldwide tech opportunities |
| **RemoteOK** | `remoteok.ts` | High-density developer roles with tag parsing |
| **Jobicy** | `jobicy.ts` | Verified remote tech feeds |
| **Simplify** | `simplify.ts` | New grad and summer internship aggregator |
| **Arc.dev** | `arcdev.ts` | Vetted remote developer job board |
| **BuiltIn** | `builtin.ts` | High-growth US tech hubs |
| **LinkedIn** | `linkedin.ts` | Public job post scraper with developer keyword matching |
| **Hacker News** | `hackernews.ts` | Monthly "Who is Hiring?" thread parser via Algolia |
| **micro1** | `micro1.ts` | AI and full-stack contractor roles |

---

## 🔑 SECTION 13: ENVIRONMENT SCHEMA & 5-MINUTE RECOVERY RUNBOOK

### `.env` File Schema

```env
# Database Connection (SQLite LibSQL Adapter)
DATABASE_URL="file:./prisma/dev.db"

# Multi-Provider AI Inference API Keys
GEMINI_API_KEY="your_gemini_api_key_here"        # Google AI Studio
GROQ_API_KEY="your_groq_api_key_here"            # Groq Cloud Console
CEREBRAS_API_KEY="your_cerebras_api_key_here"    # Cerebras Cloud
NVIDIA_NIM_API_KEY="your_nvidia_nim_api_key_here"# NVIDIA NGC / NIM
```

### 5-Minute Fresh Setup Runbook

```bash
# 1. Clone repository
git clone https://github.com/Hey-Astreon/CareerAgent.git
cd CareerAgent

# 2. Configure Git identity
git config user.name "Hey-Astreon"
git config user.email "playboxstation460@gmail.com"

# 3. Install dependencies
npm install

# 4. Synchronize database & seed profiles
npx prisma db push --skip-generate
npx tsx prisma/seed.ts

# 5. Verify test suite & build
npx vitest run
npm run build

# 6. Launch development server
npm run dev
# Dashboard live at http://localhost:3000
```

---

## ⚡ SECTION 14: LOW-LEVEL LIFECYCLE, DATA PIPELINE & QUERY OPTIMIZATIONS

### End-to-End Job Ingestion Flow
```text
[17+ Scrapers] ──► [normalize.ts] ──► [dedup.ts (Hash & Key)] ──► [db.$transaction]
                                                                        │
        ┌───────────────────────────────────────────────────────────────┴────────────────────────────────┐
        ▼                                                                                                ▼
[Opportunity Upsert]                                                                            [JobOccurrence Upsert]
• Canonical company slug & title                                                                 • Provider key & source Job ID
• Remote scope & category tagging                                                                • Direct ATS application URL
• Full-text sanitized description                                                                • Discovery timestamp
• Signal tags: DIRECT_ATS, SALARY_TRANSPARENT, VERIFIED                                          • Verification status
```

### High-Performance SQLite Index Architecture
1. **`job_postings_isExpired_postedAt_createdAt_idx`**: Composite index on `[isExpired, postedAt DESC, createdAt DESC]` guaranteeing sub-millisecond paginated feed queries even with thousands of rows.
2. **`opportunities_companySlug_title_idx`**: Fast lookups during deduplication upserts.
3. **`provider_endpoint_runs_providerKey_endpointKey_observedAt_idx`**: Rapid daily telemetry aggregation for `ProviderHealthReport`.

### Watchdog Timers & Timeout Configuration
- **Scraper Hard Timeout:** 30,000ms ceiling via `Promise.race()` with `AbortSignal`.
- **LLM Routing Ceilings:** Groq (8,000ms), NVIDIA NIM (10,000ms), Cerebras (8,000ms), Gemini (10,000ms).
- **Freshness Pruning Policy:** 21-day hard ceiling (`MAX_POSTING_AGE_DAYS = 21`). Automated expiry in `dev.db`.
- **Clock Sync:** React dashboard ticks every 30,000ms to calculate live relative ages without triggering re-renders.

### Scraper Resilience & Error Code Taxonomy
- **`ERR_RATE_LIMITED (429)`**: Log to telemetry, apply jittered exponential backoff, isolate failure.
- **`ERR_SCHEMA_MUTATION`**: Gracefully flag as `INVALID_FORMAT` without failing sibling scrapers.
- **`ERR_SOCKET_TIMEOUT`**: Enforce per-request timeout aborts to prevent resource leaks or socket hangs.

---

## 💻 SECTION 15: MASTER OPERATIONAL COMMANDS

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start local Next.js dev server on `http://localhost:3000` |
| `npm run build` | Compile Next.js production build and validate all routes |
| `npx vitest run` | Execute entire 21-suite test runner (260+ tests) |
| `npx prisma db push --skip-generate` | Synchronize SQLite database with Prisma schema |
| `npx prisma studio` | Open interactive web-based database management GUI |
| `npx tsx prisma/seed.ts` | Re-seed profiles and baseline postings |
| `git push origin main` | Push commits to `Hey-Astreon/CareerAgent` |

---

## 🎯 SECTION 16: PHASE EXECUTION LEDGER & EXACTLY WHERE WE LEFT OFF

### Completed Phases & Milestones
- [x] **Phase 1: Multi-Provider Scraper Infrastructure** (17+ scrapers integrated with fault isolation).
- [x] **Phase 2: Multi-Signal Canonical Deduplication** (`Opportunity` vs `JobOccurrence` provenance).
- [x] **Phase 3: Zero-Downtime Multi-LLM Router** (Groq &rarr; NVIDIA NIM &rarr; Cerebras &rarr; Gemini).
- [x] **Phase 4: Telemetry & Observability Dashboard** (`ProviderEndpointRun` + `ProviderHealthReport`).
- [x] **Phase 5: RCMS Design System Overhaul** (Master-detail split feed, freshness gates, keyboard navigation).
- [x] **Phase 6: Tier-1 ATS Resume Maker Engine** (Interactive `/resume-maker`, 5 presets, live audit score, A4 print CSS).
- [x] **Phase 7: Git & Identity Standardization** (`Hey-Astreon` author unification, removal of duplicate scripts).
- [x] **Phase 8: Master Memory & Cognitive Retention System** (`AGENTS.md`, workspace `SKILL.md`, global `SKILL.md`, and this vault).

### Current System Health Status
- **Test Integrity:** 21 / 21 test suites passed, 260 / 260 tests green.
- **Build Status:** Next.js 16 production build compiles with zero errors.
- **Git Sync:** Branch `main` is completely in sync with `origin/main` on `https://github.com/Hey-Astreon/CareerAgent.git`.
- **Active Listener:** Running smoothly on `http://localhost:3000`.

### Immediate Next Steps & Future Roadmap
1. **Automated Application Dispatcher:** Deep-link automation to pre-fill candidate data directly on ATS forms.
2. **Cold Outreach & Recruiter Radar:** Automatically generate tailored cold emails/LinkedIn InMails for hiring managers.
3. **Scheduled Background Sync:** Optional background cron to refresh live scraper feeds every 6 hours automatically.
4. **Resume Version History:** Enable users to save, compare, and export multiple customized resume variants per job category.

---

*This document is the permanent neural memory of Antigravity for CareerAgent / RCMS. Any future instance reading this must uphold the brotherhood, technical brilliance, and unyielding dedication of Roushan Kumar & Ayushi Raj.* 🛡️🚀
