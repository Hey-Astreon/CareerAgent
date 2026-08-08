"use client";

import { useProfileStore } from "@/store/useProfileStore";
import { Target, Sparkles, CheckCircle2, AlertTriangle, Building2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface JobItem {
  id: string;
  company: string;
  title: string;
  platform: string;
  location: string;
  url: string;
  rawDescription: string;
}

interface MatchScoreData {
  score: number;
  hardSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

function cleanAndFormatDescription(text: string): string {
  if (!text) return "";
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<p[^>]*>/gi, "\n\n")
    .replace(/<\/p>/gi, "")
    .replace(/<div[^>]*>/gi, "\n")
    .replace(/<\/div>/gi, "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

export default function MatchStudioPage() {
  const { activeProfile, activeProfileSlug } = useProfileStore();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [matchData, setMatchData] = useState<MatchScoreData | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/jobs/scrape");
        const data = await res.json();
        if (data.success && data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
          setSelectedJobId(data.jobs[0].id);
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
      }
    }
    loadJobs();
  }, []);

  const handleRunMatch = async (jobId: string) => {
    setSelectedJobId(jobId);
    setMatchData(null);
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug: activeProfileSlug,
          jobPostingId: jobId,
        }),
      });
      const data = await res.json();
      if (data.success && data.matchScore) {
        setMatchData(data.matchScore);
      }
    } catch (err) {
      console.error("Error evaluating match:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-[#121215] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-white">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Fit & Match Studio</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Empirical AI evaluation comparing candidate master resume skills against job posting requirements.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Job Selector */}
        <div className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 px-1 font-semibold">
            Engineering Postings ({jobs.length})
          </h2>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {jobs.map((job) => {
              const isSelected = job.id === selectedJobId;
              return (
                <button
                  key={job.id}
                  onClick={() => handleRunMatch(job.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-zinc-800 text-white font-semibold border-white/20 shadow-sm"
                      : "bg-[#121215] border-white/[0.06] hover:border-white/10 hover:bg-zinc-900/60 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-zinc-400" />
                      {job.company}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-white/10 text-zinc-400">
                      {job.platform}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-200 line-clamp-1 font-medium">
                    {job.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedJob ? (
            <div className="p-5 rounded-xl bg-[#121215] border border-white/[0.08] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
                <div>
                  <div className="text-xs font-mono text-zinc-400 flex items-center gap-1 mb-0.5 font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    {selectedJob.company}
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight">{selectedJob.title}</h2>
                </div>

                <button
                  onClick={() => handleRunMatch(selectedJob.id)}
                  disabled={isEvaluating}
                  className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
                  <span>{isEvaluating ? "Evaluating..." : "Run AI Match Evaluation"}</span>
                </button>
              </div>

              {matchData && (
                <div className="space-y-4">
                  {/* Score Card */}
                  <div className="p-4 rounded-lg bg-zinc-900/80 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        Empirical Match Score
                      </div>
                      <div className="text-2xl font-bold text-white mt-0.5 flex items-baseline gap-2">
                        <span>{matchData.score}%</span>
                        <span className="text-xs font-normal text-zinc-400">
                          {matchData.score >= 80 ? "Strong Match" : matchData.score >= 60 ? "Moderate Match" : "Gap Detected"}
                        </span>
                      </div>
                    </div>

                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="18"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          className="text-zinc-800"
                          fill="transparent"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="18"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeDasharray={113}
                          strokeDashoffset={113 - (113 * matchData.score) / 100}
                          className="text-white transition-all duration-700"
                          fill="transparent"
                        />
                      </svg>
                      <span className="absolute text-[11px] font-mono font-bold text-white">{matchData.score}%</span>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.06] space-y-1.5">
                      <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Matching Skills ({matchData.hardSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {matchData.hardSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.06] space-y-1.5">
                      <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Missing Skills ({matchData.missingSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {matchData.missingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.06] space-y-1">
                    <div className="text-xs font-semibold text-zinc-200">
                      Technical Assessment Reasoning
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {matchData.reasoning}
                    </p>
                  </div>
                </div>
              )}

              {/* Clean Job Description */}
              <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-300">
                    Clean Job Description
                  </h3>

                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>View Listing</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.06] text-xs font-sans text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                  {cleanAndFormatDescription(selectedJob.rawDescription)}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-[#121215] border border-white/[0.08] text-zinc-400 text-xs font-mono">
              Select a job posting to run AI match evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
