"use client";

import { useProfileStore } from "@/store/useProfileStore";
import {
  Kanban,
  Building2,
  Clock,
  Mail,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";

interface TrackedApplication {
  id: string;
  company: string;
  title: string;
  status: "SHORTLISTED" | "APPLIED" | "SCREENING" | "TECHNICAL_ROUND" | "OFFER" | "QUIET";
  appliedDate: string;
  daysSilent: number;
}

const initialApplications: TrackedApplication[] = [
  {
    id: "app-1",
    company: "Vercel",
    title: "Senior Full Stack Systems Engineer",
    status: "APPLIED",
    appliedDate: "Aug 4, 2026",
    daysSilent: 2,
  },
  {
    id: "app-2",
    company: "Supabase",
    title: "Backend & Storage Platform Engineer",
    status: "SHORTLISTED",
    appliedDate: "Aug 5, 2026",
    daysSilent: 1,
  },
  {
    id: "app-3",
    company: "Anysphere (Cursor AI)",
    title: "AI Developer Tooling Engineer",
    status: "SCREENING",
    appliedDate: "Jul 28, 2026",
    daysSilent: 8,
  },
  {
    id: "app-4",
    company: "Anthropic",
    title: "LLM Infrastructure Specialist",
    status: "QUIET",
    appliedDate: "Jul 22, 2026",
    daysSilent: 14,
  },
];

const columns = [
  { id: "SHORTLISTED", title: "Shortlisted", color: "text-indigo-400 border-indigo-500/30" },
  { id: "APPLIED", title: "Applied", color: "text-blue-400 border-blue-500/30" },
  { id: "SCREENING", title: "Screening", color: "text-violet-400 border-violet-500/30" },
  { id: "TECHNICAL_ROUND", title: "Technical", color: "text-amber-400 border-amber-500/30" },
  { id: "OFFER", title: "Offer", color: "text-emerald-400 border-emerald-500/30" },
  { id: "QUIET", title: "Quiet (>10d)", color: "text-rose-400 border-rose-500/30" },
];

export default function TrackerPage() {
  const { activeProfile, activeProfileSlug } = useProfileStore();
  const [apps, setApps] = useState<TrackedApplication[]>(initialApplications);
  const [loading, setLoading] = useState(true);
  const [newCompany, setNewCompany] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [followupModal, setFollowupModal] = useState<{
    isOpen: boolean;
    company: string;
    title: string;
    text: string;
  }>({ isOpen: false, company: "", title: "", text: "" });
  const [copied, setCopied] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?profileSlug=${activeProfileSlug || "roushan"}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.applications) && data.applications.length > 0) {
        setApps(data.applications);
      } else {
        setApps(initialApplications);
      }
    } catch (err) {
      console.error("Failed to load applications from API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [activeProfileSlug]);

  const updateApplicationStatusInBackend = async (id: string, newStatus: string) => {
    try {
      await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to sync application status with API:", err);
    }
  };

  const handleAdvanceStatus = (appId: string) => {
    const nextStatusMap: Record<string, TrackedApplication["status"]> = {
      SHORTLISTED: "APPLIED",
      APPLIED: "SCREENING",
      SCREENING: "TECHNICAL_ROUND",
      TECHNICAL_ROUND: "OFFER",
      OFFER: "OFFER",
      QUIET: "APPLIED",
    };

    setApps((prev) =>
      prev.map((a) => {
        if (a.id === appId) {
          const nextSt = nextStatusMap[a.status];
          updateApplicationStatusInBackend(a.id, nextSt);
          return { ...a, status: nextSt };
        }
        return a;
      })
    );
  };

  const handleRegressStatus = (appId: string) => {
    const prevStatusMap: Record<string, TrackedApplication["status"]> = {
      SHORTLISTED: "SHORTLISTED",
      APPLIED: "SHORTLISTED",
      SCREENING: "APPLIED",
      TECHNICAL_ROUND: "SCREENING",
      OFFER: "TECHNICAL_ROUND",
      QUIET: "APPLIED",
    };

    setApps((prev) =>
      prev.map((a) => {
        if (a.id === appId) {
          const prevSt = prevStatusMap[a.status];
          updateApplicationStatusInBackend(a.id, prevSt);
          return { ...a, status: prevSt };
        }
        return a;
      })
    );
  };

  const handleDirectSetStatus = (appId: string, status: TrackedApplication["status"]) => {
    updateApplicationStatusInBackend(appId, status);
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    );
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newTitle.trim()) return;

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileSlug: activeProfileSlug || "roushan",
          company: newCompany.trim(),
          title: newTitle.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadApplications();
      }
    } catch (err) {
      console.error("Failed to add application:", err);
    }

    setNewCompany("");
    setNewTitle("");
    setIsAdding(false);
  };

  const handleGenerateFollowup = (app: TrackedApplication) => {
    const draftText = `Subject: Following up regarding ${app.title} position - ${activeProfile?.fullName || "Candidate"}

Dear Hiring Manager at ${app.company},

I hope this message finds you well.

I am writing to express my continued enthusiasm for the ${app.title} role. I submitted my application on ${app.appliedDate} and remain very interested in contributing to ${app.company}'s engineering initiatives.

Given my background in building low-latency REST APIs, concurrent microservice architectures, and zero-knowledge security platforms, I would welcome the opportunity to discuss how my skill set aligns with your team's goals.

Please let me know if there are any additional details or work samples I can provide. Thank you for your time and consideration.

Best regards,
${activeProfile?.fullName || "Candidate"}
${activeProfile?.email || ""}`;

    setFollowupModal({
      isOpen: true,
      company: app.company,
      title: app.title,
      text: draftText,
    });
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(followupModal.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Kanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Application Funnel Tracker</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic pipeline Kanban tracking <span className="text-slate-200 font-semibold">{apps.length} active applications</span> for <span className="text-indigo-400 font-semibold">{activeProfile?.fullName || "Active Candidate"}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadApplications}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh Pipeline Applications"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shrink-0 shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? "Cancel" : "Track New Application"}</span>
            </button>
          </div>
        </div>

        {/* Add Application Form */}
        {isAdding && (
          <form onSubmit={handleAddApplication} className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Company Name (e.g. Stripe)"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
            <input
              type="text"
              placeholder="Job Title (e.g. Backend Engineer)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md"
            >
              Add To Pipeline
            </button>
          </form>
        )}
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {columns.map((col) => {
          const colApps = apps.filter((a) => a.status === col.id);
          return (
            <div
              key={col.id}
              className="p-3.5 rounded-2xl bg-[#0F172A]/60 border border-slate-800/80 flex flex-col justify-between space-y-3 min-h-[500px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                  <span className={`text-xs font-bold font-sans ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-md space-y-2.5"
                    >
                      <div>
                        <div className="text-[11px] font-mono text-indigo-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {app.company}
                        </div>
                        <h4 className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-2">
                          {app.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-sans text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {app.appliedDate}
                        </span>
                        {app.daysSilent >= 10 && (
                          <span className="text-rose-400 font-medium">
                            {app.daysSilent}d quiet
                          </span>
                        )}
                      </div>

                      {/* Direct Status Move Selector */}
                      <div>
                        <select
                          value={app.status}
                          onChange={(e) => handleDirectSetStatus(app.id, e.target.value as TrackedApplication["status"])}
                          className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-sans text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              Stage: {c.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Action Buttons: Prev / Next / Follow-Up */}
                      <div className="flex items-center justify-between gap-1 pt-1">
                        <button
                          onClick={() => handleRegressStatus(app.id)}
                          disabled={app.status === "SHORTLISTED"}
                          title="Move back to previous stage"
                          className="flex items-center gap-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[10px] font-sans transition-colors"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          <span>Prev</span>
                        </button>

                        {app.daysSilent >= 10 && (
                          <button
                            onClick={() => handleGenerateFollowup(app)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-sans transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Follow Up</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleAdvanceStatus(app.id)}
                          disabled={app.status === "OFFER"}
                          title="Advance to next stage"
                          className="flex items-center gap-0.5 px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-sans transition-colors"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Follow-Up Draft Modal */}
      {followupModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Follow-Up Email Draft: {followupModal.company}</span>
              </div>

              <button
                onClick={() => setFollowupModal({ ...followupModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                Close ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {followupModal.text}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-md shadow-indigo-600/20"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Draft Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
