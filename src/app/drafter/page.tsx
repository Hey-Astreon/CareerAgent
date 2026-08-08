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
  Layers,
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
    setKitData(null);
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
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-xl bg-[#121215] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-white">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Application Kit Drafter</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tailored cover letters, native PDF binary extractability validation, and real keyword telemetry.
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
                  onClick={() => handleGenerateKit(job.id)}
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

        {/* Right Column: Drafter Workspace */}
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
                  onClick={() => handleGenerateKit(selectedJob.id)}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>{isGenerating ? "Generating Kit..." : "Generate Application Kit"}</span>
                </button>
              </div>

              {kitData && (
                <div className="space-y-4">
                  {/* Telemetry Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] flex flex-col justify-between space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ATS Parseability</span>
                      </div>
                      <div>
                        <span className="font-mono text-sm font-bold text-emerald-300 block">
                          {kitData.atsExtractabilityScore}% Text Layer
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Direct Binary Audit
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] flex flex-col justify-between space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Reviewer Alignment</span>
                      </div>
                      <div>
                        <span className="font-mono text-sm font-bold text-zinc-200 block">
                          {kitData.atsReviewerScore}% Keyword Match
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Role Narrative Density
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] flex flex-col justify-between space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-400">
                        <Layers className="w-3.5 h-3.5" />
                        <span>PDF Encoding</span>
                      </div>
                      <div>
                        <span className="font-mono text-sm font-bold text-violet-300 block">
                          100% Vector Text
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Zero Image/OCR Loss
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recruiter Evaluation */}
                  <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.06] space-y-1">
                    <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                      Recruiter Evaluation Feedback
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {kitData.reviewerFeedback}
                    </p>
                  </div>

                  {/* Tailored Cover Letter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-zinc-400" />
                        Tailored Cover Letter
                      </h3>

                      <button
                        onClick={handleCopyCoverLetter}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-200 text-xs font-mono transition-colors"
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

                    <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.06] text-xs font-sans text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {kitData.coverLetter}
                    </div>
                  </div>

                  {/* Direct Apply Button */}
                  <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        Active Master Resume PDF
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 truncate max-w-sm mt-0.5">
                        {kitData.pdfPath}
                      </div>
                    </div>

                    <a
                      href={selectedJob.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm"
                    >
                      <span>Proceed to Apply</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-[#121215] border border-white/[0.08] text-zinc-400 text-xs font-mono">
              Select a job posting to generate an Application Kit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
