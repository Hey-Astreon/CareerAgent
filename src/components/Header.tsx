"use client";

import { ProfileSwitcher } from "./ProfileSwitcher";
import { Terminal, ShieldCheck } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D16]/80 backdrop-blur-xl border-b border-slate-800/70 px-4 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-sm shadow-md shadow-indigo-500/20">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 font-sans">
            CAREER<span className="text-indigo-400 font-extrabold">AGENT</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 block -mt-0.5 tracking-wide">
            Autonomous Career Operating System
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Engine Active</span>
        </div>

        <ProfileSwitcher />
      </div>
    </header>
  );
}
