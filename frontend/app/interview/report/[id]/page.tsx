"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import {
  ArrowLeft, Download, Award, Sparkles, CheckCircle2, AlertTriangle,
  Clock, Compass, FileText, ArrowRight, TrendingUp, Zap, Users, Heart, Code2
} from "lucide-react";
import { motion } from "framer-motion";

const SCORE_COLOR = (s: number) => s >= 80 ? "text-teal-400" : s >= 60 ? "text-amber-400" : "text-rose-400";
const SCORE_BG    = (s: number) => s >= 80 ? "bg-teal-500/10 border-teal-500/20" : s >= 60 ? "bg-amber-500/10 border-amber-500/20" : "bg-rose-500/10 border-rose-500/20";
const SCORE_RING  = (s: number) => s >= 80 ? "rgb(20,184,166)" : s >= 60 ? "rgb(245,158,11)" : "rgb(244,63,94)";

const ROUND_LABELS = [
  { key: "aptitude_score",  label: "Aptitude",       icon: Zap,    color: "text-amber-400",  bg: "bg-amber-500/10" },
  { key: "gd_score",        label: "Group Discussion",icon: Users,  color: "text-sky-400",    bg: "bg-sky-500/10" },
  { key: "technical_score", label: "Technical",       icon: Code2,  color: "text-violet-400", bg: "bg-violet-500/10" },
  { key: "hr_score",        label: "HR Behavioral",   icon: Heart,  color: "text-rose-400",   bg: "bg-rose-500/10" },
];

export default function ReportDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !isAuthenticated) router.push("/"); }, [isAuthenticated, authLoading, router]);
  useEffect(() => {
    if (isAuthenticated && id) {
      api.get(`/interview/session/${id}/report`)
        .then(res => setReport(res.data))
        .catch(() => setReport(null))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, id]);

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Loading evaluation report…</p>
      </div>
    </div>
  );

  if (!report) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[#09090b]">
      <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
        <FileText className="w-9 h-9 text-gray-600" />
      </div>
      <h3 className="text-xl font-black text-white mb-2">Report Not Found</h3>
      <p className="text-xs text-gray-500 max-w-sm mb-6">Could not locate evaluation data for this session.</p>
      <button onClick={() => router.push("/dashboard")} className="btn-primary flex items-center gap-2 py-3 px-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </button>
    </div>
  );

  const overall = report.overall_score;

  return (
    <div className="min-h-screen bg-[#09090b] py-8 px-4 relative">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">

        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost flex items-center gap-2 text-xs">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => typeof window !== "undefined" && window.print()}
            className="btn-primary flex items-center gap-2 py-2 px-4 text-xs">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>

        {/* Hero Banner */}
        <div className="glass-card-flat rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-br from-violet-900/30 via-transparent to-teal-900/10 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <span className="badge badge-violet inline-flex">✅ Completed Session Report</span>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                AI Interview Evaluation<br />
                <span className="shimmer-text">Results & Roadmap</span>
              </h1>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(report.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Session #{String(id).slice(-6)}
                </div>
              </div>
            </div>

            {/* Overall Ring */}
            <div className="flex items-center gap-5 p-5 rounded-2xl bg-black/30 border border-white/[0.07] shrink-0">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                  <motion.circle cx="50" cy="50" r="38"
                    stroke={SCORE_RING(overall)} strokeWidth="10" fill="none" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 38}
                    initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - overall / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xl font-black ${SCORE_COLOR(overall)}`}>{overall.toFixed(0)}%</span>
                  <span className="text-[8px] text-gray-600 uppercase font-bold">Overall</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Performance</p>
                <p className={`text-2xl font-black ${SCORE_COLOR(overall)}`}>
                  {overall >= 80 ? "Excellent" : overall >= 65 ? "Good" : overall >= 50 ? "Average" : "Needs Work"}
                </p>
                <p className="text-[10px] text-gray-600 mt-1">
                  {overall >= 80 ? "Ready for top-tier interviews" : overall >= 65 ? "Strong with minor gaps" : "Keep practising"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Round Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ROUND_LABELS.map(({ key, label, icon: Icon, color, bg }, i) => {
            const score = report[key] || 0;
            return (
              <motion.div key={key}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`rounded-2xl p-5 border text-center ${SCORE_BG(score)}`}>
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-black ${SCORE_COLOR(score)}`}>{score.toFixed(0)}%</p>
                <p className="text-[10px] text-gray-500 font-medium mt-1">{label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-card-flat rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Identified
            </h4>
            <ul className="space-y-2">
              {report.detailed_evaluation?.strengths?.map((s: string, i: number) => (
                <li key={i} className="flex gap-2 text-xs text-gray-300 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card-flat rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Areas to Improve
            </h4>
            <ul className="space-y-2">
              {report.detailed_evaluation?.weak_areas?.map((w: string, i: number) => (
                <li key={i} className="flex gap-2 text-xs text-gray-300 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" /> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Learning Roadmap */}
        <div className="glass-card-flat rounded-2xl p-6 space-y-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2 mb-1">
              <Compass className="w-3.5 h-3.5" /> Personalised Learning Roadmap
            </h4>
            <p className="text-[10px] text-gray-600">AI-generated phases to bridge your skill gaps and reach your target role.</p>
          </div>
          <div className="relative border-l border-white/[0.06] pl-6 ml-2 space-y-8">
            {report.detailed_evaluation?.roadmap?.map((phase: any, idx: number) => (
              <div key={idx} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[34px] top-1 w-4 h-4 rounded-full bg-violet-600 border-2 border-[#09090b] shadow-lg shadow-violet-500/30" />
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-black text-white">{phase.phase}</span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-lg">
                    <Clock className="w-3 h-3 text-violet-400" /> {phase.duration}
                  </div>
                </div>
                <div className="text-xs text-gray-400 space-y-1 leading-relaxed">
                  <p><span className="font-bold text-gray-300">Topics:</span> {phase.topics_to_learn?.join(", ")}</p>
                  <p><span className="font-bold text-gray-300">Projects:</span> {phase.recommended_projects?.join(", ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button onClick={() => router.push("/interview/setup")} className="btn-primary flex items-center gap-2 py-4 px-6 text-sm w-full sm:w-auto justify-center">
            <Sparkles className="w-4 h-4" /> Retake Mock Interview
          </button>
          <button onClick={() => router.push("/resume")} className="btn-ghost flex items-center gap-2 py-4 px-6 text-sm w-full sm:w-auto justify-center">
            <FileText className="w-4 h-4" /> Improve Resume
          </button>
        </div>

      </div>
    </div>
  );
}
