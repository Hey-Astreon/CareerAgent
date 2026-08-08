"use client";

import { useProfileStore } from "@/store/useProfileStore";
import {
  Globe,
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
  Command,
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

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const posted = new Date(dateStr).getTime();
  const diffMs = now - posted;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return `1d ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
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
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [isScraping, setIsScraping] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

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
      if (selectedCategory === "Backend Developer" && (titleLower.includes("backend") || titleLower.includes("systems"))) {
        matchesCategory = true;
      } else if (selectedCategory === "Frontend Developer" && (titleLower.includes("frontend") || titleLower.includes("react"))) {
        matchesCategory = true;
      } else if (selectedCategory === "Full Stack Developer" && (titleLower.includes("full stack") || titleLower.includes("fullstack"))) {
        matchesCategory = true;
      } else if (selectedCategory === "Python Developer" && (titleLower.includes("python") || descLower.includes("python"))) {
        matchesCategory = true;
      } else if (selectedCategory === "AI / ML Engineer" && (titleLower.includes("ai") || titleLower.includes("machine learning"))) {
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

    const matchesPlatform =
      selectedPlatform === "ALL" ||
      job.platform.toUpperCase() === selectedPlatform.toUpperCase();

    const isDeveloperCodingJob = isStrictlyRemoteDeveloperRole(job.title, job.location, job.rawDescription);

    return isDeveloperCodingJob && matchesSearch && matchesCategory && matchesType && matchesExp && matchesPlatform;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-400 mb-1 font-semibold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real-Time Speed-to-Apply Feed</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Active Context: <span className="text-indigo-400 font-semibold">{activeProfile?.fullName || "Loading..."}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed font-sans">
              Monitoring 100% real, active remote engineering roles (0-3 Yrs / Internships) across LinkedIn, Greenhouse, Lever, Ashby, and YC Jobs.
            </p>
          </div>

          <button
            onClick={handleTriggerScrape}
            disabled={isScraping}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all duration-200 shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? "animate-spin" : ""}`} />
            <span>{isScraping ? "Scraping Live Remote Jobs..." : "Run Multi-Platform Scrape"}</span>
          </button>
        </div>

        {/* Telemetry Metrics Row */}
        {activeProfile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Candidate Stack</div>
              <div className="text-xs font-semibold text-slate-200 truncate mt-1">
                {activeProfileSlug === "roushan" ? "Backend & Systems" : "AI & Full-Stack"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Live Database Listings</div>
              <div className="text-xs font-semibold text-indigo-400 mt-1">
                {jobs.length} Remote Postings
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">URL Authenticity</div>
              <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Live URLs
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Experience Level</div>
              <div className="text-xs font-semibold text-slate-300 mt-1">
                0-3 Yrs / Entry Level
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Controls Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0F172A]/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Role & Platform Filters</span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Showing <span className="text-white font-bold">{filteredJobs.length}</span> of {jobs.length} Roles
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box with ⌘K Badge */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-sans"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
              <Command className="w-2.5 h-2.5" />K
            </span>
          </div>

          {/* Platform Filter */}
          <div>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer font-sans"
            >
              <option value="ALL">All Platforms ({jobs.length})</option>
              <option value="LINKEDIN">LinkedIn Remote ({platformCounts.LINKEDIN || 0})</option>
              <option value="GREENHOUSE">Greenhouse ATS ({platformCounts.GREENHOUSE || 0})</option>
              <option value="ASHBY">Ashby ATS ({platformCounts.ASHBY || 0})</option>
              <option value="LEVER">Lever ATS ({platformCounts.LEVER || 0})</option>
              <option value="YC_JOBS">YC Jobs ({platformCounts.YC_JOBS || 0})</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer font-sans"
            >
              <option value="ALL">All Categories ({availableCategories.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type Filter */}
          <div>
            <select
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer font-sans"
            >
              <option value="ALL">All Job Types</option>
              <option value="Full-Time">Remote Full-Time</option>
              <option value="Internship">Remote Internship</option>
              <option value="Contract">Remote Contract</option>
            </select>
          </div>

          {/* Experience Filter */}
          <div>
            <select
              value={selectedExpLevel}
              onChange={(e) => setSelectedExpLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 cursor-pointer font-sans"
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

      {/* Job Grid Feed */}
      {isLoadingJobs ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading remote engineering postings from SQLite database...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 space-y-2">
          <p className="text-sm font-medium text-slate-300">No postings match current filter criteria.</p>
          <p className="text-xs text-slate-400">Select "All Categories" or click "Run Multi-Platform Scrape" to update job listings.</p>
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
                className="p-5 rounded-2xl bg-[#0F172A]/70 border border-slate-800/80 hover:border-slate-700 transition-all duration-200 shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          {job.company}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {job.platform}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors mt-1">
                        {job.title}
                      </h3>
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] font-medium">
                      100% Remote
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-sans flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      {displayCategory}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-sans flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3 text-slate-400" />
                      {displayExpLevel}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-sans">
                      {displayJobType}
                    </span>
                  </div>

                  {/* Location & Time */}
                  <div className="flex items-center gap-2 mb-3 text-xs font-sans text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      Work From Home
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {timeAgo(job.postedAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-sans">
                    {cleanDesc}
                  </p>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleTrackJob(job)}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Direct Apply</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => {
                      handleTrackJob(job);
                      alert(`Application Kit automatically generated & tracked for ${job.company}!`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                  >
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
