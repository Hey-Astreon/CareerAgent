"use client";

import { ProfileSwitcher } from "./ProfileSwitcher";
import { Zap, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-4 lg:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-lg shadow-lg shadow-cyan-500/20">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            CAREER<span className="text-cyan-400">AGENT</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">
            Local AI Career Operating System
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local Engine Active</span>
        </div>

        <ProfileSwitcher />
      </div>
    </header>
  );
}
