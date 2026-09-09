"use client";

import { useProfileStore } from "@/store/useProfileStore";
import { UserCheck, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export function ProfileSwitcher() {
  const { activeProfileSlug, activeProfile, setAllProfiles, setActiveProfileSlug } = useProfileStore();
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { async function fetchProfiles() { try { const res = await fetch("/api/profiles"); const data = await res.json(); if (data.success && data.profiles) setAllProfiles(data.profiles); } catch (error) { console.error("Failed to load profiles:", error); } } fetchProfiles(); }, [setAllProfiles]);
  const handleSelect = (slug: "roushan" | "ayushi") => { setActiveProfileSlug(slug); setIsOpen(false); };
  const choices: Array<{ slug: "roushan" | "ayushi"; initials: string; name: string; role: string }> = [{ slug: "roushan", initials: "RK", name: "Roushan Kumar", role: "Systems & Backend" }, { slug: "ayushi", initials: "AR", name: "Ayushi Raj", role: "AI Systems & Full-Stack" }];
  return <div className="relative"><button onClick={() => setIsOpen((open) => !open)} className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-left shadow-sm transition-colors hover:border-[var(--blue)]"><span className="grid h-6 w-6 place-items-center rounded bg-[var(--blue-soft)] font-mono text-[9px] font-bold text-[var(--blue)]">{activeProfileSlug === "roushan" ? "RK" : "AR"}</span><span className="hidden sm:block"><b className="block max-w-32 truncate text-[11px] text-[var(--ink)]">{activeProfile?.fullName || "Loading profile"}</b><small className="block mt-0.5 font-mono text-[7px] tracking-wide text-[var(--muted)]">ACTIVE CANDIDATE</small></span><ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" /></button>{isOpen && <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_38px_rgba(21,35,56,.16)]"><div className="border-b border-[var(--line)] px-3 py-2 font-mono text-[8px] font-bold tracking-[.12em] text-[var(--muted)]">SWITCH CANDIDATE CONTEXT</div>{choices.map((choice) => <button key={choice.slug} onClick={() => handleSelect(choice.slug)} className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-muted)] ${activeProfileSlug === choice.slug ? "bg-[var(--blue-soft)]" : ""}`}><span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded bg-[var(--surface-muted)] font-mono text-[9px] font-bold text-[var(--ink)]">{choice.initials}</span><span><b className="block text-[11px] text-[var(--ink)]">{choice.name}</b><small className="mt-0.5 block text-[9px] text-[var(--muted)]">{choice.role}</small></span></span>{activeProfileSlug === choice.slug && <UserCheck className="h-3.5 w-3.5 text-[var(--blue)]" />}</button>)}</div>}</div>;
}

