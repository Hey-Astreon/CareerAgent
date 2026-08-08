"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  Target,
  FileText,
  Kanban,
} from "lucide-react";

const navItems = [
  { name: "Live Discovery Feed", href: "/", icon: Globe, badge: "Live" },
  { name: "Fit & Match Studio", href: "/match", icon: Target },
  { name: "Application Kit Drafter", href: "/drafter", icon: FileText },
  { name: "Funnel Pipeline", href: "/tracker", icon: Kanban },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#09090b] border-r border-white/[0.08] p-3 flex flex-col justify-between hidden md:flex shrink-0 min-h-[calc(100vh-3.5rem)]">
      <div className="space-y-4">
        <div className="px-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white font-semibold border border-white/10 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-zinc-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3 py-2 text-[11px] font-mono text-zinc-500 border-t border-white/[0.06] flex items-center justify-between">
        <span>CareerAgent v1.0</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
    </aside>
  );
}
