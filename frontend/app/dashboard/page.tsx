"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/lib/api";
import {
  LayoutDashboard, FileText, Mic2, BookOpen, Trophy, Settings, LogOut,
  Sparkles, ArrowRight, Send, Mic, Plus, X, Loader2, Star,
  TrendingUp, CheckCircle2, Clock, Target, ChevronRight, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMsg { role: "user" | "assistant"; content: string; }

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "/dashboard",        key: "dashboard" },
  { icon: FileText,        label: "Resume ATS",  href: "/resume",           key: "resume" },
  { icon: Mic2,            label: "Mock Interview", href: "/interview/setup", key: "interview" },
  { icon: BookOpen,        label: "Question Bank", href: "/interview/setup", key: "questions" },
  { icon: Trophy,          label: "Leaderboard", href: "/dashboard",        key: "leaderboard" },
];

const QUICK_ACTIONS = [
  { label: "🔬 Deep Research",    prompt: "Explain Google PageRank algorithm in simple terms." },
  { label: "📝 Resume Tips",      prompt: "How do I boost my ATS resume score for Backend Developer roles?" },
  { label: "🧮 Aptitude Puzzle",  prompt: "Give me a Infosys-style coding-decoding pattern problem with solution." },
  { label: "💡 Explain Recursion",prompt: "Explain tail recursion vs memoization with JavaScript examples." },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();
  const { checkActiveSession, activeSession } = useInterviewStore();

  const [stats, setStats] = useState<any>(null);
  const [fetchingStats, setFetchingStats] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! I'm your AI Career Coach. Ask me anything about interviews, resumes, or aptitude prep!" }
  ]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      checkActiveSession();
      api.get("/dashboard/stats")
        .then((res: any) => setStats(res.data))
        .catch(() => {})
        .finally(() => setFetchingStats(false));
    }
  }, [isAuthenticated, checkActiveSession]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatOpen]);

  const sendChat = async (text?: string) => {
    const msg = text || chatInput;
    if (!msg.trim() || chatLoading) return;
    setChatHistory(prev => [...prev, { role: "user", content: msg }]);
    setChatInput(""); setChatOpen(true); setChatLoading(true);
    try {
      const res = await api.post("/chatbot/chat", { message: msg, history: chatHistory });
      setChatHistory(prev => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally { setChatLoading(false); }
  };

  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Award className="w-6 h-6 text-violet-400 animate-pulse" />
        </div>
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const firstName = user.full_name.split(" ")[0];
  const targetRole = user.profile?.preferred_job_role || "Software Engineer";
  const userLevel = stats?.user_level || 1;
  const userXP = stats?.user_xp || 0;
  const xpPercent = Math.min(((userXP % 200) / 200) * 100, 100);

  return (
    <div className="min-h-screen flex bg-[#09090b] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-[72px] xl:w-64 border-r border-white/[0.04] bg-[#0c0c10] flex flex-col py-6 shrink-0 transition-all duration-300">
        {/* Brand */}
        <div className="px-4 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div className="hidden xl:block overflow-hidden">
            <p className="font-black text-sm text-white tracking-tight">SAN AI</p>
            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Interview Prep</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ icon: Icon, label, href, key }) => {
            const isActive = key === "dashboard";
            return (
              <button key={key} onClick={() => router.push(href)}
                data-tooltip={label}
                className={`sidebar-item xl:w-full xl:px-3 xl:gap-3 xl:justify-start ${isActive ? "active" : ""} group`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden xl:block text-sm font-semibold truncate">{label}</span>
                {isActive && <ChevronRight className="hidden xl:block w-3.5 h-3.5 ml-auto opacity-50" />}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="px-3 space-y-2 border-t border-white/[0.04] pt-4">
          <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/[0.04] transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shrink-0">
              {firstName.charAt(0)}
            </div>
            <div className="hidden xl:block overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={async () => { await logout(); router.push("/"); }}
            data-tooltip="Sign Out"
            className="sidebar-item xl:w-full xl:px-3 xl:gap-3 xl:justify-start hover:bg-red-950/30 hover:border-red-500/20 hover:text-red-400">
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden xl:block text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header Bar */}
        <header className="h-16 px-6 xl:px-8 flex items-center justify-between border-b border-white/[0.04] bg-[#09090b]/80 backdrop-blur-sm shrink-0">
          <div>
            <h1 className="text-base font-black text-white tracking-tight">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {firstName} 👋
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Target: <span className="text-violet-400 font-semibold">{targetRole}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* XP Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-violet-600/10 border border-violet-500/20">
              <Star className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
              <span className="text-xs font-bold text-violet-300">Lv {userLevel} · {userXP} XP</span>
            </div>
            <button onClick={() => sendChat("How do I unlock Pro plan features?")}
              className="btn-primary flex items-center gap-2 py-2 px-4 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Upgrade Pro
            </button>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 overflow-y-auto p-6 xl:p-8 space-y-8">

          {/* ── Stats Row ── */}
          {!fetchingStats && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { icon: FileText,   label: "Resume Score",  value: `${stats?.ats_score ?? 0}%`,   color: "text-violet-400", bg: "bg-violet-500/10" },
                { icon: Target,     label: "Interviews Done",value: stats?.total_sessions ?? 0,   color: "text-teal-400",   bg: "bg-teal-500/10" },
                { icon: TrendingUp, label: "Avg. Score",    value: `${stats?.avg_score ?? 0}%`,   color: "text-amber-400",  bg: "bg-amber-500/10" },
                { icon: CheckCircle2,label:"Badges Earned", value: stats?.badges?.filter((b:any)=>b.earned).length ?? 0, color: "text-rose-400", bg: "bg-rose-500/10" },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="stat-card group cursor-default">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ── XP Progress Bar ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card-flat rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-violet-400 fill-violet-400" />
                <span className="text-sm font-bold text-white">Level {userLevel} Progress</span>
              </div>
              <span className="text-xs text-gray-500 font-semibold">{userXP % 200} / 200 XP to next level</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
              </motion.div>
            </div>
          </motion.div>

          {/* ── Action Cards ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: "ATS Resume Scanner",
                desc: "Optimize keywords, formatting, and beat applicant tracking systems.",
                tag: "Fast Start",
                href: "/resume",
                color: "from-violet-600/20 to-violet-800/10",
                border: "hover:border-violet-500/40",
                badge: "badge-violet",
                icon: FileText,
                iconColor: "text-violet-400",
                iconBg: "bg-violet-500/10",
              },
              {
                title: "AI Mock Interview",
                desc: "Adaptive Q&A with real-time feedback. Level up your interview skills.",
                tag: "Start Prep",
                href: "/interview/setup",
                color: "from-teal-600/20 to-teal-800/10",
                border: "hover:border-teal-500/40",
                badge: "badge-teal",
                icon: Mic2,
                iconColor: "text-teal-400",
                iconBg: "bg-teal-500/10",
              },
              {
                title: "MNC Aptitude Sheets",
                desc: "700+ quant, logical, and DSA questions from Google, Amazon, TCS & more.",
                tag: "Practice",
                href: "/interview/setup",
                color: "from-amber-600/20 to-amber-800/10",
                border: "hover:border-amber-500/40",
                badge: "badge-amber",
                icon: BookOpen,
                iconColor: "text-amber-400",
                iconBg: "bg-amber-500/10",
              }
            ].map(({ title, desc, tag, href, color, border, badge, icon: Icon, iconColor, iconBg }) => (
              <motion.div key={title}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => router.push(href)}
                className={`relative p-6 rounded-2xl bg-gradient-to-br ${color} border border-white/[0.06] ${border} cursor-pointer overflow-hidden group transition-all duration-300`}
              >
                <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="font-black text-white text-sm mb-2 group-hover:text-white transition-colors">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{desc}</p>
                <div className="flex items-center justify-between">
                  <span className={`badge ${badge}`}>{tag}</span>
                  <ArrowRight className={`w-4 h-4 ${iconColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200`} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── AI Chat Console ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card-flat rounded-3xl overflow-hidden">
            {/* Console Header */}
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">AI Career Coach</p>
                  <p className="text-[10px] text-gray-600">Powered by OpenRouter · Always on</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-[10px] text-teal-400 font-bold">Online</span>
              </div>
            </div>

            {/* Input + Quick Actions */}
            <div className="p-5 space-y-3">
              <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="flex items-center gap-3">
                <button type="button" onClick={() => sendChat("Give me a custom logic puzzle")}
                  className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] flex items-center justify-center text-gray-500 hover:text-gray-300 transition-all shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything — interview tips, aptitude puzzles, resume help…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  disabled={chatLoading}
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" className="w-9 h-9 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-white/[0.07] flex items-center justify-center text-gray-600 hover:text-gray-400 transition-all">
                    <Mic className="w-4 h-4" />
                  </button>
                  <button type="submit" disabled={!chatInput.trim() || chatLoading}
                    className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center text-white transition-all active:scale-95">
                    {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              {/* Quick Action Pills */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-white/[0.04]">
                {QUICK_ACTIONS.map((qa) => (
                  <button key={qa.label} onClick={() => sendChat(qa.prompt)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] text-xs font-semibold text-gray-400 hover:text-white transition-all active:scale-95">
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── Chat Slide-Over ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
            onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}>
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-full max-w-md h-full bg-[#0d0d11] border-l border-white/[0.06] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">AI Career Coach</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-[10px] text-teal-400 font-bold">Online</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)}
                  className="w-9 h-9 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Log */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {chatHistory.map((msg, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0 mt-1 mr-2">
                        <Sparkles className="w-3 h-3 text-violet-400" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-tr-sm"
                        : "bg-white/[0.05] border border-white/[0.06] text-gray-200 rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start gap-2 items-center">
                    <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3 h-3 text-violet-400" />
                    </div>
                    <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                      <span className="text-xs text-gray-500">Coach is typing…</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={(e) => { e.preventDefault(); sendChat(); }}
                className="p-4 border-t border-white/[0.05] flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a follow-up…"
                  className="glass-input flex-1 py-2.5 text-xs" />
                <button type="submit"
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white transition-all active:scale-95">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
