"use client";

import { useProfileStore } from "@/store/useProfileStore";
import {
  Globe,
  ExternalLink,
  Building2,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  LayoutGrid,
  List,
  X,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { determineCategory, determineJobType, determineExperienceLevel, isStrictlyRemoteDeveloperRole } from "@/lib/scrapers/ats";

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
  applicantCount: number | null;
  postedAt: string;
  url: string;
  rawDescription: string;
}

function cleanText(htmlOrText: string): string {
  if (!htmlOrText) return "";
  return htmlOrText.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

/**
 * Calculates dynamic real-time relative posting age from postedAt timestamp.
 */
function timeAgo(dateStr: string, currentMs: number): string {
  if (!dateStr) return "Recently";
  const posted = new Date(dateStr).getTime();
  if (isNaN(posted)) return "Recently";

  const diffMs = Math.max(0, currentMs - posted);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function Home() {
  const { activeProfile, activeProfileSlug } = useProfileStore();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [viewMode, setViewMode] = useState<"list" | "bento">("list");
  const [drawerJob, setDrawerJob] = useState<JobItem | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  
  // Real-Time Dynamic Clock Tick (Updates relative age every 30s)
  const [nowTick, setNowTick] = useState<number>(Date.now());

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

  const handleTrackJob = async (job: JobItem) => {
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug: activeProfileSlug || "roushan",
          jobPostingId: job.id,
          company: job.company,
          title: job.title,
          url: job.url,
        }),
      });
    } catch (err) {
      console.error("Failed to track application:", err);
    }
  };

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {
      LINKEDIN: 0,
      GREENHOUSE: 0,
      ASHBY: 0,
      LEVER: 0,
      YC_JOBS: 0,
    };
    for (const j of jobs) {
      const p = j.platform?.toUpperCase();
      if (p) counts[p] = (counts[p] || 0) + 1;
    }
    return counts;
  }, [jobs]);

  const filteredJobs = jobs.filter((job) => {
    const computedExp = determineExperienceLevel(job.title, job.rawDescription);
    if (computedExp === "Senior / Staff Level (5+ Yrs)") return false;
    const matchesSearch =
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

    const isDeveloperCodingJob = isStrictlyRemoteDeveloperRole(job.title, job.location, job.rawDescription);

    return isDeveloperCodingJob && matchesSearch && matchesCategory && matchesPlatform;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-[#121215] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Live Discovery Feed</span>
            <span className="text-xs font-mono font-normal text-zinc-400">({filteredJobs.length} active postings)</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Active Candidate Context: <span className="text-white font-medium">{activeProfile?.fullName || "Candidate"}</span> (0-3 Yrs / Entry Level)
          </p>
        </div>

        <button
          onClick={handleTriggerScrape}
          disabled={isScraping}
          className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
          <span>{isScraping ? "Syncing..." : "Sync Multi-Platform Scrape"}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.2 rounded bg-zinc-800 border border-white/10 text-[10px] font-mono text-zinc-400">
              ⌘K
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-white/[0.08] shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                viewMode === "list" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode("bento")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                viewMode === "bento" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>
        </div>

        {/* Platform Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/[0.06]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1">Platform:</span>
          {[
            { id: "ALL", label: `All (${jobs.length})` },
            { id: "LINKEDIN", label: `LinkedIn (${platformCounts.LINKEDIN || 0})` },
            { id: "GREENHOUSE", label: `Greenhouse (${platformCounts.GREENHOUSE || 0})` },
            { id: "ASHBY", label: `Ashby (${platformCounts.ASHBY || 0})` },
            { id: "LEVER", label: `Lever (${platformCounts.LEVER || 0})` },
            { id: "YC_JOBS", label: `YC Jobs (${platformCounts.YC_JOBS || 0})` },
          ].map((plat) => (
            <button
              key={plat.id}
              onClick={() => setSelectedPlatform(plat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                selectedPlatform === plat.id
                  ? "bg-white text-black font-semibold"
                  : "bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:text-zinc-200"
              }`}
            >
              {plat.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1">Role:</span>
          {[
            "ALL",
            "React Developer",
            "Backend Developer",
            "Frontend Developer",
            "Full Stack Developer",
            "Python Developer",
            "AI / ML Engineer",
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                selectedCategory === cat
                  ? "bg-zinc-800 text-white font-semibold border border-white/20"
                  : "bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:text-zinc-200"
              }`}
            >
              {cat === "ALL" ? "All Roles" : cat}
            </button>
          ))}
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
            const relativeTimeStr = timeAgo(job.postedAt, nowTick);

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
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 text-[10px] font-mono">
                    {displayCategory}
                  </span>
                  <span className="hidden md:inline-block px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 text-[10px] font-mono">
                    {displayExpLevel}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                    100% Remote
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
            const relativeTimeStr = timeAgo(job.postedAt, nowTick);

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

                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-medium shrink-0">
                      100% Remote
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
                    Posted {relativeTimeStr}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#121215] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Posting Age</div>
                  <div className="text-xs font-semibold text-white mt-0.5 font-mono">
                    Posted {timeAgo(drawerJob.postedAt, nowTick)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#121215] border border-white/[0.06]">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Remote Type</div>
                  <div className="text-xs font-semibold text-emerald-400 mt-0.5">100% Work From Home</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-zinc-300">Clean Job Description</div>
                <div className="p-3.5 rounded-lg bg-[#121215] border border-white/[0.06] text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-sans">
                  {cleanText(drawerJob.rawDescription)}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <a
                href={drawerJob.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => handleTrackJob(drawerJob)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm"
              >
                <span>Direct Apply Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  handleTrackJob(drawerJob);
                  alert(`Application Kit generated for ${drawerJob.company}!`);
                }}
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
