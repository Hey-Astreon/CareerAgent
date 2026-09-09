"use client";

import { ProfileSwitcher } from "./ProfileSwitcher";
import { Command, Search } from "lucide-react";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/": "Discovery workspace",
  "/match": "Match Studio",
  "/resume-builder": "Complete Application Kit",
  "/drafter": "Complete Application Kit",
};

export function Header() {
  const pathname = usePathname();
  return (
    <header className="ce-header">
      <div className="ce-header-title">
        <b>RCMS</b>
        <span>{titles[pathname] || "Candidate workspace"}</span>
      </div>
      <div className="ce-command" aria-label="Search shortcut hint">
        <Search className="w-3.5 h-3.5" />
        <span>Search roles, companies, or skills</span>
        <kbd>
          <Command className="inline w-2.5 h-2.5" />K
        </kbd>
      </div>
      <div className="ml-auto">
        <ProfileSwitcher />
      </div>
    </header>
  );
}
