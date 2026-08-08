"use client";

import { useProfileStore } from "@/store/useProfileStore";
import { UserCheck, ChevronDown } from "lucide-react";
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
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.08] hover:border-white/20 transition-colors shadow-sm group"
      >
        <div className="flex items-center justify-center w-5 h-5 rounded bg-zinc-800 text-white font-bold text-[10px] border border-white/10">
          {activeProfileSlug === "roushan" ? "RK" : "AR"}
        </div>

        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-white">
            {activeProfile ? activeProfile.fullName : "Loading..."}
          </div>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl backdrop-blur-xl z-50 overflow-hidden py-1">
          <div className="px-3 py-1.5 border-b border-white/[0.08] text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Switch Candidate Context
          </div>
          <button
            onClick={() => handleSelect("roushan")}
            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-900 transition-colors ${
              activeProfileSlug === "roushan" ? "bg-zinc-900 text-white font-semibold" : "text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px] border border-white/10">
                RK
              </div>
              <div>
                <div className="text-xs font-medium text-white">Roushan Kumar</div>
                <div className="text-[10px] font-mono text-zinc-400">Systems & Backend</div>
              </div>
            </div>
            {activeProfileSlug === "roushan" && <UserCheck className="w-3.5 h-3.5 text-white" />}
          </button>

          <button
            onClick={() => handleSelect("ayushi")}
            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-900 transition-colors ${
              activeProfileSlug === "ayushi" ? "bg-zinc-900 text-white font-semibold" : "text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-zinc-800 text-white flex items-center justify-center font-bold text-[10px] border border-white/10">
                AR
              </div>
              <div>
                <div className="text-xs font-medium text-white">Ayushi Raj</div>
                <div className="text-[10px] font-mono text-zinc-400">AI Systems & Full-Stack</div>
              </div>
            </div>
            {activeProfileSlug === "ayushi" && <UserCheck className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      )}
    </div>
  );
}
