"use client";

import { ProfileSwitcher } from "./ProfileSwitcher";
import { Command, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const tabs = [
    { name: "Feed", href: "/" },
    { name: "Match Studio", href: "/match" },
    { name: "Kit Drafter", href: "/drafter" },
    { name: "Funnel Pipeline", href: "/tracker" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 lg:px-8 h-14 flex items-center justify-between">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white text-black font-black text-xs shadow-md transition-transform group-hover:scale-105">
            <Zap className="w-4 h-4 fill-current text-black" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
              CAREER<span className="text-zinc-400 font-normal">AGENT</span>
            </span>
          </div>
        </Link>

        {/* Center-Left: Segmented Nav Tabs */}
        <nav className="hidden md:flex items-center p-1 rounded-lg bg-zinc-900/80 border border-white/[0.08]">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800 text-white shadow-sm font-semibold border border-white/10"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Actions: Command Search Badge & Candidate Context */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/[0.08] text-zinc-400 text-xs font-mono">
          <Command className="w-3 h-3 text-zinc-400" />
          <span>K</span>
          <span className="text-zinc-400 text-[10px]">Command Palette</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Engine Active</span>
        </div>

        <ProfileSwitcher />
      </div>
    </header>
  );
}
