"use client";

import { useProfileStore } from "@/store/useProfileStore";
import { UserCheck, Sparkles, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export function ProfileSwitcher() {
  const { activeProfileSlug, activeProfile, allProfiles, setActiveProfileSlug, setAllProfiles } =
    useProfileStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const res = await fetch("/api/profiles");
        const data = await res.json();
        if (data.success && data.profiles) {
          setAllProfiles(data.profiles);
        }
      } catch (err) {
        console.error("Failed to load profiles:", err);
      }
    }
    fetchProfiles();
  }, [setAllProfiles]);

  const handleSelect = (slug: "roushan" | "ayushi") => {
    setActiveProfileSlug(slug);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-200 shadow-md shadow-cyan-950/20 group"
      >
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-sm">
          {activeProfileSlug === "roushan" ? "RK" : "AR"}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
        </div>

        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
            {activeProfile ? activeProfile.fullName : "Loading..."}
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-[10px] font-mono text-cyan-400/90">
            {activeProfileSlug === "roushan" ? "Backend & Systems" : "AI & Full-Stack"}
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-xl backdrop-blur-xl z-50 overflow-hidden py-1">
          <div className="px-3 py-2 border-b border-slate-800/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Switch Candidate Context
          </div>
          <button
            onClick={() => handleSelect("roushan")}
            className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
              activeProfileSlug === "roushan" ? "bg-cyan-500/10 text-cyan-300 font-semibold" : "text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                RK
              </div>
              <div>
                <div className="text-xs">Roushan Kumar</div>
                <div className="text-[10px] font-mono text-slate-400">Systems & Backend Architect</div>
              </div>
            </div>
            {activeProfileSlug === "roushan" && <UserCheck className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => handleSelect("ayushi")}
            className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
              activeProfileSlug === "ayushi" ? "bg-cyan-500/10 text-cyan-300 font-semibold" : "text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                AR
              </div>
              <div>
                <div className="text-xs">Ayushi Raj</div>
                <div className="text-[10px] font-mono text-slate-400">AI Systems & Full-Stack</div>
              </div>
            </div>
            {activeProfileSlug === "ayushi" && <UserCheck className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
