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
    const scrapedCats = jobs.map((j) => j.category).filter(Boolean);
    const combined = Array.from(new Set([...defaultList, ...scrapedCats]));
    return combined.sort();
  }, [jobs]);

  // Apply Search + Role Category + Job Type + Experience Level Filters
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "ALL" ||
      job.category.toLowerCase() === selectedCategory.toLowerCase() ||
      job.title.toLowerCase().includes(selectedCategory.toLowerCase());

    const matchesType =
      selectedJobType === "ALL" ||
      job.jobType.toLowerCase().includes(selectedJobType.toLowerCase());

    const matchesExp =
      selectedExpLevel === "ALL" ||
      job.experienceLevel.toLowerCase().includes(selectedExpLevel.toLowerCase());

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
              Strictly monitoring <span className="text-slate-200 font-semibold">100% Remote, Work-From-Home, and Entry-Level (0-3 Yrs) / Internship</span> roles across Greenhouse, Lever, Ashby, YC Jobs, and LinkedIn Remote.
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
              <div className="text-[10px] font-mono text-slate-400">Active Remote Postings</div>
              <div className="text-xs font-semibold text-cyan-400 mt-0.5">
                {jobs.length} Verified Roles
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400">On-Site Exclusion</div>
              <div className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 0 On-Site Allowed
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
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Filter className="w-4 h-4" />
          <span>DYNAMIC TARGET ROLE & EXPERIENCE FILTERS</span>
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
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
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
              <option value="Fresher">Fresher / Entry Level (0-1 Yr)</option>
              <option value="Junior">Junior (1-3 Yrs)</option>
              <option value="Internship">Internship / Co-op</option>
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
          <p className="text-sm font-semibold text-slate-300">No matching remote postings found.</p>
          <p className="text-xs text-slate-400">Click "Run Multi-Platform Scrape" above to ingest live remote engineering & internship postings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
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

                {/* Role Category & Experience Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {job.category || "Software Developer"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {job.experienceLevel || "0-3 Years"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                    {job.jobType || "Remote Full-Time"}
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
                    {new Date(job.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {job.applicantCount && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-semibold">
                        🔥 {job.applicantCount} Applicants
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-sans">
                  {job.rawDescription}
                </p>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                >
                  <span>Direct Apply Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Application Kit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
