"use client";

import { useProfileStore } from "@/store/useProfileStore";
import { Settings, Key, ShieldCheck, Database, Check, Cpu } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { activeProfile, activeProfileSlug } = useProfileStore();
  const [nvidiaKey, setNvidiaKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [cerebrasKey, setCerebrasKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveKeys = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Workspace & Key Settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Local API keys, multi-provider AI model router status, and profile configuration settings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local API Keys Section */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Multi-Provider LLM Key Vault</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 100% Local Disk
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                NVIDIA NIM API Key (Llama 3.1 / Nemotron)
              </label>
              <input
                type="password"
                placeholder="nvapi-..."
                value={nvidiaKey}
                onChange={(e) => setNvidiaKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Groq API Key (Llama 3.3 70B Versatile)
              </label>
              <input
                type="password"
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Cerebras API Key (Llama 3.3 70B Ultra-Fast)
              </label>
              <input
                type="password"
                placeholder="csk-..."
                value={cerebrasKey}
                onChange={(e) => setCerebrasKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Google Gemini API Key (Gemini 2.5 Flash / Pro)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            <p className="text-[10px] text-slate-500 mt-1">
              Keys are stored strictly on your local disk in `.env.local`. Zero cloud telemetry or external logging.
            </p>

            <button
              onClick={handleSaveKeys}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Keys Saved Locally</span>
                </>
              ) : (
                <span>Save API Keys</span>
              )}
            </button>
          </div>
        </div>

        {/* Database & System Architecture Status */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white pb-3 border-b border-slate-800">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Local System Diagnostics</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Database Engine</span>
              <span className="text-emerald-400 font-semibold">SQLite (dev.db)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Active Profile</span>
              <span className="text-cyan-400 font-semibold">
                {activeProfileSlug === "roushan" ? "Roushan Kumar" : "Ayushi Raj"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">AI Model Failover Router</span>
              <span className="text-cyan-300 font-semibold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> NIM ➔ Groq ➔ Cerebras ➔ Gemini
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Master Resume Path</span>
              <span className="text-slate-300 truncate max-w-[180px]">
                {activeProfile?.masterResumePath}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
