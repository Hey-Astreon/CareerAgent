"use client";

import { useProfileStore } from "@/store/useProfileStore";
import {
  Zap,
  Filter,
  ExternalLink,
  Clock,
  Building2,
  MapPin,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { determineCategory, determineJobType, determineExperienceLevel } from "@/lib/scrapers/ats";

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

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const posted = new Date(dateStr).getTime();
  const diffMs = now - posted;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return `1 day ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function Home() {
  const { activeProfile, activeProfileSlug } = useProfileStore();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedJobType, setSelectedJobType] = useState("ALL");
  const [selectedExpLevel, setSelectedExpLevel] = useState("ALL");
  const [isScraping, setIsScraping] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Fetch jobs from database on mount
  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/jobs/scrape");
        const data = await res.json();
        if (data.success && data.jobs) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error("Failed to load jobs from database:", err);
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

  // Dynamically compute unique role categories available in market database
  const availableCategories = useMemo(() => {
    const defaultList = [
      "Backend Developer",
      "Frontend Developer",
      "Full Stack Developer",
      "Software Developer",
      "Web Developer",
      "Python Developer",
      "AI / ML Engineer",
    ];
    const computedCats = jobs.map((j) => determineCategory(j.title, j.rawDescription));
    const combined = Array.from(new Set([...defaultList, ...computedCats]));
    return combined.sort();
  }, [jobs]);

  // Apply Search + Role Category + Job Type + Experience Level Filters
  // GUARD: Always hide Senior/Staff roles even if they slipped through the scraper filter
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
      if (selectedCategory === "Backend Developer" && (titleLower.includes("backend") || titleLower.includes("systems") || titleLower.includes("infrastructure"))) {
        matchesCategory = true;
      } else if (selectedCategory === "Frontend Developer" && (titleLower.includes("frontend") || titleLower.includes("react") || titleLower.includes("ui"))) {
        matchesCategory = true;
      } else if (selectedCategory === "Full Stack Developer" && (titleLower.includes("full stack") || titleLower.includes("fullstack"))) {
        matchesCategory = true;
      } else if (selectedCategory === "Python Developer" && (titleLower.includes("python") || descLower.includes("python"))) {
        matchesCategory = true;
      } else if (selectedCategory === "AI / ML Engineer" && (titleLower.includes("ai") || titleLower.includes("machine learning") || titleLower.includes("llm"))) {
        matchesCategory = true;
      } else if (selectedCategory === "Web Developer" && (titleLower.includes("web") || titleLower.includes("frontend"))) {
        matchesCategory = true;
      } else if (titleLower.includes(targetCatLower)) {
        matchesCategory = true;
      }
    }

    const computedType = determineJobType(job.title, job.rawDescription);
    const matchesType =
      selectedJobType === "ALL" ||
      computedType.toLowerCase().includes(selectedJobType.toLowerCase());

    const matchesExp =
      selectedExpLevel === "ALL" ||
      computedExp.toLowerCase().includes(selectedExpLevel.toLowerCase());

    return matchesSearch && matchesCategory && matchesType && matchesExp;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Context Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Zap className="w-4 h-4 fill-current" />
              <span>SPEED-TO-APPLY REMOTE DISCOVERY FEED</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Active Candidate: <span className="text-cyan-400">{activeProfile?.fullName || "Loading..."}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Strictly monitoring <span className="text-slate-200 font-semibold">100% Real, Active, Remote, Work-From-Home (0-3 Yrs / Internship)</span> roles across Greenhouse, Lever, Ashby, YC Jobs, and LinkedIn Remote.
            </p>
          </div>

          <button
            onClick={handleTriggerScrape}
            disabled={isScraping}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all duration-200 shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScraping ? "animate-spin" : ""}`} />
            <span>{isScraping ? "Scraping Live Remote Jobs..." : "Run Multi-Platform Scrape"}</span>
          </button>
        </div>

        {/* Candidate Stats Row */}
        {activeProfile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400">Target Role</div>
              <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                {activeProfileSlug === "roushan" ? "Backend & Systems" : "AI & Full-Stack"}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400">Active Real Remote Roles</div>
              <div className="text-xs font-semibold text-cyan-400 mt-0.5">
                {jobs.length} Real Live Listings
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400">URL Authenticity</div>
              <div className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 100% Live URLs
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400">Exp Level Target</div>
              <div className="text-xs font-semibold text-amber-400 mt-0.5">
                0-3 Yrs / Internships
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toolbar Section */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Filter className="w-4 h-4" />
            <span>DYNAMIC TARGET ROLE & EXPERIENCE FILTERS</span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Showing <span className="text-cyan-300 font-bold">{filteredJobs.length}</span> of {jobs.length} Roles
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-sans"
            />
          </div>

          {/* Dynamic Role Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer font-mono"
            >
              <option value="ALL">All Role Categories ({availableCategories.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type Dropdown */}
          <div>
            <select
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer font-mono"
            >
              <option value="ALL">All Job Types (Remote Only)</option>
              <option value="Full-Time">Remote Full-Time</option>
              <option value="Internship">Remote Internship</option>
              <option value="Contract">Remote Contract</option>
            </select>
          </div>

          {/* Experience Level Dropdown */}
          <div>
            <select
              value={selectedExpLevel}
              onChange={(e) => setSelectedExpLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer font-mono"
            >
              <option value="ALL">All Early Career (0-3 Yrs)</option>
              <option value="Fresher / Entry Level">Fresher / Entry Level (0-1 Yr)</option>
              <option value="Junior">Junior (1-3 Yrs)</option>
              <option value="0-3 Years">0-3 Years (Entry/Junior)</option>
              <option value="Mid-Level">Mid-Level (2-4 Yrs)</option>
              <option value="Internship">Remote Internship</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Feed List */}
      {isLoadingJobs ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading strictly remote software engineering postings from SQLite database...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-3">
          <p className="text-sm font-semibold text-slate-300">No matching postings for current filter selection.</p>
          <p className="text-xs text-slate-400">Select "All Role Categories" or click "Run Multi-Platform Scrape" to pull additional live postings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const displayCategory = determineCategory(job.title, job.rawDescription);
            const displayJobType = determineJobType(job.title, job.rawDescription);
            const displayExpLevel = determineExperienceLevel(job.title, job.rawDescription);
            const cleanDesc = cleanText(job.rawDescription);

            return (
              <div
                key={job.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-200 shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                          {job.company}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {job.platform}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mt-1">
                        {job.title}
                      </h3>
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold shadow-sm">
                      ⚡ 100% Remote
                    </div>
                  </div>

                  {/* Dynamic Category & Experience Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {displayCategory}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {displayExpLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                      {displayJobType}
                    </span>
                  </div>

                  {/* Location & Posting Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      100% Remote (Work From Home)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Clock className="w-3.5 h-3.5" />
                      Posted {timeAgo(job.postedAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-sans">
                    {cleanDesc}
                  </p>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 transition-colors underline underline-offset-4"
                  >
                    <span>Direct Apply Link (100% Verified)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Application Kit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
