"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInterviewStore } from "@/store/interviewStore";
import { ArrowLeft, Play, Sparkles, Loader2, Info, Zap, Users, Code2, Heart, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PERSONAS = [
  { id: "Neutral",  emoji: "🧑‍💼", label: "Alex — Neutral",   sub: "Objective & Professional",   color: "border-violet-500/40 bg-violet-500/8", badge: "badge-violet", desc: "Standard professional recruiter. Evaluates objectively without bias." },
  { id: "Friendly", emoji: "👩‍🏫", label: "Emma — Friendly",  sub: "Supportive & Constructive",   color: "border-teal-500/40 bg-teal-500/8",    badge: "badge-teal",   desc: "Warm, encouraging coach. Ideal for building confidence." },
  { id: "Tough",    emoji: "👨‍💻", label: "Victor — Tough",   sub: "Challenging & Probing",       color: "border-rose-500/40 bg-rose-500/8",    badge: "badge-rose",   desc: "Senior architect. Will probe edge cases and grill your decisions." },
];

const ROUNDS = [
  { icon: Zap,    label: "Aptitude Round",    desc: "5 timed MCQs — Quantitative, Logical & Coding patterns",     color: "text-amber-400",  bg: "bg-amber-500/10" },
  { icon: Users,  label: "Group Discussion",  desc: "Simulated voice/text debate on a current industry topic",    color: "text-sky-400",    bg: "bg-sky-500/10" },
  { icon: Code2,  label: "Technical Mock",    desc: "3 adaptive DSA & system design questions with follow-ups",    color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Heart,  label: "HR Behavioral",     desc: "2 STAR-method behavioural questions with webcam monitoring",  color: "text-rose-400",   bg: "bg-rose-500/10" },
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { startInterview } = useInterviewStore();

  const [jobRole, setJobRole] = useState("");
  const [expLevel, setExpLevel] = useState("Entry");
  const [persona, setPersona] = useState("Neutral");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user?.profile?.preferred_job_role) setJobRole(user.profile.preferred_job_role);
  }, [user]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setStarting(true);
    try {
      await startInterview(jobRole, expLevel, persona);
      router.push("/interview");
    } catch (err: any) {
      setError("Failed to start session. Please try again.");
      setStarting(false);
    }
  };

  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const selectedPersona = PERSONAS.find(p => p.id === persona)!;

  return (
    <div className="min-h-screen bg-[#09090b] py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/6 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        {/* Back button */}
        <button onClick={() => router.push("/dashboard")}
          className="btn-ghost flex items-center gap-2 mb-8 text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

          {/* ── Left: Config Form ── */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Configure Interview</h1>
                  <p className="text-xs text-gray-500">Set up your AI mock assessment session</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/25 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleStart} className="space-y-5">
              {/* Job Role */}
              <div className="glass-card-flat rounded-2xl p-5 space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Target Job Role</label>
                <input type="text" value={jobRole} onChange={e => setJobRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer, Data Scientist…"
                  required className="glass-input w-full" />
              </div>

              {/* Experience Level */}
              <div className="glass-card-flat rounded-2xl p-5 space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Experience Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "Entry",  label: "Fresher",    sub: "0–1 yr" },
                    { val: "Mid",    label: "Mid-Level",  sub: "1–4 yrs" },
                    { val: "Senior", label: "Senior",     sub: "5+ yrs" },
                  ].map(({ val, label, sub }) => (
                    <button key={val} type="button" onClick={() => setExpLevel(val)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        expLevel === val
                          ? "bg-violet-600/15 border-violet-500/50 text-white"
                          : "bg-white/[0.03] border-white/[0.07] text-gray-500 hover:border-white/[0.12] hover:text-gray-300"
                      }`}>
                      <p className="text-xs font-bold">{label}</p>
                      <p className="text-[10px] mt-0.5 opacity-60">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Persona Picker */}
              <div className="glass-card-flat rounded-2xl p-5 space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Interviewer Persona</label>
                <div className="space-y-2">
                  {PERSONAS.map(p => (
                    <button key={p.id} type="button" onClick={() => setPersona(p.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        persona === p.id
                          ? `${p.color} border-opacity-60`
                          : "bg-white/[0.03] border-white/[0.07] hover:border-white/[0.12]"
                      }`}>
                      <span className="text-2xl">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">{p.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{p.desc}</p>
                      </div>
                      {persona === p.id && <span className={`badge ${p.badge} shrink-0`}>Selected</span>}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={starting || !jobRole.trim()} className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-sm">
                {starting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating Questions…</>
                ) : (
                  <><Play className="w-4 h-4" /> Begin Assessment</>
                )}
              </button>
            </form>
          </div>

          {/* ── Right: What to Expect ── */}
          <div className="space-y-5">
            <div className="glass-card-flat rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white">What to Expect</h3>
              <div className="space-y-3">
                {ROUNDS.map(({ icon: Icon, label, desc, color, bg }, i) => (
                  <motion.div key={label}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                    <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Round {i + 1}</span>
                      </div>
                      <p className="text-xs font-bold text-white">{label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Selected persona preview */}
            <AnimatePresence mode="wait">
              <motion.div key={persona}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card-flat rounded-2xl p-5 border border-white/[0.06]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Your Interviewer</p>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${selectedPersona.color} border`}>
                    {selectedPersona.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{selectedPersona.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{selectedPersona.sub}</p>
                    <span className={`badge ${selectedPersona.badge} mt-1.5`}>{selectedPersona.sub}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-2 p-4 rounded-2xl bg-amber-950/25 border border-amber-500/20">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200/70 leading-relaxed">
                The full assessment takes approximately <strong className="text-amber-300">25–35 minutes</strong>. Ensure a stable internet connection and a quiet environment before beginning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
