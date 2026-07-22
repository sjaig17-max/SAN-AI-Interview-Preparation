"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/lib/api";
import { 
  Plus, Search, Compass, Clock, Send, Mic, Sparkles, 
  ArrowUpRight, Layout, Code2, Calendar, FileText, 
  Trophy, LogOut, Loader2, Star, Award, CheckCircle2, BarChart3, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();
  const { checkActiveSession, activeSession } = useInterviewStore();

  const [stats, setStats] = useState<any>(null);
  const [fetchingStats, setFetchingStats] = useState(true);

  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! I am your AI Coach. Click any action pill or ask me a custom question below!" }
  ]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      checkActiveSession();
      api.get("/dashboard/stats")
        .then((res: any) => {
          setStats(res.data);
        })
        .catch((err: any) => console.error("Error fetching stats:", err))
        .finally(() => setFetchingStats(false));
    }
  }, [isAuthenticated, checkActiveSession]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, chatOpen]);

  const handleStartInterview = async () => {
    if (activeSession) {
      router.push("/interview");
    } else {
      router.push("/interview/setup");
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const queryText = customText || chatInput;
    if (!queryText.trim() || chatLoading) return;

    setChatHistory((prev) => [...prev, { role: "user", content: queryText }]);
    setChatInput("");
    setChatOpen(true);
    setChatLoading(true);

    try {
      const historyPayload = chatHistory.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post("/chatbot/chat", {
        message: queryText,
        history: historyPayload
      });
      setChatHistory((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble parsing that. Please try asking again." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (isLoading || fetchingStats || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading analysis charts...</p>
        </div>
      </div>
    );
  }

  // Calculate Level and XP percentage
  const userXP = stats?.user_xp || 100;
  const userLevel = stats?.user_level || 1;
  const xpProgress = ((userXP % 200) / 200) * 100;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 flex items-center justify-center p-4 md:p-8 relative overflow-hidden select-none">
      {/* Background ambient glows matching the screenshot style */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-200/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-sky-400/10 blur-[120px] pointer-events-none" />

      {/* Main Container Card (White canvas screen matching screenshot layout) */}
      <div className="w-full max-w-6xl h-[650px] md:h-[750px] bg-white/90 border border-white/40 rounded-[32px] shadow-2xl flex overflow-hidden backdrop-blur-md relative">
        
        {/* Narrow Sidebar Layout */}
        <aside className="w-20 border-r border-gray-200 bg-gray-50/70 flex flex-col justify-between items-center py-6 shrink-0">
          <div className="flex flex-col gap-6 items-center">
            {/* Top Logo - Custom Black Badge matching screenshot bottom left logo */}
            <div 
              onClick={() => router.push("/dashboard")}
              className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/20 cursor-pointer hover:scale-105 transition-all"
            >
              <span className="text-white font-black text-xl italic select-none">N</span>
            </div>

            <div className="h-px w-8 bg-gray-200" />

            {/* Sidebar Buttons */}
            <nav className="flex flex-col gap-3">
              <button 
                onClick={() => router.push("/dashboard")}
                title="Dashboard"
                className="w-11 h-11 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-800 hover:bg-gray-100 hover:text-black transition-all"
              >
                <Layout className="w-5 h-5" />
              </button>
              <button 
                onClick={() => router.push("/resume")}
                title="ATS Resume Scan"
                className="w-11 h-11 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-black transition-all"
              >
                <FileText className="w-5 h-5" />
              </button>
              <button 
                onClick={handleStartInterview}
                title="AI Mock Interview"
                className="w-11 h-11 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-black transition-all"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button 
                onClick={() => router.push("/interview/setup")}
                title="Setup rounds"
                className="w-11 h-11 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-black transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </nav>
          </div>

          {/* Logout button */}
          <button 
            onClick={async () => { await logout(); router.push("/"); }}
            title="Sign Out"
            className="w-11 h-11 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-500 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </aside>

        {/* Main Work Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/40">
          
          {/* Header Area */}
          <header className="h-16 px-8 flex items-center justify-between border-b border-gray-100 bg-white/20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">SAN Assistant v2.6</span>
              <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-2 py-0.5 rounded-full">Pro</span>
            </div>
            
            <div className="text-xs font-semibold text-gray-600 font-mono tracking-tight hidden md:block">
              Daily Prep Round
            </div>

            {/* User details and upgrade button */}
            <div className="flex items-center gap-4">
              {/* XP status badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-xs font-bold text-violet-600">
                <Star className="w-3.5 h-3.5 fill-violet-500" />
                <span>Level {userLevel} ({userXP} XP)</span>
              </div>
              <button 
                onClick={() => handleChatSubmit(undefined, "How do I upgrade to Pro plan benefits?")}
                className="px-4 py-1.5 bg-black hover:opacity-90 active:scale-95 text-white font-bold rounded-full text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3 h-3" />
                Upgrade
              </button>
            </div>
          </header>

          {/* Canvas Workspace Viewport */}
          <div className="flex-1 p-6 md:p-10 flex flex-col justify-between min-h-0 overflow-y-auto relative">
            
            {/* Main Greeting Block */}
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-none">
                Hi {user.full_name.split(" ")[0]}, Ready to <br />
                <span className="bg-gradient-to-r from-violet-600 to-indigo-800 bg-clip-text text-transparent">
                  Achieve Great Things?
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Target Pathway: <span className="font-bold text-slate-700">{user.profile?.preferred_job_role || "Software Engineer"}</span> &bull; Status: <span className="text-violet-600 font-bold">Ready</span>
              </p>
            </div>

            {/* Dashboard 3-Card Grid with 3D CSS Mascot sitting on it */}
            <div className="relative mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* CSS 3D-styled Mascot sitting on Card 3 matching the screenshot */}
              <div className="absolute -top-[105px] right-8 z-30 pointer-events-none hidden md:block">
                <div className="relative flex flex-col items-center">
                  
                  {/* Mascot Speech Bubble */}
                  <div className="bg-[#121217] text-white text-[10px] font-bold py-1 px-2.5 rounded-full shadow-md relative -bottom-2 animate-bounce">
                    Hey there! 👋 Need a boost?
                  </div>

                  {/* SVG Robot Mascot */}
                  <svg className="w-24 h-24 drop-shadow-xl" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Body */}
                    <rect x="25" y="45" width="50" height="40" rx="20" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2"/>
                    <rect x="35" y="55" width="30" height="20" rx="10" fill="#cbd5e1"/>
                    {/* Head */}
                    <rect x="30" y="15" width="40" height="30" rx="15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
                    {/* Screen Face */}
                    <rect x="35" y="20" width="30" height="20" rx="8" fill="#0f172a"/>
                    {/* Glow happy eyes */}
                    <path d="M40 28 Q43 25 45 28" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round"/>
                    <path d="M55 28 Q58 25 60 28" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round"/>
                    {/* Hands */}
                    <circle cx="20" cy="55" r="7" fill="#cbd5e1"/>
                    <circle cx="80" cy="55" r="7" fill="#cbd5e1"/>
                  </svg>
                </div>
              </div>

              {/* CARD 1: ATS Resume Optimize */}
              <div 
                onClick={() => router.push("/resume")}
                className="p-6 bg-white border border-gray-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-200/50 rounded-2xl flex flex-col justify-between h-44 cursor-pointer group transition-all duration-300 relative overflow-hidden"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                  <Layout className="w-5 h-5" />
                </div>
                <div className="space-y-1 mt-4">
                  <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-violet-600 transition-colors">
                    Optimize keywords, fix formatting guidelines, and scan ATS alignment.
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fast Start</p>
                </div>
              </div>

              {/* CARD 2: AI Mock Interview */}
              <div 
                onClick={handleStartInterview}
                className="p-6 bg-white border border-gray-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-200/50 rounded-2xl flex flex-col justify-between h-44 cursor-pointer group transition-all duration-300 relative overflow-hidden"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1 mt-4">
                  <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-violet-600 transition-colors">
                    Practice adaptive technical and HR rounds. Level up your XP status.
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start Prep</p>
                </div>
              </div>

              {/* CARD 3: Aptitude Seeding */}
              <div 
                onClick={() => router.push("/interview/setup")}
                className="p-6 bg-white border border-gray-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-200/50 rounded-2xl flex flex-col justify-between h-44 cursor-pointer group transition-all duration-300 relative overflow-hidden"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1 mt-4">
                  <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-violet-600 transition-colors">
                    Master Quantitative & CS Technical questions frequently asked by top MNCs.
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Practice Sheets</p>
                </div>
              </div>

            </div>

            {/* Bottom Section - Integrated Chatbot Input & Action Pills */}
            <div className="mt-8 space-y-4">
              
              {/* Top meta-label bar */}
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2">
                <span>Unlock more with Pro Plan</span>
                <span>Powered by Assistant v2.6</span>
              </div>

              {/* Styled Chatbox Input Wrapper matching screenshot */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-2.5 shadow-sm shadow-black/5">
                <form onSubmit={handleChatSubmit} className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => handleChatSubmit(undefined, "Give me a custom logical aptitude puzzle from Google")}
                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  
                  <input 
                    type="text"
                    placeholder="Example : 'Explain OOP encapsulation with code decorator samples'"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-gray-400 outline-none focus:ring-0 px-2"
                  />

                  {/* Send & Audio Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button 
                      type="button" 
                      onClick={() => handleChatSubmit(undefined, "Let's run a micro voice aptitude test")}
                      className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || chatLoading}
                      className="w-8 h-8 rounded-xl bg-black hover:opacity-90 active:scale-95 flex items-center justify-center text-white disabled:opacity-40 transition-all"
                    >
                      {chatLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </form>

                {/* Quick Action Pills under text input */}
                <div className="flex flex-wrap gap-2 mt-3 pt-2.5 border-t border-gray-100/70">
                  {[
                    { label: "Deep Research", prompt: "Explain Google's page rank indexing algorithms in simple terms." },
                    { label: "Verify Resume", prompt: "How can I raise my resume score for Backend roles?" },
                    { label: "Solve Aptitude", prompt: "Give me an Infosys coding coding-decoding pattern problem." },
                    { label: "Explain Recursion", prompt: "Explain tail recursion and memoization difference." }
                  ].map((pill) => (
                    <button
                      key={pill.label}
                      type="button"
                      onClick={() => handleChatSubmit(undefined, pill.prompt)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-bold shadow-sm transition-all active:scale-95"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Floating Chat History Slide-Over Drawer Drawer */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-full bg-[#0e0e11] border-l border-white/10 flex flex-col p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-black uppercase text-white">AI Coach Conversation</h3>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Log Body */}
              <div className="flex-1 overflow-y-auto py-6 space-y-4 select-text scrollbar-thin">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-violet-600 text-white rounded-tr-none" 
                          : "bg-white/5 border border-white/5 text-gray-200 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3.5 text-xs text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                      <span>Coach is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Slide-over input pane */}
              <form onSubmit={handleChatSubmit} className="pt-4 border-t border-white/5 flex gap-2">
                <input 
                  type="text"
                  placeholder="Ask a follow up query..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <button 
                  type="submit"
                  className="p-3 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white rounded-xl transition-all"
                >
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
