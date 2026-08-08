"use client";

import { ProfileSwitcher } from "./ProfileSwitcher";
import { Command, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const tabs = [
    { name: "Live Feed", href: "/" },
    { name: "Match Studio", href: "/match" },
    { name: "Kit Drafter", href: "/drafter" },
    { name: "Funnel Pipeline", href: "/tracker" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 lg:px-8 h-14 flex items-center justify-between">
      {/* Brand Identity & Nav */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white text-black font-bold text-xs shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-current text-black" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            CareerAgent
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  isActive
                    ? "bg-zinc-800/80 text-white font-semibold border border-white/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 font-medium"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Actions: Command Search Badge & Candidate Profile Switcher */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-white/[0.08] text-zinc-400 text-xs font-mono">
          <Command className="w-3 h-3 text-zinc-500" />
          <span>K</span>
        </div>

        <ProfileSwitcher />
      </div>
    </header>
  );
}
