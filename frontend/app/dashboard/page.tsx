"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/lib/api";
import { 
  Award, LayoutDashboard, FileText, UserSquare2, LogOut, Flame, BarChart3, 
  Settings2, Trophy, Bell, ChevronRight, Play, Star, Sparkles, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();
  const { checkActiveSession, activeSession } = useInterviewStore();

  const [stats, setStats] = useState<any>(null);
  const [fetchingStats, setFetchingStats] = useState(true);

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

  const handleStartInterview = async () => {
    if (activeSession) {
      router.push("/interview");
    } else {
      router.push("/interview/setup");
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

  return (
    <div className="min-h-screen flex bg-[#09090b]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-[#09090b]/80 backdrop-blur-md hidden md:flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              SAN AI INTERVIEW
            </span>
          </div>

          {/* Nav items */}
          <nav className="space-y-2">
            <button 
              onClick={() => router.push("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/10 text-violet-400 text-sm font-semibold border border-violet-500/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button 
              onClick={() => router.push("/resume")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
            >
              <FileText className="w-4 h-4" />
              ATS Resume
            </button>
            <button 
              onClick={handleStartInterview}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
            >
              <Play className="w-4 h-4" />
              AI Interview
            </button>
            {user.is_admin && (
              <button 
                onClick={() => router.push("/admin")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
              >
                <Settings2 className="w-4 h-4" />
                Admin Panel
              </button>
            )}
          </nav>
        </div>

        {/* User Info / Logout */}
        <div className="border-t border-white/5 pt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white shadow-md">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.profile?.preferred_job_role || "Student"}</p>
            </div>
          </div>
          <button 
            onClick={async () => { await logout(); router.push("/"); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 text-red-400 text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Bar */}
        <header className="h-16 border-b border-white/5 px-6 md:px-10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Welcome back, {user.full_name.split(" ")[0]}
            <Sparkles className="w-4 h-4 text-violet-400 animate-bounce" />
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all">
                <Bell className="w-4 h-4" />
              </button>
              {stats?.unread_notifications_count > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-400" />
              )}
            </div>
            <div className="h-8 w-px bg-white/5" />
            <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-violet-600/10 border border-violet-500/20 text-xs font-bold text-violet-400">
              <Flame className="w-3.5 h-3.5 fill-violet-400" />
              <span>{stats?.learning_streak || 0} Day Streak</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome Card & Action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-violet-900/40 via-violet-950/20 to-zinc-950 border border-violet-500/20 flex flex-col justify-between min-h-60">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                  Target: {user.profile?.target_company || "Any Company"}
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-4 tracking-tight leading-tight">
                  Start your {user.profile?.preferred_job_role || "Software Engineer"} AI mock preparation round.
                </h3>
                <p className="text-sm text-gray-400 mt-2 max-w-lg leading-relaxed">
                  Practice Quantitative, Technical OOP/DB architecture, simulated group talks, and behavioral STAR rounds.
                </p>
              </div>
              <button
                onClick={handleStartInterview}
                className="mt-6 self-start px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-violet-500/25 active:scale-95"
              >
                {activeSession ? "Resume Active Session" : "Start Mock Interview"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Performance Circular Stats */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between h-60">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Readiness Indicator</h4>
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                      <circle cx="50" cy="50" r="40" stroke="hsl(263.4, 70%, 50.4%)" strokeWidth="8" fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * (stats?.interview_readiness || 45)) / 100}
                        strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-xl font-extrabold text-white">{stats?.interview_readiness || 45}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Interview Ready</p>
                    <p className="text-xs text-gray-400 mt-1">Based on latest ATS score and mock exam evaluations.</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4 flex justify-between text-xs text-gray-400">
                <span>Resume: {stats?.resume_score || 0}</span>
                <span>ATS: {stats?.ats_score || 0}</span>
              </div>
            </div>
          </div>

          {/* Streaks, Goals & Skill progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Skill Matrix Progress */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                Key Skills Progress
              </h4>
              <div className="space-y-3 pt-2">
                {stats?.skill_progress && Object.entries(stats.skill_progress).map(([skill, val]: any) => (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-300">{skill}</span>
                      <span className="text-violet-400">{val}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Objectives */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  Today's Objective
                </h4>
                <p className="text-sm font-semibold text-white leading-relaxed">{stats?.todays_goal || "Solve the daily coding challenge."}</p>
                <div className="mt-4 space-y-2">
                  {stats?.recommended_learning && stats.recommended_learning.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                      <span className="flex-1 leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full self-start mt-4">
                Recommended
              </span>
            </div>

            {/* Level & XP progression */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Gamification Status
                </h4>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white">Level {stats?.user_level || 1} Developer</h3>
                  <p className="text-[11px] text-violet-400 font-bold">{stats?.user_xp || 100} Total XP Accumulated</p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase">
                    <span>Progress to Level { (stats?.user_level || 1) + 1 }</span>
                    <span>{Math.round(((stats?.user_xp || 100) % 200) / 200 * 100)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-600 to-teal-400 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${((stats?.user_xp || 100) % 200) / 200 * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full self-start mt-4">
                XP Level: {stats?.user_level || 1}
              </span>
            </div>
          </div>

          {/* Gamification Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Badges Milestones */}
            <div className="glass-card rounded-3xl p-6 space-y-4 lg:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-teal-400" />
                Verification Badges & Milestones
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {[
                  { title: "First Steps", desc: "Uploaded first resume for ATS check.", icon: "file-text" },
                  { title: "ATS Conqueror", desc: "Scored 80%+ on ATS alignment.", icon: "shield-check" },
                  { title: "Mock Marathoner", desc: "Completed an AI mock round.", icon: "trophy" },
                ].map((badge) => {
                  const isUnlocked = stats?.achievements?.some((a: any) => a.title === badge.title);
                  return (
                    <div 
                      key={badge.title} 
                      className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-28 ${
                        isUnlocked 
                          ? "bg-violet-950/20 border-violet-500/30 text-white shadow-lg shadow-violet-500/5" 
                          : "bg-white/2 border-white/5 opacity-40 text-gray-500"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isUnlocked ? "bg-violet-600/20 text-violet-400" : "bg-white/5 text-gray-500"
                        }`}>
                          <Star className={`w-4 h-4 ${isUnlocked ? "fill-violet-400" : ""}`} />
                        </div>
                        <div>
                          <p className="text-xs font-black">{badge.title}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed">{badge.desc}</p>
                        </div>
                      </div>
                      <span className={`self-start text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-3 ${
                        isUnlocked ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "bg-white/5 text-gray-500"
                      }`}>
                        {isUnlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Global Leaderboard */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-400" />
                Candidate Leaderboard
              </h4>
              <div className="space-y-2 pt-2">
                {stats?.leaderboard && stats.leaderboard.map((entry: any, i: number) => {
                  const isCurrentUser = entry.user_name === user?.full_name;
                  return (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isCurrentUser 
                          ? "bg-violet-600/10 border-violet-500/30 text-white" 
                          : "bg-white/2 border-white/5 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                          i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                          i === 1 ? "bg-slate-400/20 text-slate-300" :
                          i === 2 ? "bg-amber-600/20 text-amber-500" :
                          "bg-white/5 text-gray-400"
                        }`}>
                          {i + 1}
                        </div>
                        <span className="text-xs font-semibold truncate max-w-28">{entry.user_name}</span>
                      </div>
                      <span className="text-xs font-black text-violet-400">{entry.total_score} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
