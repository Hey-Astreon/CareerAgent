"use client";

import { useProfileStore } from "@/store/useProfileStore";
import {
  Globe,
  Zap,
  Filter,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Sparkles,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";

// Initial mock job listings for high-velocity demonstration
const sampleJobs = [
  {
    id: "job-1",
    company: "Vercel",
    title: "Senior Full Stack Systems Engineer",
    platform: "GREENHOUSE",
    location: "Remote (Global / US / India)",
    isRemote: true,
    applicantCount: 12,
    postedAt: "18 mins ago",
    matchScore: 96,
    tags: ["Next.js", "TypeScript", "Node.js", "Redis"],
    url: "https://boards.greenhouse.io/vercel",
    matchedFor: ["roushan", "ayushi"],
  },
  {
    id: "job-2",
    company: "Supabase",
    title: "Backend & Storage Platform Engineer",
    platform: "ASHBY",
    location: "Remote",
    isRemote: true,
    applicantCount: 8,
    postedAt: "34 mins ago",
    matchScore: 94,
    tags: ["PostgreSQL", "C#", "FastAPI", "Docker"],
    url: "https://jobs.ashbyhq.com/supabase",
    matchedFor: ["roushan"],
  },
  {
    id: "job-3",
    company: "Anysphere (Cursor AI)",
    title: "AI Developer Tooling & Systems Engineer",
    platform: "YC_JOBS",
    location: "Remote",
    isRemote: true,
    applicantCount: 19,
    postedAt: "52 mins ago",
    matchScore: 98,
    tags: ["Python", "FastAPI", "Tree-Sitter", "TypeScript"],
    url: "https://www.ycombinator.com/companies/anysphere/jobs",
    matchedFor: ["roushan", "ayushi"],
  },
  {
    id: "job-4",
    company: "Anthropic",
    title: "LLM Infrastructure & Gateway Developer",
    platform: "LEVER",
    location: "Remote",
    isRemote: true,
    applicantCount: 25,
    postedAt: "1 hour ago",
    matchScore: 92,
    tags: ["Node.js", "Express", "Redis", "Prometheus"],
    url: "https://jobs.lever.co/anthropic",
    matchedFor: ["ayushi"],
  },
];

export default function Home() {
  const { activeProfile, activeProfileSlug } = useProfileStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  const handleTriggerScrape = () => {
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
    }, 2000);
  };

  const filteredJobs = sampleJobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Context Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Zap className="w-4 h-4 fill-current" />
              <span>SPEED-TO-APPLY DISCOVERY FEED</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Active Target: <span className="text-cyan-400">{activeProfile?.fullName || "Candidate"}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Showing ultra-fresh remote software engineering postings (<span className="text-slate-200 font-semibold">&lt; 2 hours old</span>) scored against your master resume skills and flagship projects.
            </p>
          </div>

          <button
            onClick={handleTriggerScrape}
            disabled={isScraping}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all duration-200 shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScraping ? "animate-spin" : ""}`} />
            <span>{isScraping ? "Scraping Portals..." : "Run Quick Scrape"}</span>
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
              <div className="text-[10px] font-mono text-slate-400">Flagship Projects</div>
              <div className="text-xs font-semibold text-cyan-400 mt-0.5">
                {activeProfile.projects.length} Verified
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400">Virtual Simulations</div>
              <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                CommBank • YC • Walmart
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <div className="text-[10px] font-mono text-slate-400">Avg Speed Goal</div>
              <div className="text-xs font-semibold text-amber-400 mt-0.5">
                &lt; 15 mins post-age
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by company or stack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Filters:</span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Remote Only</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Age &lt; 2h</span>
        </div>
      </div>

      {/* Job Feed Grid */}
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

                <div className="flex flex-col items-end">
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold shadow-sm">
                    {job.matchScore}% Match
                  </div>
                </div>
              </div>

              {/* Location & Posting Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {job.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <Clock className="w-3.5 h-3.5" />
                  {job.postedAt}
                </span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">
                  🔥 {job.applicantCount} Applicants
                </span>
              </div>

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
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
    </div>
  );
}
