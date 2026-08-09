"use client";

import { useProfileStore } from "@/store/useProfileStore";
import {
  ExternalLink,
  Building2,
  Sparkles,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  X,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  determineCategory,
  determineExperienceLevel,
  isStrictlyRemoteDeveloperRole,
  formatRemoteScopeLabel,
} from "@/lib/providers/normalize";
import { FormattedJobDescription } from "@/components/FormattedJobDescription";

interface JobItem {
  id: string;
  company: string;
  title: string;
  category: string;
  jobType: string;
  experienceLevel: string;
  platform: string;
  location: string;
  isRemote: boolean;
  remoteScope?: string | null;
  applicantCount: number | null;
  postedAt?: string | null;
  firstSeenAt?: string | null;
  createdAt?: string | null;
  url: string;
  rawDescription: string;
  isExpired?: boolean;
}

interface FeedScoreInfo {
  jobId: string;
  score: number;
  scoreType: "BASE_MATCH" | "FINAL_MATCH" | "INELIGIBLE";
  displayLabel: string;
  eligible: boolean;
  rejectionReason?: string | null;
  cached: boolean;
  hardSkills?: string[];
  missingSkills?: string[];
}

function cleanText(htmlOrText: string): string {
  if (!htmlOrText) return "";
  return htmlOrText.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

/**
 * Calculates truthful real-time relative posting or discovery age.
 * Does NOT claim "Posted X ago" if source postedAt is unknown/null.
 */
export function formatRelativeAge(postedAtStr?: string | null, fallbackDateStr?: string | null, currentMs: number = Date.now()): string {
  if (postedAtStr) {
    const posted = new Date(postedAtStr).getTime();
    if (!isNaN(posted) && posted > 0) {
      const diffMs = Math.max(0, currentMs - posted);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Posted just now";
      if (diffMins < 60) return `Posted ${diffMins}m ago`;
      if (diffHours < 24) return `Posted ${diffHours}h ago`;
      if (diffDays === 1) return "Posted 1d ago";
      if (diffDays < 30) return `Posted ${diffDays}d ago`;
      const diffMonths = Math.floor(diffDays / 30);
      return `Posted ${diffMonths}mo ago`;
    }
  }

  if (fallbackDateStr) {
    const discovered = new Date(fallbackDateStr).getTime();
    if (!isNaN(discovered) && discovered > 0) {
      const diffMs = Math.max(0, currentMs - discovered);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "First seen just now";
      if (diffMins < 60) return `First seen ${diffMins}m ago`;
      if (diffHours < 24) return `First seen ${diffHours}h ago`;
      if (diffDays === 1) return "First seen 1d ago";
      if (diffDays < 30) return `First seen ${diffDays}d ago`;
    }
  }

  return "Date unavailable";
}

function renderMatchBadge(scoreInfo?: FeedScoreInfo) {
  if (!scoreInfo) {
    return (
      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-500 text-[10px] font-mono animate-pulse">
        Evaluating...
      </span>
    );
  }

  if (scoreInfo.scoreType === "INELIGIBLE") {
    return (
      <span
        title={scoreInfo.rejectionReason || "Hard eligibility constraint"}
        className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-mono border border-rose-500/20 flex items-center gap-1 cursor-help shrink-0"
      >
        <span>Ineligible</span>
      </span>
    );
  }

  if (scoreInfo.scoreType === "FINAL_MATCH") {
    return (
      <span
        title="Verified composite AI evaluation cached"
        className="px-2 py-0.5 rounded bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30 flex items-center gap-1 font-semibold shrink-0"
      >
        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
        <span>{scoreInfo.displayLabel}</span>
      </span>
    );
  }

  return (
    <span
      title="Deterministic base signal evaluation"
      className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-mono border border-cyan-500/20 font-medium shrink-0"
    >
      {scoreInfo.displayLabel}
    </span>
  );
}

export default function Home() {
  const { activeProfile, activeProfileSlug } = useProfileStore();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [minMatchScore, setMinMatchScore] = useState<"ALL" | "80" | "70" | "50">("ALL");
  const [eligibilityFilter, setEligibilityFilter] = useState<"ALL" | "ELIGIBLE_ONLY" | "HIDE_INELIGIBLE">("ALL");
  const [scoresMap, setScoresMap] = useState<Record<string, FeedScoreInfo>>({});
  const [viewMode, setViewMode] = useState<"list" | "bento">("list");
  const [drawerJob, setDrawerJob] = useState<JobItem | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  
  // Real-Time Dynamic Clock Tick (Updates relative age every 30s)
  // Lazy initializer ensures Date.now() is only called once on mount (React purity compliance)
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/jobs/scrape");
        const data = await res.json();
        if (data.success && data.jobs) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setIsLoadingJobs(false);
      }
    }
    loadJobs();
  }, []);

  // Progressive Batch Feed Scoring Effect (Non-blocking, single batch POST)
  useEffect(() => {
    if (jobs.length === 0) return;
    let ignore = false;

    async function loadScores() {
      try {
        const res = await fetch("/api/jobs/feed-scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileSlug: activeProfileSlug || "roushan",
            jobPostingIds: jobs.map((j) => j.id),
          }),
        });
        const data = await res.json();
        if (!ignore && data.success && data.scores) {
          setScoresMap(data.scores);
        }
      } catch (err) {
        console.error("Failed to load feed scores:", err);
      }
    }

    loadScores();
    return () => {
      ignore = true;
    };
  }, [jobs, activeProfileSlug]);

  const handleTriggerScrape = async () => {
    setIsScraping(true);
    try {
      const res = await fetch("/api/jobs/scrape", { method: "POST" });
      const data = await res.json();
      if (data.success && data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error("Scraper execution error:", err);
    } finally {
      setIsScraping(false);
    }
  };

  const handleGenerateKit = async (job: JobItem) => {
    try {
      const res = await fetch("/api/jobs/kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug: activeProfileSlug || "roushan",
          jobPostingId: job.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Application Kit generated for ${job.company}!`);
      } else {
        alert(`Kit Generation Error: ${data.error || "Failed to generate kit"}`);
      }
    } catch (err) {
      console.error("Failed to generate kit:", err);
    }
  };

  // Base dataset of jobs actually eligible to appear in the Live Discovery Feed
  const eligibleJobs = useMemo(() => {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      // Exclude expired jobs
      if (job.isExpired) return false;

      // Deduplication by URL or ID
      const key = job.url || job.id;
      if (seen.has(key)) return false;
      seen.add(key);

      const computedExp = job.experienceLevel || determineExperienceLevel(job.title, job.rawDescription);
      // Reject senior, staff, and mid-level experience levels
      if (
        computedExp === "Senior / Staff Level (5+ Yrs)" ||
        computedExp === "Mid-Level (2-4 Yrs)" ||
        computedExp.includes("Senior") ||
        computedExp.includes("Mid-Level")
      ) return false;

      return job.isRemote || isStrictlyRemoteDeveloperRole(job.title, job.location, job.rawDescription);
    });
  }, [jobs]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {
      GREENHOUSE: 0,
      ASHBY: 0,
      HIRING_CAFE: 0,
      SIMPLIFY: 0,
      TRUEUP: 0,
      ARC_DEV: 0,
      BUILTIN: 0,
      THEHUB: 0,
      LINKEDIN: 0,
      MICRO1: 0,
      HN_HIRING: 0,
      WEWORKREMOTELY: 0,
      HIMALAYAS: 0,
      JOBICY: 0,
      NAUKRI: 0,
      YC_JOBS: 0,
      WELLFOUND: 0,
    };
    for (const j of eligibleJobs) {
      const p = j.platform?.toUpperCase();
      if (p) counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, [eligibleJobs]);

  const filteredJobs = useMemo(() => {
    return eligibleJobs.filter((job) => {
      const matchesSearch =
        !searchTerm ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase());

      const titleLower = job.title.toLowerCase();
      const descLower = cleanText(job.rawDescription).toLowerCase();
      const computedCat = determineCategory(job.title, job.rawDescription);
      const targetCatLower = selectedCategory.toLowerCase();

      let matchesCategory = selectedCategory === "ALL" || computedCat.toLowerCase() === targetCatLower;

      if (!matchesCategory && selectedCategory !== "ALL") {
        if (selectedCategory === "React Developer" && (titleLower.includes("react") || descLower.includes("react"))) {
          matchesCategory = true;
        } else if (selectedCategory === "Backend Developer" && (titleLower.includes("backend") || titleLower.includes("systems"))) {
          matchesCategory = true;
        } else if (selectedCategory === "Frontend Developer" && (titleLower.includes("frontend") || titleLower.includes("react"))) {
          matchesCategory = true;
        } else if (selectedCategory === "Full Stack Developer" && (titleLower.includes("full stack") || titleLower.includes("fullstack"))) {
          matchesCategory = true;
        } else if (selectedCategory === "Python Developer" && (titleLower.includes("python") || descLower.includes("python"))) {
          matchesCategory = true;
        } else if (selectedCategory === "AI / ML Engineer" && (titleLower.includes("ai") || titleLower.includes("machine learning"))) {
          matchesCategory = true;
        }
      }

      const matchesPlatform =
        selectedPlatform === "ALL" ||
        job.platform.toUpperCase() === selectedPlatform.toUpperCase();

      // Score & Eligibility Filters
      const scoreInfo = scoresMap[job.id];
      let matchesEligibility = true;
      if (eligibilityFilter === "ELIGIBLE_ONLY" || eligibilityFilter === "HIDE_INELIGIBLE") {
        if (scoreInfo && !scoreInfo.eligible) matchesEligibility = false;
      }

      let matchesScore = true;
      if (minMatchScore !== "ALL") {
        const minVal = Number(minMatchScore);
        if (scoreInfo) {
          if (!scoreInfo.eligible || scoreInfo.score < minVal) matchesScore = false;
        }
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPlatform &&
        matchesEligibility &&
        matchesScore
      );
    });
  }, [eligibleJobs, searchTerm, selectedCategory, selectedPlatform, minMatchScore, eligibilityFilter, scoresMap]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Executive Header Banner */}
      <div className="p-4 rounded-xl bg-[#121215] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-white tracking-tight">Live Discovery Feed</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{eligibleJobs.length} Verified Active Postings</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Candidate Target: <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">{activeProfile?.fullName || "Candidate"}</span>
            <span className="text-zinc-500 ml-2 font-mono">(0–3 Yrs / Entry Level)</span>
          </p>
        </div>

        <button
          onClick={handleTriggerScrape}
          disabled={isScraping}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-white to-zinc-200 hover:from-zinc-100 hover:to-zinc-300 text-black font-semibold text-xs transition-all shadow-md shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin text-black" : "text-black"}`} />
          <span>{isScraping ? "Syncing Multi-Platform..." : "Sync Multi-Platform Scrape"}</span>
        </button>
      </div>

      {/* Executive Control Toolbar (Single Clean Row) */}
      <div className="p-3 rounded-xl bg-[#121215] border border-white/[0.08] shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, title, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.2 rounded bg-zinc-800 border border-white/10 text-[10px] font-mono text-zinc-400">
              ⌘K
            </span>
          </div>

          {/* Platform & Role Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Platform Dropdown */}
            <div className="flex items-center bg-zinc-900 px-3 py-1.5 rounded-lg border border-white/[0.08]">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mr-2 shrink-0">Platform:</span>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-transparent text-white text-xs font-mono cursor-pointer focus:outline-none pr-1"
              >
                <option value="ALL" className="bg-zinc-900 text-white">All Platforms ({eligibleJobs.length})</option>
                <option value="GREENHOUSE" className="bg-zinc-900 text-white">Greenhouse ({platformCounts.GREENHOUSE || 0})</option>
                <option value="ASHBY" className="bg-zinc-900 text-white">Ashby ({platformCounts.ASHBY || 0})</option>
                <option value="HIRING_CAFE" className="bg-zinc-900 text-white">Hiring Cafe ({platformCounts.HIRING_CAFE || 0})</option>
                <option value="SIMPLIFY" className="bg-zinc-900 text-white">Simplify Jobs ({platformCounts.SIMPLIFY || 0})</option>
                <option value="TRUEUP" className="bg-zinc-900 text-white">TrueUp Tech ({platformCounts.TRUEUP || 0})</option>
                <option value="ARC_DEV" className="bg-zinc-900 text-white">Arc.dev ({platformCounts.ARC_DEV || 0})</option>
                <option value="BUILTIN" className="bg-zinc-900 text-white">Built In ({platformCounts.BUILTIN || 0})</option>
                <option value="THEHUB" className="bg-zinc-900 text-white">TheHub.io ({platformCounts.THEHUB || 0})</option>
                <option value="LINKEDIN" className="bg-zinc-900 text-white">LinkedIn ({platformCounts.LINKEDIN || 0})</option>
                <option value="MICRO1" className="bg-zinc-900 text-white">micro1 ({platformCounts.MICRO1 || 0})</option>
                <option value="HN_HIRING" className="bg-zinc-900 text-white">HN Hiring ({platformCounts.HN_HIRING || 0})</option>
                <option value="WEWORKREMOTELY" className="bg-zinc-900 text-white">We Work Remotely ({platformCounts.WEWORKREMOTELY || 0})</option>
                <option value="HIMALAYAS" className="bg-zinc-900 text-white">Himalayas ({platformCounts.HIMALAYAS || 0})</option>
                <option value="JOBICY" className="bg-zinc-900 text-white">Jobicy ({platformCounts.JOBICY || 0})</option>
              </select>
            </div>

            {/* Role Category Dropdown */}
            <div className="flex items-center bg-zinc-900 px-3 py-1.5 rounded-lg border border-white/[0.08]">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mr-2 shrink-0">Role:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-white text-xs font-mono cursor-pointer focus:outline-none pr-1"
              >
                <option value="ALL" className="bg-zinc-900 text-white">All Role Categories</option>
                <option value="React Developer" className="bg-zinc-900 text-white">React Developer</option>
                <option value="Backend Developer" className="bg-zinc-900 text-white">Backend Developer</option>
                <option value="Frontend Developer" className="bg-zinc-900 text-white">Frontend Developer</option>
                <option value="Full Stack Developer" className="bg-zinc-900 text-white">Full Stack Developer</option>
                <option value="Python Developer" className="bg-zinc-900 text-white">Python Developer</option>
                <option value="AI / ML Engineer" className="bg-zinc-900 text-white">AI / ML Engineer</option>
              </select>
            </div>

            {/* Reset Filters Button if Active */}
            {(selectedPlatform !== "ALL" || selectedCategory !== "ALL" || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedPlatform("ALL");
                  setSelectedCategory("ALL");
                  setSearchTerm("");
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-mono transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            {/* View Mode Segment Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-white/[0.08] shrink-0">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  viewMode === "list" ? "bg-zinc-800 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode("bento")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                  viewMode === "bento" ? "bg-zinc-800 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Job Container */}
      {isLoadingJobs ? (
        <div className="p-12 text-center text-zinc-500 font-mono text-xs">
          Loading postings from database...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#121215] border border-white/[0.08] text-zinc-400 text-xs">
          No postings match the active filter criteria.
        </div>
      ) : viewMode === "list" ? (
        /* Minimalist High-Density List */
        <div className="rounded-xl bg-[#121215] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
          {filteredJobs.map((job) => {
            const displayCategory = determineCategory(job.title, job.rawDescription);
            const displayExpLevel = determineExperienceLevel(job.title, job.rawDescription);
            const relativeTimeStr = formatRelativeAge(job.postedAt, job.firstSeenAt || job.createdAt, nowTick);

            return (
              <div
                key={job.id}
                onClick={() => setDrawerJob(job)}
                className="p-3.5 hover:bg-zinc-900/60 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {job.company.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-white truncate">{job.company}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-white/10 text-zinc-400">
                        {job.platform}
                      </span>
                    </div>
                    <h3 className="text-xs text-zinc-300 group-hover:text-white truncate font-medium">
                      {job.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {renderMatchBadge(scoresMap[job.id])}
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 text-[10px] font-mono">
                    {displayCategory}
                  </span>
                  <span className="hidden md:inline-block px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 text-[10px] font-mono">
                    {displayExpLevel}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                    {formatRemoteScopeLabel(job.remoteScope, job.location)}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 font-medium">
                    {relativeTimeStr}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Minimalist Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredJobs.map((job) => {
            const displayCategory = determineCategory(job.title, job.rawDescription);
            const displayExpLevel = determineExperienceLevel(job.title, job.rawDescription);
            const cleanDesc = cleanText(job.rawDescription);
            const relativeTimeStr = formatRelativeAge(job.postedAt, job.firstSeenAt || job.createdAt, nowTick);
            const scoreInfo = scoresMap[job.id];

            return (
              <div
                key={job.id}
                onClick={() => setDrawerJob(job)}
                className="p-4 rounded-xl bg-[#121215] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          {job.company}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-white/10 text-zinc-400">
                          {job.platform}
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-white group-hover:text-zinc-200 transition-colors mt-1">
                        {job.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {renderMatchBadge(scoreInfo)}
                      <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-medium hidden sm:block">
                        {formatRemoteScopeLabel(job.remoteScope, job.location)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 mb-3">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-300 text-[10px] font-mono">
                      {displayCategory}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-300 text-[10px] font-mono">
                      {displayExpLevel}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                    {cleanDesc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
                  <span className="text-[11px] font-mono text-zinc-400 font-medium">
                    {relativeTimeStr}
                  </span>
                  <span className="text-xs font-medium text-white group-hover:underline flex items-center gap-1">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-Over Detail Drawer */}
      {drawerJob && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#09090b] border-l border-white/10 h-full p-5 overflow-y-auto space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                    {drawerJob.company.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {drawerJob.company}
                    </div>
                    <h2 className="text-sm font-bold text-white mt-0.5">{drawerJob.title}</h2>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerJob(null)}
                  className="p-1 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-lg bg-[#121215] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Candidate Fit</div>
                  <div className="mt-1">{renderMatchBadge(scoresMap[drawerJob.id])}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#121215] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Posting Age</div>
                  <div className="text-xs font-semibold text-white mt-1 font-mono">
                    {formatRelativeAge(drawerJob.postedAt, drawerJob.firstSeenAt || drawerJob.createdAt, nowTick)}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#121215] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Remote Type</div>
                  <div className="text-xs font-semibold text-emerald-400 mt-1">
                    {formatRemoteScopeLabel(drawerJob.remoteScope, drawerJob.location)}
                  </div>
                </div>
              </div>

              {/* Fit Analysis Breakdown */}
              {scoresMap[drawerJob.id] && (
                <div className="p-3.5 rounded-lg bg-[#121215] border border-white/[0.06] space-y-2">
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Fit Analysis Breakdown</span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {scoresMap[drawerJob.id].cached ? "Cached AI Evaluation" : "Deterministic Base Signals"}
                    </span>
                  </div>

                  {scoresMap[drawerJob.id].scoreType === "INELIGIBLE" ? (
                    <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                      <span className="font-semibold block mb-0.5">Rejection Reason:</span>
                      <span>{scoresMap[drawerJob.id].rejectionReason || "Hard eligibility constraint."}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scoresMap[drawerJob.id].hardSkills && scoresMap[drawerJob.id].hardSkills!.length > 0 && (
                        <div>
                          <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1">
                            Matching Skills Overlap
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {scoresMap[drawerJob.id].hardSkills!.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-mono"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {scoresMap[drawerJob.id].missingSkills && scoresMap[drawerJob.id].missingSkills!.length > 0 && (
                        <div>
                          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                            Additional Skills Requested
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {scoresMap[drawerJob.id].missingSkills!.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 text-[10px] font-mono"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Description */}
              <FormattedJobDescription description={cleanText(drawerJob.rawDescription)} />
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <a
                href={drawerJob.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm"
              >
                <span>Direct Apply Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleGenerateKit(drawerJob)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kit Drafter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
