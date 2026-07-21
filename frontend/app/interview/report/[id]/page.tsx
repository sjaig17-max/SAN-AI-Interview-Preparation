"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { 
  ArrowLeft, Download, Award, Sparkles, CheckCircle2, AlertTriangle, 
  MapPin, Clock, Compass, FileText, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      api.get(`/interview/session/${id}/report`)
        .then((res) => {
          setReport(res.data);
        })
        .catch((err) => {
          console.error("Error fetching report:", err);
          setReport(null);
        })
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, id]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[#09090b]">
        <FileText className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-white">Evaluation Report Missing</h3>
        <p className="text-xs text-gray-400 mt-2 max-w-sm">
          Could not find report details for this interview session. Return to your dashboard.
        </p>
        <button 
          onClick={() => router.push("/dashboard")}
          className="mt-6 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-6 max-w-5xl mx-auto space-y-8 print:py-0 print:px-0 print:bg-white print:text-black">
      {/* Header Controls */}
      <div className="flex items-center justify-between print:hidden">
        <button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all text-xs font-semibold shadow-lg shadow-violet-500/10"
        >
          <Download className="w-4 h-4" />
          Export PDF Report
        </button>
      </div>

      {/* Main Report Body */}
      <div className="space-y-6">
        {/* Banner Card */}
        <div className="glass-card rounded-3xl p-8 bg-gradient-to-tr from-violet-900/20 via-[#0f0f12] to-teal-500/5 flex flex-col md:flex-row items-center justify-between gap-6 border-violet-500/10">
          <div className="space-y-3 text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
              Completed Session Report
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">AI Interview Evaluation Result</h1>
            <p className="text-xs text-gray-400">Compiled on {new Date(report.created_at).toLocaleDateString()}</p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/60 border border-white/5 p-4 rounded-2xl shrink-0">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Overall Rating</p>
              <h2 className="text-2xl font-black text-violet-400">{report.overall_score.toFixed(1)}%</h2>
            </div>
          </div>
        </div>

        {/* Breakdown scores grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "Aptitude Round", score: report.aptitude_score, color: "text-violet-400" },
            { title: "Group Discussion", score: report.gd_score, color: "text-teal-400" },
            { title: "Technical Core", score: report.technical_score, color: "text-blue-400" },
            { title: "HR Behavioral", score: report.hr_score, color: "text-pink-400" },
          ].map((round) => (
            <div key={round.title} className="glass-card rounded-2xl p-5 border-white/5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{round.title}</span>
              <h3 className={`text-2xl font-black mt-2 ${round.color}`}>{round.score.toFixed(1)}%</h3>
            </div>
          ))}
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Identified Strengths
            </h4>
            <ul className="space-y-2.5 pt-2">
              {report.detailed_evaluation?.strengths?.map((str: string, idx: number) => (
                <li key={idx} className="flex gap-2 text-xs text-gray-300 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Weak Areas & Skill Gaps
            </h4>
            <ul className="space-y-2.5 pt-2">
              {report.detailed_evaluation?.weak_areas?.map((weak: string, idx: number) => (
                <li key={idx} className="flex gap-2 text-xs text-gray-300 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Actionable Learning Roadmap */}
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Actionable AI Learning Roadmap
            </h4>
            <p className="text-xs text-gray-400 mt-1">Recommended phases to bridge structural technical gaps.</p>
          </div>

          <div className="space-y-6 pt-4 border-l border-white/5 pl-4 ml-2">
            {report.detailed_evaluation?.roadmap?.map((phase: any, idx: number) => (
              <div key={idx} className="relative space-y-2">
                {/* Dot marker */}
                <div className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full bg-violet-600 border border-[#09090b] shadow-md shadow-violet-500/30" />
                
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <span className="font-bold text-white">{phase.phase}</span>
                  <span className="text-[10px] text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-violet-400" />
                    {phase.duration}
                  </span>
                </div>
                
                <div className="text-xs text-gray-400 space-y-1 pl-1 leading-relaxed">
                  <p><span className="font-semibold text-gray-300">Topics to Master:</span> {phase.topics_to_learn?.join(", ")}</p>
                  <p><span className="font-semibold text-gray-300">Suggested Project:</span> {phase.recommended_projects?.join(", ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
