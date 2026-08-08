"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  Target,
  FileText,
  Kanban,
  Cpu,
} from "lucide-react";

const navItems = [
  { name: "Live Discovery Feed", href: "/", icon: Globe, badge: "Live" },
  { name: "Fit & Match Studio", href: "/match", icon: Target },
  { name: "Application Drafter", href: "/drafter", icon: FileText },
  { name: "Funnel Tracker", href: "/tracker", icon: Kanban },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#090D16]/90 border-r border-slate-800/70 p-4 flex flex-col justify-between hidden md:flex shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
          Platform Workspace
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 ${
                  isActive
                    ? "bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-indigo-400" : "text-slate-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>High-Velocity Scrapers</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          Ingesting Greenhouse, Lever, Ashby, YC Jobs, and LinkedIn Remote.
        </p>
      </div>
    </aside>
  );
}
