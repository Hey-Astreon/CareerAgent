"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  Target,
  FileText,
  Kanban,
  Sparkles,
} from "lucide-react";

const navItems = [
  { name: "Live Discovery Feed", href: "/", icon: Globe, badge: "⚡ Live" },
  { name: "Fit & Match Studio", href: "/match", icon: Target },
  { name: "Application Drafter", href: "/drafter", icon: FileText },
  { name: "Funnel Tracker", href: "/tracker", icon: Kanban },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950/60 border-r border-slate-800/60 p-4 flex flex-col justify-between hidden md:flex shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-3 text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-cyan-400" : "text-slate-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>High-Velocity Mode</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Monitoring Greenhouse, Lever, Ashby, YC Jobs, and LinkedIn Remote.
        </p>
      </div>
    </aside>
  );
}
