"use client";

import React, { useState, useMemo } from "react";
import {
  Check,
  Copy,
  Code2,
  Sparkles,
  Layers,
  ListChecks,
  Building2,
  Briefcase,
  FileText,
  Award,
} from "lucide-react";

interface FormattedJobDescriptionProps {
  description: string;
}

// Common tech keywords to extract for quick tech stack tags
const TECH_KEYWORDS = [
  "TypeScript", "JavaScript", "Python", "React", "Next.js", "Node.js", "Node",
  "Go", "Golang", "Rust", "Java", "C++", "C#", ".NET", "Ruby", "Rails", "PHP",
  "PostgreSQL", "Postgres", "MySQL", "MongoDB", "Redis", "GraphQL", "REST", "API",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD", "Git",
  "PyTorch", "TensorFlow", "OpenAI", "LLM", "Tailwind", "CSS", "HTML", "Vue.js", "Vue",
  "FastAPI", "Express", "Django", "Flask", "Solidity", "Kafka", "Elasticsearch", "Linux"
];

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface StructSection {
  id: string;
  title: string;
  iconType: "info" | "role" | "responsibilities" | "requirements" | "benefits" | "general";
  paragraphs: string[];
  bullets: string[];
}

export function FormattedJobDescription({ description }: FormattedJobDescriptionProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"smart" | "raw">("smart");

  // Extract Tech Stack Badges
  const uniqueTech = useMemo(() => {
    if (!description) return [];
    const detectedTech = TECH_KEYWORDS.filter((tech) => {
      if (tech === "C++" || tech === "C#") {
        return description.toLowerCase().includes(tech.toLowerCase());
      }
      const escaped = escapeRegExp(tech);
      const regex = new RegExp(`(?:^|\\b)${escaped}(?:$|\\b)`, "i");
      return regex.test(description);
    });
    return Array.from(new Set(detectedTech));
  }, [description]);

  // Structural parsing engine that turns continuous text walls into organized sections
  const parsedSections = useMemo(() => {
    if (!description || description.trim().length === 0) return [];

    let text = description
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\r\n/g, "\n");

    // 1. Identify and mark inline section headers even when missing newline breaks
    const SECTION_MARKERS: Array<{ regex: RegExp; title: string; iconType: StructSection["iconType"] }> = [
      { regex: /\b(what we do|about us|about the company|company overview|who we are|the team)\b/gi, title: "About the Company", iconType: "info" },
      { regex: /\b(about the role|role overview|job overview|position summary|the opportunity|about this role)\b/gi, title: "Role Overview", iconType: "role" },
      { regex: /\b(what you'll do|what you will do|key responsibilities|responsibilities|your impact|your day-to-day|tasks|core duties)\b/gi, title: "Key Responsibilities", iconType: "responsibilities" },
      { regex: /\b(what we're looking for|what we are looking for|requirements|key requirements|who you are|skills needed|desired experience|minimum requirements)\b/gi, title: "Requirements & Skills", iconType: "requirements" },
      { regex: /\b(qualifications|basic qualifications|preferred qualifications|nice to have|bonus points|preferred skills)\b/gi, title: "Qualifications & Bonus Skills", iconType: "requirements" },
      { regex: /\b(what we offer|benefits|perks|compensation|why join us|our offer|what you get)\b/gi, title: "Benefits, Perks & Culture", iconType: "benefits" },
    ];

    // Pre-insert section markers
    for (const marker of SECTION_MARKERS) {
      text = text.replace(marker.regex, (match) => `\n\n###SECTION:${marker.title}:${marker.iconType}###\n\n`);
    }

    const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    const result: StructSection[] = [];

    let currentSection: StructSection = {
      id: "overview",
      title: "Role Overview",
      iconType: "role",
      paragraphs: [],
      bullets: [],
    };

    for (const block of blocks) {
      const sectionMatch = block.match(/^###SECTION:(.*?):(.*?)$/);
      if (sectionMatch) {
        if (currentSection.paragraphs.length > 0 || currentSection.bullets.length > 0) {
          result.push(currentSection);
        }
        currentSection = {
          id: sectionMatch[1].toLowerCase().replace(/[^a-z0-9]/g, "-"),
          title: sectionMatch[1],
          iconType: sectionMatch[2] as StructSection["iconType"],
          paragraphs: [],
          bullets: [],
        };
        continue;
      }

      // Check if block contains explicit bullet points, inline bullet markers, or sub-lines
      const rawLines = block.split(/\n|\s+•\s+|\s+-\s+|\s+\*\s+/);
      const lines = rawLines.map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const isBullet = /^([•\-*]|(\d+\.))\s+/.test(line);
        if (isBullet) {
          currentSection.bullets.push(line.replace(/^([•\-*]|(\d+\.))\s+/, ""));
        } else if (line.length < 80 && line.endsWith(":")) {
          // Additional sub-header line
          currentSection.paragraphs.push(line);
        } else {
          // If paragraph contains multiple distinct sentences, split into bullet points if action-oriented
          const sentences = line.match(/[^.!?]+[.!?]+/g) || [line];
          if (sentences.length > 2 && (currentSection.iconType === "responsibilities" || currentSection.iconType === "requirements")) {
            for (const s of sentences) {
              const cleanS = s.trim();
              if (cleanS.length > 15) {
                currentSection.bullets.push(cleanS);
              }
            }
          } else {
            currentSection.paragraphs.push(line);
          }
        }
      }
    }

    if (currentSection.paragraphs.length > 0 || currentSection.bullets.length > 0) {
      result.push(currentSection);
    }

    return result;
  }, [description]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!description || description.trim().length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.08] text-sm text-zinc-400 italic text-center">
        No detailed description text provided for this posting. Use the direct link to view the official ATS posting.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Bar & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11131a] p-2.5 rounded-2xl border border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setViewMode("smart")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "smart"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured Smart View</span>
          </button>

          <button
            onClick={() => setViewMode("raw")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "raw"
                ? "bg-zinc-800 text-white shadow-md border border-white/10"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Original Full Text</span>
          </button>
        </div>

        <button
          onClick={handleCopySummary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 text-xs font-medium text-zinc-200 transition-colors shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-mono font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy Description</span>
            </>
          )}
        </button>
      </div>

      {/* Detected Tech Stack Tags Cloud */}
      {uniqueTech.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#11131a] border border-white/[0.08] space-y-2.5 shadow-sm">
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-wider flex items-center gap-2 font-bold">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Detected Tech Stack & Keywords ({uniqueTech.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueTech.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-mono font-medium hover:bg-indigo-500/20 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View Mode: Structured Smart View */}
      {viewMode === "smart" ? (
        <div className="space-y-4">
          {parsedSections.map((sec, idx) => (
            <div
              key={`${sec.id}-${idx}`}
              className="p-5 rounded-2xl bg-[#11131a] border border-white/[0.08] space-y-3 shadow-sm hover:border-white/[0.14] transition-colors"
            >
              <div className="text-sm font-bold text-white flex items-center gap-2.5 pb-2.5 border-b border-white/[0.08]">
                {sec.iconType === "info" && (
                  <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                )}
                {sec.iconType === "role" && (
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
                {sec.iconType === "responsibilities" && (
                  <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                )}
                {sec.iconType === "requirements" && (
                  <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <ListChecks className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
                {sec.iconType === "benefits" && (
                  <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                )}
                <span className="tracking-tight">{sec.title}</span>
              </div>

              {/* Paragraphs */}
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-sm text-zinc-200 leading-relaxed font-sans">
                  {p}
                </p>
              ))}

              {/* Bullets */}
              {sec.bullets.length > 0 && (
                <ul className="space-y-2 pt-1">
                  {sec.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-3 text-sm text-zinc-200 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0 shadow-sm" />
                      <span className="flex-1 font-sans">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* View Mode: Original Raw Text */
        <div className="p-6 rounded-2xl bg-[#11131a] border border-white/[0.08] text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans shadow-sm">
          {description}
        </div>
      )}
    </div>
  );
}
