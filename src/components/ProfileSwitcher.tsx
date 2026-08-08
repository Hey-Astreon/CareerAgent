"use client";

import { useProfileStore } from "@/store/useProfileStore";
import { UserCheck, ChevronDown, User } from "lucide-react";
import { useState, useEffect } from "react";

export function ProfileSwitcher() {
  const { activeProfileSlug, activeProfile, setAllProfiles, setActiveProfileSlug } =
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
        className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-sm group"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-semibold text-xs border border-indigo-500/30">
          {activeProfileSlug === "roushan" ? "RK" : "AR"}
        </div>

        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-slate-200">
            {activeProfile ? activeProfile.fullName : "Loading..."}
          </div>
          <div className="text-[10px] font-mono text-slate-400 -mt-0.5">
            {activeProfileSlug === "roushan" ? "Backend & Systems" : "AI & Full-Stack"}
          </div>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl z-50 overflow-hidden py-1">
          <div className="px-3 py-2 border-b border-slate-800/80 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Switch Candidate Context
          </div>
          <button
            onClick={() => handleSelect("roushan")}
            className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
              activeProfileSlug === "roushan" ? "bg-indigo-500/10 text-indigo-300 font-semibold" : "text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                RK
              </div>
              <div>
                <div className="text-xs font-medium text-slate-200">Roushan Kumar</div>
                <div className="text-[10px] font-mono text-slate-400">Systems & Backend Architect</div>
              </div>
            </div>
            {activeProfileSlug === "roushan" && <UserCheck className="w-4 h-4 text-indigo-400" />}
          </button>

          <button
            onClick={() => handleSelect("ayushi")}
            className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
              activeProfileSlug === "ayushi" ? "bg-violet-500/10 text-violet-300 font-semibold" : "text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-xs border border-violet-500/30">
                AR
              </div>
              <div>
                <div className="text-xs font-medium text-slate-200">Ayushi Raj</div>
                <div className="text-[10px] font-mono text-slate-400">AI Systems & Full-Stack</div>
              </div>
            </div>
            {activeProfileSlug === "ayushi" && <UserCheck className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
