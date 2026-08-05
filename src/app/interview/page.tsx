"use client";

import { useProfileStore } from "@/store/useProfileStore";
import { Mic, Sparkles, Send, CheckCircle2, ShieldCheck, Terminal } from "lucide-react";
import { useState } from "react";

interface RoleplayMessage {
  sender: "interviewer" | "candidate";
  text: string;
}

export default function InterviewStudioPage() {
  const { activeProfile } = useProfileStore();
  const [messages, setMessages] = useState<RoleplayMessage[]>([
    {
      sender: "interviewer",
      text: `Hello ${activeProfile?.fullName || "Candidate"}, welcome to your technical interview session! I see your impressive background in systems engineering and full-stack API gateways. Could you start by walking me through the architecture of your flagship project and a major engineering challenge you solved?`,
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = () => {
    if (!inputVal.trim()) return;

    const userMsg: RoleplayMessage = { sender: "candidate", text: inputVal };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsThinking(true);

    setTimeout(() => {
      const aiReply: RoleplayMessage = {
        sender: "interviewer",
        text: `That's a very solid breakdown of your low-latency microservice architecture and concurrency safety! How did you approach automated testing (xUnit/PyTest/Jest) and database transaction integrity under peak load?`,
      };
      setMessages((prev) => [...prev, aiReply]);
      setIsThinking(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">STAR Interview Studio</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Behavioral question mapping, STAR story preparation, and interactive AI mock interview roleplay simulator.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: STAR Stories & Context Pack */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>STAR Story Inventories</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-cyan-300">Commonwealth Bank Simulation</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">S/T:</strong> Silent data overwrite bugs in C# financial controllers.<br />
                  <strong className="text-slate-300">A:</strong> Applied $set atomic operators & React Redux state hooks.<br />
                  <strong className="text-slate-300">R:</strong> High transactional consistency & xUnit test suites.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-cyan-300">Y Combinator Shiptivity Simulation</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">S/T:</strong> Key collisions & slow Kanban re-rendering.<br />
                  <strong className="text-slate-300">A:</strong> SQLite atomic priority reordering & Dragula hooks.<br />
                  <strong className="text-slate-300">R:</strong> 30% reduction in UI re-renders & OpenSSL fix.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-cyan-300">Walmart USA Simulation</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">S/T:</strong> Retail inventory queue indexing bottlenecks.<br />
                  <strong className="text-slate-300">A:</strong> Generic K-ary Max Heap & 3NF database schemas.<br />
                  <strong className="text-slate-300">R:</strong> 35% queue indexing acceleration & Python ETL pipelines.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Mock Interview Roleplay Terminal */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xl space-y-4 flex flex-col justify-between min-h-[550px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Interactive Roleplay Simulator</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
              Session Active
            </span>
          </div>

          {/* Dialogue Log */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                  msg.sender === "interviewer"
                    ? "bg-slate-950 border border-slate-800 text-slate-300 mr-auto"
                    : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 ml-auto font-sans"
                }`}
              >
                <div className="font-mono text-[10px] text-slate-400 mb-1">
                  {msg.sender === "interviewer" ? "AI Technical Interviewer" : activeProfile?.fullName || "Candidate"}
                </div>
                {msg.text}
              </div>
            ))}

            {isThinking && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono animate-pulse w-fit">
                Interviewer is analyzing response...
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
            <input
              type="text"
              placeholder="Type your interview response using STAR method..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors font-sans"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition-all duration-200 shadow-md shadow-cyan-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
