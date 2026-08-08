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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Fit & Match Studio</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Semantic AI evaluation comparing candidate master resume skills against job description requirements.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Selector List */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
            Select Job Posting ({jobs.length})
          </h2>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {jobs.map((job) => {
              const isSelected = job.id === selectedJobId;
              return (
                <button
                  key={job.id}
                  onClick={() => handleRunMatch(job.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 border-cyan-500/50 shadow-lg shadow-cyan-950/20"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-cyan-400" />
                      {job.company}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                      {job.platform}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 line-clamp-1">
                    {job.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Semantic Evaluation Card */}
        <div className="lg:col-span-2 space-y-4">
          {selectedJob ? (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="text-xs font-mono text-cyan-400 flex items-center gap-1 mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedJob.company} • {selectedJob.location}
                  </div>
                  <h2 className="text-lg font-extrabold text-white">{selectedJob.title}</h2>
                </div>

                <button
                  onClick={() => handleRunMatch(selectedJob.id)}
                  disabled={isEvaluating}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isEvaluating ? "animate-spin" : ""}`} />
                  <span>{isEvaluating ? "Evaluating..." : "Run AI Semantic Match"}</span>
                </button>
              </div>

              {matchData && (
                <div className="space-y-6">
                  {/* Score & Reasoning Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
                      <div className="text-3xl font-black text-emerald-400 font-mono">
                        {matchData.score}%
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                        Semantic Match Score
                      </div>
                    </div>

                    <div className="md:col-span-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Executive Fit Summary
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        {matchData.reasoning}
                      </p>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hard Skill Overlaps */}
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                      <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Hard Skill Overlaps ({matchData.hardSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {matchData.hardSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Skill Gaps */}
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                      <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Missing Keyword Gaps ({matchData.missingSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {matchData.missingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clean Job Description Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Clean Job Description</span>
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>View Portal Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-sans text-slate-300 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {cleanAndFormatDescription(selectedJob.rawDescription)}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs font-mono">
              Select a job posting to run AI semantic match evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
