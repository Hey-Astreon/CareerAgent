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
      <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Fit & Match Studio</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical AI evaluation comparing candidate master resume skills against job posting requirements.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Selector List */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1 font-semibold">
            Target Engineering Postings ({jobs.length})
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
                      ? "bg-slate-800/90 border-slate-700/80 text-white font-medium shadow-md"
                      : "bg-[#0F172A]/60 border-slate-800/80 hover:border-slate-700 hover:bg-[#0F172A]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-400" />
                      {job.company}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {job.platform}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                    {job.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Semantic Evaluation Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {selectedJob ? (
            <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-slate-800/80 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="text-xs font-mono text-indigo-400 flex items-center gap-1 mb-1 font-semibold">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedJob.company}
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{selectedJob.title}</h2>
                </div>

                <button
                  onClick={() => handleRunMatch(selectedJob.id)}
                  disabled={isEvaluating}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isEvaluating ? "animate-spin" : ""}`} />
                  <span>{isEvaluating ? "Calculating Technical Match..." : "Run AI Match Evaluation"}</span>
                </button>
              </div>

              {matchData && (
                <div className="space-y-6">
                  {/* Empirical Match Score Display */}
                  <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                        Empirical Semantic Fit Score
                      </div>
                      <div className="text-2xl font-bold text-white mt-1 flex items-baseline gap-2">
                        <span>{matchData.score}%</span>
                        <span className="text-xs font-normal text-slate-400">
                          {matchData.score >= 80 ? "Strong Match" : matchData.score >= 60 ? "Moderate Match" : "Gap Detected"}
                        </span>
                      </div>
                    </div>

                    <div className="w-32 h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${matchData.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Overlapping Hard Skills */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Matching Technical Skills ({matchData.hardSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {matchData.hardSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-sans"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Missing / Required Gaps ({matchData.missingSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {matchData.missingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-sans"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Executive Technical Fit Reasoning */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-200">
                      Technical Assessment Reasoning
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {matchData.reasoning}
                    </p>
                  </div>
                </div>
              )}

              {/* Clean Structured Job Description Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300">
                    Clean Job Description
                  </h3>

                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <span>View Listing</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-sans text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
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
