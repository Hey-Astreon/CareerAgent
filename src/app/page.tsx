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
  Columns2,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe2,
  Briefcase,
  Target,
  FileText,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
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

function renderMatchBadge(scoreInfo?: FeedScoreInfo, size: "sm" | "md" = "sm") {
  if (!scoreInfo) {
    return (
      <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-zinc-500 text-xs font-mono animate-pulse inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-ping" />
        Evaluating...
      </span>
    );
  }

  if (scoreInfo.scoreType === "INELIGIBLE") {
    return (
      <span
        title={scoreInfo.rejectionReason || "Hard eligibility constraint"}
        className={`rounded-lg bg-rose-500/10 text-rose-400 font-mono border border-rose-500/20 flex items-center gap-1.5 cursor-help shrink-0 font-medium ${
          size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-0.5 text-[11px]"
        }`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>Ineligible</span>
      </span>
    );
  }

  if (scoreInfo.scoreType === "FINAL_MATCH") {
    return (
      <span
        title="Verified composite AI evaluation cached"
        className={`rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 font-mono border border-purple-500/30 flex items-center gap-1.5 font-semibold shrink-0 shadow-sm ${
          size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-0.5 text-[11px]"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span>{scoreInfo.displayLabel}</span>
      </span>
    );
  }

  return (
    <span
      title="Deterministic base signal evaluation"
      className={`rounded-lg bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/25 font-semibold shrink-0 ${
        size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-0.5 text-[11px]"
      }`}
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
  const [maxAgeDays, setMaxAgeDays] = useState<"ALL" | "1" | "3" | "7" | "14">("ALL");
  const [onlyInternships, setOnlyInternships] = useState(false);
  const [onlyWorldwide, setOnlyWorldwide] = useState(false);
  const [scoresMap, setScoresMap] = useState<Record<string, FeedScoreInfo>>({});
  
  // View Modes: 'split' (Master-Detail), 'list' (Full Table), 'grid' (Bento Cards)
  const [viewMode, setViewMode] = useState<"split" | "list" | "grid">("split");
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<"smart" | "fit" | "kit" | "raw">("smart");
  
  const [isScraping, setIsScraping] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Real-Time Dynamic Clock Tick (Updates relative age every 30s)
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
          if (data.jobs.length > 0 && !selectedJob) {
            setSelectedJob(data.jobs[0]);
          }
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
        if (data.jobs.length > 0) {
          setSelectedJob(data.jobs[0]);
        }
      }
    } catch (err) {
      console.error("Scraper execution error:", err);
    } finally {
      setIsScraping(false);
    }
  };

  // Base dataset of jobs actually eligible to appear in the Live Discovery Feed
  const eligibleJobs = useMemo(() => {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      if (job.isExpired) return false;

      const key = job.url || job.id;
      if (seen.has(key)) return false;
      seen.add(key);

      const computedExp = job.experienceLevel || determineExperienceLevel(job.title, job.rawDescription);
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
      LEVER: 0,
      WORKABLE: 0,
      SMARTRECRUITERS: 0,
      RECRUITEE: 0,
      HIMALAYAS: 0,
      REMOTIVE: 0,
      ARBEITNOW: 0,
      REMOTEOK: 0,
      JOBICY: 0,
      SIMPLIFY: 0,
      ARC_DEV: 0,
      BUILTIN: 0,
      HN_HIRING: 0,
      LINKEDIN: 0,
      MICRO1: 0,
      WEWORKREMOTELY: 0,
      HIRING_CAFE: 0,
      TRUEUP: 0,
      THEHUB: 0,
      YC_JOBS: 0,
      WELLFOUND: 0,
      NAUKRI: 0,
    };
    for (const j of eligibleJobs) {
      const p = j.platform?.toUpperCase();
      if (p) counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, [eligibleJobs]);

  const filteredJobs = useMemo(() => {
    const result = eligibleJobs.filter((job) => {
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

      // Internship / Early Career Gate
      if (onlyInternships) {
        const type = (job.jobType || determineJobType(job.title, job.rawDescription)).toLowerCase();
        const exp = (job.experienceLevel || determineExperienceLevel(job.title, job.rawDescription)).toLowerCase();
        const isInternOrFresher =
          type.includes("intern") ||
          exp.includes("fresher") ||
          exp.includes("0-1") ||
          titleLower.includes("intern") ||
          titleLower.includes("trainee") ||
          titleLower.includes("co-op") ||
          titleLower.includes("apprentice");
        if (!isInternOrFresher) return false;
      }

      // Worldwide Remote Gate
      if (onlyWorldwide) {
        const locLower = (job.location || "").toLowerCase();
        const regLower = (job.remoteRegion || "").toLowerCase();
        const isWw =
          locLower.includes("worldwide") ||
          locLower.includes("anywhere") ||
          locLower.includes("global") ||
          regLower.includes("worldwide") ||
          job.remoteScope === "WORLDWIDE";
        if (!isWw) return false;
      }

      // Strict Freshness Gate (1d, 3d, 7d, 14d)
      if (maxAgeDays !== "ALL") {
        const maxDaysNum = Number(maxAgeDays);
        if (job.postedAt) {
          const postedTime = new Date(job.postedAt).getTime();
          const ageDays = (nowTick - postedTime) / (1000 * 60 * 60 * 24);
          if (ageDays > maxDaysNum) return false;
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

    // Sort by freshness priority: Postings with known recent postedAt dates appear first
    return result.sort((a, b) => {
      const timeA = a.postedAt ? new Date(a.postedAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.postedAt ? new Date(b.postedAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [
    eligibleJobs,
    searchTerm,
    selectedCategory,
    selectedPlatform,
    minMatchScore,
    eligibilityFilter,
    onlyInternships,
    onlyWorldwide,
    maxAgeDays,
    nowTick,
    scoresMap,
  ]);

  // Keep active job valid when filters change
  useEffect(() => {
    if (filteredJobs.length > 0) {
      if (!selectedJob || !filteredJobs.some((j) => j.id === selectedJob.id)) {
        setSelectedJob(filteredJobs[0]);
      }
    }
  }, [filteredJobs, selectedJob]);

  // Keyboard navigation between jobs (ArrowUp, ArrowDown, Escape, Enter)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Escape") {
        if (isFocusModalOpen) {
          setIsFocusModalOpen(false);
        }
        return;
      }

      if (filteredJobs.length === 0) return;

      const currentIndex = selectedJob ? filteredJobs.findIndex((j) => j.id === selectedJob.id) : -1;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIndex = currentIndex < filteredJobs.length - 1 ? currentIndex + 1 : 0;
        setSelectedJob(filteredJobs[nextIndex]);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredJobs.length - 1;
        setSelectedJob(filteredJobs[prevIndex]);
      } else if (e.key === "Enter" && e.metaKey && selectedJob) {
        window.open(selectedJob.url, "_blank");
      }
    },
    [filteredJobs, selectedJob, isFocusModalOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleCopyJobUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const selectedScoreInfo = selectedJob ? scoresMap[selectedJob.id] : undefined;

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-8">
      {/* Executive Command Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1118] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Live Remote Career Engine</span>
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>{eligibleJobs.length} Verified Postings</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>Target Profile:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold font-mono">
              {activeProfile?.fullName || "Candidate"}
            </span>
            <span className="text-zinc-500 font-mono">• BCA 2nd Year Pre-Graduation Pipeline</span>
            <span className="text-zinc-500 font-mono">• Strictly Remote &lt; 7 Days</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleTriggerScrape}
            disabled={isScraping}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
            <span>{isScraping ? "Ingesting Live Postings..." : "Sync Multi-Platform Feed"}</span>
          </button>
        </div>
      </div>

      {/* Filter & View Toolbar */}
      <div className="p-3.5 rounded-2xl bg-[#0f1118] border border-white/[0.08] shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, title, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Platform Filter */}
            <div className="flex items-center bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-white/[0.08]">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mr-2 shrink-0">Source:</span>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-transparent text-white text-xs font-mono cursor-pointer focus:outline-none pr-1"
              >
                <option value="ALL" className="bg-zinc-900 text-white">All Sources ({eligibleJobs.length})</option>
                <option value="GREENHOUSE" className="bg-zinc-900 text-white">Greenhouse ({platformCounts.GREENHOUSE || 0})</option>
                <option value="ASHBY" className="bg-zinc-900 text-white">Ashby ({platformCounts.ASHBY || 0})</option>
                <option value="LEVER" className="bg-zinc-900 text-white">Lever ({platformCounts.LEVER || 0})</option>
                <option value="WORKABLE" className="bg-zinc-900 text-white">Workable ({platformCounts.WORKABLE || 0})</option>
                <option value="SMARTRECRUITERS" className="bg-zinc-900 text-white">SmartRecruiters ({platformCounts.SMARTRECRUITERS || 0})</option>
                <option value="RECRUITEE" className="bg-zinc-900 text-white">Recruitee ({platformCounts.RECRUITEE || 0})</option>
                <option value="HIMALAYAS" className="bg-zinc-900 text-white">Himalayas ({platformCounts.HIMALAYAS || 0})</option>
                <option value="REMOTIVE" className="bg-zinc-900 text-white">Remotive ({platformCounts.REMOTIVE || 0})</option>
                <option value="ARBEITNOW" className="bg-zinc-900 text-white">Arbeitnow ({platformCounts.ARBEITNOW || 0})</option>
                <option value="REMOTEOK" className="bg-zinc-900 text-white">RemoteOK ({platformCounts.REMOTEOK || 0})</option>
                <option value="JOBICY" className="bg-zinc-900 text-white">Jobicy ({platformCounts.JOBICY || 0})</option>
                <option value="SIMPLIFY" className="bg-zinc-900 text-white">Simplify ({platformCounts.SIMPLIFY || 0})</option>
                <option value="ARC_DEV" className="bg-zinc-900 text-white">Arc.dev ({platformCounts.ARC_DEV || 0})</option>
                <option value="BUILTIN" className="bg-zinc-900 text-white">Built In ({platformCounts.BUILTIN || 0})</option>
                <option value="LINKEDIN" className="bg-zinc-900 text-white">LinkedIn ({platformCounts.LINKEDIN || 0})</option>
                <option value="HN_HIRING" className="bg-zinc-900 text-white">HN Hiring ({platformCounts.HN_HIRING || 0})</option>
                <option value="WEWORKREMOTELY" className="bg-zinc-900 text-white">WeWorkRemotely ({platformCounts.WEWORKREMOTELY || 0})</option>
                <option value="MICRO1" className="bg-zinc-900 text-white">micro1 ({platformCounts.MICRO1 || 0})</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-white/[0.08]">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mr-2 shrink-0">Role:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-white text-xs font-mono cursor-pointer focus:outline-none pr-1"
              >
                <option value="ALL" className="bg-zinc-900 text-white">All Roles</option>
                <option value="React Developer" className="bg-zinc-900 text-white">React Developer</option>
                <option value="Backend Developer" className="bg-zinc-900 text-white">Backend Developer</option>
                <option value="Full Stack Developer" className="bg-zinc-900 text-white">Full Stack Developer</option>
                <option value="Frontend Developer" className="bg-zinc-900 text-white">Frontend Developer</option>
                <option value="Python Developer" className="bg-zinc-900 text-white">Python Developer</option>
                <option value="AI / ML Engineer" className="bg-zinc-900 text-white">AI / ML Engineer</option>
              </select>
            </div>

            {/* Freshness Filter */}
            <div className="flex items-center bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-white/[0.08]">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mr-2 shrink-0">Freshness:</span>
              <select
                value={maxAgeDays}
                onChange={(e) => setMaxAgeDays(e.target.value as any)}
                className="bg-transparent text-white text-xs font-mono cursor-pointer focus:outline-none pr-1"
              >
                <option value="ALL" className="bg-zinc-900 text-white">All Time</option>
                <option value="1" className="bg-zinc-900 text-white">⚡ Past 24 Hours</option>
                <option value="3" className="bg-zinc-900 text-white">🔥 Past 3 Days</option>
                <option value="7" className="bg-zinc-900 text-white">✨ Past 7 Days (&lt; 1 Week)</option>
                <option value="14" className="bg-zinc-900 text-white">📅 Past 14 Days</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {(selectedPlatform !== "ALL" || selectedCategory !== "ALL" || maxAgeDays !== "ALL" || onlyInternships || onlyWorldwide || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedPlatform("ALL");
                  setSelectedCategory("ALL");
                  setMaxAgeDays("ALL");
                  setOnlyInternships(false);
                  setOnlyWorldwide(false);
                  setSearchTerm("");
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-mono transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Layout View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900/90 border border-white/[0.08] shrink-0">
              <button
                onClick={() => setViewMode("split")}
                title="Split-Pane Master-Detail View"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "split"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split View</span>
              </button>

              <button
                onClick={() => setViewMode("list")}
                title="Full-Width Table View"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-zinc-800 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>

              <button
                onClick={() => setViewMode("grid")}
                title="Bento Grid View"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-zinc-800 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Pills Row */}
        <div className="mt-3 pt-3 border-t border-white/[0.05] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Quick Filters:</span>
          
          <button
            onClick={() => setOnlyInternships(!onlyInternships)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
              onlyInternships
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm font-semibold"
                : "bg-zinc-900/60 text-zinc-400 border-white/[0.06] hover:text-white hover:border-white/[0.15]"
            }`}
          >
            <span>🎓 Internships & Freshers Only</span>
          </button>

          <button
            onClick={() => setMaxAgeDays(maxAgeDays === "7" ? "ALL" : "7")}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
              maxAgeDays === "7"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm font-semibold"
                : "bg-zinc-900/60 text-zinc-400 border-white/[0.06] hover:text-white hover:border-white/[0.15]"
            }`}
          >
            <span>⚡ Posted &lt; 7 Days Only</span>
          </button>

          <button
            onClick={() => setMaxAgeDays(maxAgeDays === "1" ? "ALL" : "1")}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
              maxAgeDays === "1"
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm font-semibold"
                : "bg-zinc-900/60 text-zinc-400 border-white/[0.06] hover:text-white hover:border-white/[0.15]"
            }`}
          >
            <span>🚀 Past 24 Hours</span>
          </button>

          <button
            onClick={() => setOnlyWorldwide(!onlyWorldwide)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
              onlyWorldwide
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm font-semibold"
                : "bg-zinc-900/60 text-zinc-400 border-white/[0.06] hover:text-white hover:border-white/[0.15]"
            }`}
          >
            <span>🌍 Worldwide Remote Only</span>
          </button>

          <span className="ml-auto text-[11px] font-mono text-zinc-500">
            Showing <strong className="text-white">{filteredJobs.length}</strong> of {eligibleJobs.length} remote roles
          </span>
        </div>
      </div>

      {/* Main Workspace Area */}
      {isLoadingJobs ? (
        <div className="p-16 text-center rounded-2xl bg-[#0f1118] border border-white/[0.08] text-zinc-400 text-sm font-mono flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Ingesting and loading verified remote postings from SQLite database...</span>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0f1118] border border-white/[0.08] text-zinc-400 text-sm font-sans space-y-2">
          <p className="text-white font-semibold">No postings match your active filter criteria.</p>
          <p className="text-zinc-500 text-xs font-mono">Try clearing your search query or selecting &quot;All Sources&quot;.</p>
        </div>
      ) : viewMode === "split" ? (
        /* ══════════════════════════════════════════════════════════════════════
           MASTER-DETAIL SPLIT WORKSPACE
           ══════════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Master Feed Column (5 cols / ~42%) */}
          <div className="lg:col-span-5 rounded-2xl bg-[#0f1118] border border-white/[0.08] overflow-hidden flex flex-col shadow-xl max-h-[calc(100vh-14rem)] min-h-[600px]">
            {/* Feed Header */}
            <div className="p-3.5 px-4 bg-[#141622] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Job Queue ({filteredJobs.length})
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-300">↑</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-300">↓</span>
                <span>to navigate</span>
              </div>
            </div>

            {/* Scrollable Job List */}
            <div className="divide-y divide-white/[0.06] overflow-y-auto custom-scrollbar flex-1">
              {filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                const displayCategory = determineCategory(job.title, job.rawDescription);
                const relativeTimeStr = formatRelativeAge(job.postedAt, job.firstSeenAt || job.createdAt, nowTick);
                const scoreInfo = scoresMap[job.id];

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 transition-all cursor-pointer group relative ${
                      isSelected
                        ? "bg-indigo-950/40 border-l-4 border-l-indigo-500"
                        : "hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                            : "bg-zinc-900 border border-white/10 text-zinc-300 group-hover:text-white"
                        }`}>
                          {job.company.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-zinc-200"}`}>
                              {job.company}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 shrink-0">
                              {job.platform}
                            </span>
                          </div>
                          <h3 className={`text-sm font-semibold truncate transition-colors ${
                            isSelected ? "text-indigo-200" : "text-zinc-300 group-hover:text-white"
                          }`}>
                            {job.title}
                          </h3>
                        </div>
                      </div>

                      {renderMatchBadge(scoreInfo)}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-white/[0.04] text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 border border-white/10 text-zinc-400 text-[11px] font-mono">
                          {displayCategory}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20">
                          {formatRemoteScopeLabel(job.remoteScope, job.location)}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-zinc-400 font-medium shrink-0">
                        {relativeTimeStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Detail Studio Column (7 cols / ~58%) */}
          <div className="lg:col-span-7 rounded-2xl bg-[#0f1118] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col min-h-[600px] max-h-[calc(100vh-14rem)]">
            {selectedJob ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Studio Header Bar */}
                <div className="p-5 bg-[#141622] border-b border-white/[0.08] space-y-4 shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/15 flex items-center justify-center font-extrabold text-base text-white shadow-lg shrink-0">
                        {selectedJob.company.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-zinc-400" />
                            {selectedJob.company}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-indigo-300 font-semibold">
                            {selectedJob.platform} Source
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                          {selectedJob.title}
                        </h2>
                      </div>
                    </div>

                    {/* Window Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setIsFocusModalOpen(true)}
                        title="Expand to Full Reader View"
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyJobUrl(selectedJob.url)}
                        title="Copy Direct Application Link"
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 4-Metric Studio Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#0b0c12] border border-white/[0.06] space-y-1">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Target className="w-3 h-3 text-indigo-400" />
                        <span>Candidate Fit</span>
                      </div>
                      <div>{renderMatchBadge(selectedScoreInfo, "md")}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0b0c12] border border-white/[0.06] space-y-1">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Posting Age</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white font-mono">
                        {formatRelativeAge(selectedJob.postedAt, selectedJob.firstSeenAt || selectedJob.createdAt, nowTick)}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0b0c12] border border-white/[0.06] space-y-1">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Globe2 className="w-3 h-3 text-emerald-400" />
                        <span>Remote Scope</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 truncate">
                        {formatRemoteScopeLabel(selectedJob.remoteScope, selectedJob.location)}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0b0c12] border border-white/[0.06] space-y-1">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-sky-400" />
                        <span>Experience</span>
                      </div>
                      <div className="text-xs font-bold text-zinc-200 truncate">
                        {determineExperienceLevel(selectedJob.title, selectedJob.rawDescription)}
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={selectedJob.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-white to-zinc-200 hover:from-zinc-100 hover:to-zinc-300 text-black font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-white/10"
                    >
                      <span>Direct Apply on {selectedJob.platform}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </a>

                    <Link
                      href="/drafter"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all shadow-md"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Kit Drafter</span>
                    </Link>

                    <Link
                      href="/match"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs sm:text-sm border border-white/15 transition-all shadow-md"
                    >
                      <Target className="w-4 h-4 text-indigo-400" />
                      <span>Match Studio</span>
                    </Link>
                  </div>
                </div>

                {/* Studio Tab Navigation */}
                <div className="flex items-center gap-2 px-5 py-2.5 bg-[#0f1118] border-b border-white/[0.08] shrink-0 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setActiveStudioTab("smart")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      activeStudioTab === "smart"
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    Structured Breakdown
                  </button>

                  <button
                    onClick={() => setActiveStudioTab("fit")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      activeStudioTab === "fit"
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>Fit &amp; Skills Analysis</span>
                    {selectedScoreInfo && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveStudioTab("raw")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      activeStudioTab === "raw"
                        ? "bg-zinc-800 text-white shadow-md border border-white/10"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    Original Text
                  </button>
                </div>

                {/* Studio Tab Content Body (Independent Scroll) */}
                <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                  {activeStudioTab === "smart" && (
                    <FormattedJobDescription description={cleanText(selectedJob.rawDescription)} />
                  )}

                  {activeStudioTab === "fit" && (
                    <div className="space-y-4">
                      {selectedScoreInfo ? (
                        <div className="space-y-4">
                          {/* Fit Score Overview Card */}
                          <div className="p-5 rounded-2xl bg-[#11131a] border border-white/[0.08] space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white">
                                AI Candidate Matching Score
                              </span>
                              <span className="text-xs font-mono text-zinc-400">
                                Evaluated against {activeProfile?.fullName}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-3xl font-extrabold font-mono text-white">
                                {selectedScoreInfo.score}%
                              </div>
                              <div className="flex-1 bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
                                  style={{ width: `${selectedScoreInfo.score}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Skill Overlap Matrix */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Hard Skills Matched */}
                            <div className="p-5 rounded-2xl bg-[#11131a] border border-white/[0.08] space-y-3">
                              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Matching Skills ({selectedScoreInfo.hardSkills?.length || 0})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedScoreInfo.hardSkills && selectedScoreInfo.hardSkills.length > 0 ? (
                                  selectedScoreInfo.hardSkills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono font-semibold"
                                    >
                                      {skill}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-zinc-400 italic">No hard skill matches detected.</span>
                                )}
                              </div>
                            </div>

                            {/* Additional Skills Requested */}
                            <div className="p-5 rounded-2xl bg-[#11131a] border border-white/[0.08] space-y-3">
                              <div className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span>Requested Additional Skills ({selectedScoreInfo.missingSkills?.length || 0})</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {selectedScoreInfo.missingSkills && selectedScoreInfo.missingSkills.length > 0 ? (
                                  selectedScoreInfo.missingSkills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="px-3 py-1 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-mono"
                                    >
                                      {skill}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-zinc-400 italic">Candidate meets all stated requirements!</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Rejection / Note Reason if Any */}
                          {selectedScoreInfo.rejectionReason && (
                            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs space-y-1">
                              <span className="font-bold block">Eligibility Note:</span>
                              <span>{selectedScoreInfo.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-zinc-400 text-sm font-mono">
                          Evaluating candidate fit signals...
                        </div>
                      )}
                    </div>
                  )}

                  {activeStudioTab === "raw" && (
                    <div className="p-6 rounded-2xl bg-[#11131a] border border-white/[0.08] text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {cleanText(selectedJob.rawDescription)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-zinc-500 font-mono text-sm flex flex-col items-center justify-center h-full gap-2">
                <span>Select a job from the queue to view complete details</span>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === "list" ? (
        /* ══════════════════════════════════════════════════════════════════════
           FULL-WIDTH TABLE LIST VIEW
           ══════════════════════════════════════════════════════════════════════ */
        <div className="rounded-2xl bg-[#0f1118] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-xl">
          {filteredJobs.map((job) => {
            const displayCategory = determineCategory(job.title, job.rawDescription);
            const displayExpLevel = determineExperienceLevel(job.title, job.rawDescription);
            const relativeTimeStr = formatRelativeAge(job.postedAt, job.firstSeenAt || job.createdAt, nowTick);
            const scoreInfo = scoresMap[job.id];

            return (
              <div
                key={job.id}
                onClick={() => {
                  setSelectedJob(job);
                  setIsFocusModalOpen(true);
                }}
                className="p-4 hover:bg-zinc-900/70 transition-all flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0 group-hover:bg-indigo-600 transition-colors">
                    {job.company.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-white truncate">{job.company}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-indigo-300">
                        {job.platform}
                      </span>
                    </div>
                    <h3 className="text-sm text-zinc-300 group-hover:text-indigo-200 truncate font-semibold">
                      {job.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {renderMatchBadge(scoreInfo)}
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-mono">
                    {displayCategory}
                  </span>
                  <span className="hidden md:inline-block px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-mono">
                    {displayExpLevel}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20 font-semibold">
                    {formatRemoteScopeLabel(job.remoteScope, job.location)}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 font-semibold">
                    {relativeTimeStr}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════
           BENTO GRID CARDS VIEW
           ══════════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const displayCategory = determineCategory(job.title, job.rawDescription);
            const displayExpLevel = determineExperienceLevel(job.title, job.rawDescription);
            const cleanDesc = cleanText(job.rawDescription);
            const relativeTimeStr = formatRelativeAge(job.postedAt, job.firstSeenAt || job.createdAt, nowTick);
            const scoreInfo = scoresMap[job.id];

            return (
              <div
                key={job.id}
                onClick={() => {
                  setSelectedJob(job);
                  setIsFocusModalOpen(true);
                }}
                className="p-5 rounded-2xl bg-[#0f1118] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between cursor-pointer group shadow-lg hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          {job.company}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-indigo-300">
                          {job.platform}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors mt-1">
                        {job.title}
                      </h3>
                    </div>

                    {renderMatchBadge(scoreInfo)}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-mono">
                      {displayCategory}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-mono">
                      {displayExpLevel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold">
                      {formatRemoteScopeLabel(job.remoteScope, job.location)}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-3 mb-4 leading-relaxed font-sans">
                    {cleanDesc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                  <span className="font-mono text-zinc-400 font-semibold">
                    {relativeTimeStr}
                  </span>
                  <span className="font-bold text-white group-hover:text-indigo-300 flex items-center gap-1">
                    <span>Inspect</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         FULL-SCREEN EXPANDED FOCUS READER MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      {isFocusModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-5xl max-h-[92vh] bg-[#0c0e14] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-[#121520] border-b border-white/[0.08] flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/15 flex items-center justify-center font-extrabold text-lg text-white shadow-md shrink-0">
                  {selectedJob.company.substring(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-zinc-400" />
                      {selectedJob.company}
                    </span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-indigo-300 font-semibold">
                      {selectedJob.platform}
                    </span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      {formatRemoteScopeLabel(selectedJob.remoteScope, selectedJob.location)}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {selectedJob.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={selectedJob.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs sm:text-sm hover:bg-zinc-200 transition-all shadow-md"
                >
                  <span>Apply on {selectedJob.platform}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <button
                  onClick={() => setIsFocusModalOpen(false)}
                  className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <FormattedJobDescription description={cleanText(selectedJob.rawDescription)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
