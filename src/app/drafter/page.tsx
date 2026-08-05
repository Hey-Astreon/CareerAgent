"use client";

import { useProfileStore } from "@/store/useProfileStore";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  ExternalLink,
  Cpu,
} from "lucide-react";
import { useState, useEffect } from "react";

interface JobItem {
  id: string;
  company: string;
  title: string;
  platform: string;
  url: string;
}

interface KitData {
  tailoredSummary: string;
  tailoredProjects: Array<{
    title: string;
    techStack: string;
    bullets: string[];
  }>;
  coverLetter: string;
  atsReviewerScore: number;
  reviewerFeedback: string;
  atsExtractabilityScore: number;
  pdfPath: string;
}

export default function ApplicationDrafterPage() {
  const { activeProfile, activeProfileSlug } = useProfileStore();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [kitData, setKitData] = useState<KitData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleGenerateKit = async (jobId: string) => {
    setSelectedJobId(jobId);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/jobs/kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug: activeProfileSlug,
          jobPostingId: jobId,
        }),
      });
      const data = await res.json();
      if (data.success && data.kit) {
        setKitData(data.kit);
      }
    } catch (err) {
      console.error("Error generating kit:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCoverLetter = () => {
    if (kitData?.coverLetter) {
      navigator.clipboard.writeText(kitData.coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Application Kit Drafter</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual-agent tailoring loop generating 1-page PDF resumes, custom cover letters, and live binary `pdf-parse` ATS text extraction.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Selector List */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
            Target Engineering Postings ({jobs.length})
          </h2>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {jobs.map((job) => {
              const isSelected = job.id === selectedJobId;
              return (
                <button
                  key={job.id}
                  onClick={() => handleGenerateKit(job.id)}
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

        {/* Right Column: Split Workspace (PDF Preview + Cover Letter & Telemetry) */}
        <div className="lg:col-span-2 space-y-4">
          {selectedJob ? (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="text-xs font-mono text-cyan-400 flex items-center gap-1 mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedJob.company}
                  </div>
                  <h2 className="text-lg font-extrabold text-white">{selectedJob.title}</h2>
                </div>

                <button
                  onClick={() => handleGenerateKit(selectedJob.id)}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all duration-200 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>{isGenerating ? "Running Drafter-Reviewer Loop..." : "Generate Application Kit"}</span>
                </button>
              </div>

              {kitData && (
                <div className="space-y-6">
                  {/* Real Dynamic ATS Telemetry Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>ATS Parseability</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-emerald-300 mt-1">
                        {kitData.atsExtractabilityScore}% Pass
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Reviewer Alignment</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-cyan-300 mt-1">
                        {kitData.atsReviewerScore}% Quality
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
                        <Cpu className="w-4 h-4" />
                        <span>PDF Text Binary</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-violet-300 mt-1">
                        Live Binary Check
                      </span>
                    </div>
                  </div>

                  {/* Tailored Cover Letter Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        Tailored Cover Letter
                      </h3>

                      <button
                        onClick={handleCopyCoverLetter}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Letter</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {kitData.coverLetter}
                    </div>
                  </div>

                  {/* 1-Page Master Resume Action */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Active Master Resume PDF
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-sm mt-0.5">
                        {kitData.pdfPath}
                      </div>
                    </div>

                    <a
                      href={selectedJob.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
                    >
                      <span>Proceed to Apply</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs font-mono">
              Select a job posting to generate a tailored Application Kit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
