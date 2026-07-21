"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInterviewStore } from "@/store/interviewStore";
import { ArrowLeft, Play, Sparkles, Loader2, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function InterviewSetupPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { startInterview, checkActiveSession, activeSession } = useInterviewStore();

  const [jobRole, setJobRole] = useState("");
  const [expLevel, setExpLevel] = useState("Entry");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user?.profile?.preferred_job_role) {
      setJobRole(user.profile.preferred_job_role);
    }
  }, [user]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setStarting(true);
    try {
      await startInterview(jobRole, expLevel);
      router.push("/interview");
    } catch (err) {
      console.error(err);
      setStarting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6 max-w-xl mx-auto flex flex-col justify-center">
      <div className="space-y-6">
        <button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all text-xs font-semibold self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="glass-card rounded-3xl p-8 space-y-6 relative overflow-hidden">
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Start AI Interview Prep</h2>
            <p className="text-xs text-gray-400 mt-1">Configure your mock target role to start the evaluation.</p>
          </div>

          <form onSubmit={handleStart} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Job Role</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Full Stack Developer"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Experience Level</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm"
                value={expLevel}
                onChange={(e) => setExpLevel(e.target.value)}
              >
                <option value="Entry">Student / Fresher</option>
                <option value="Mid">Mid-level Developer (1-4 yrs)</option>
                <option value="Senior">Senior Developer (5+ yrs)</option>
              </select>
            </div>

            {/* Instruction Warning Box */}
            <div className="flex gap-3 p-4 bg-violet-950/20 border border-violet-500/20 rounded-xl">
              <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-300 leading-relaxed">
                <p className="font-semibold text-white mb-1">Interview Assessment Flow:</p>
                <ul className="list-decimal pl-4 space-y-1">
                  <li>Round 1: 5 timed multiple-choice Aptitude questions</li>
                  <li>Round 2: Simulated voice Group Discussion</li>
                  <li>Round 3: 3 Technical coding questions</li>
                  <li>Round 4: 2 Behavioral HR questions</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={starting}
              className="w-full py-3.5 px-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 active:scale-95"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Exam Questions...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Begin Assessment
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
