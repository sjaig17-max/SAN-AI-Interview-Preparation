"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import {
  FileText, UploadCloud, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight,
  Sparkles, Star, Wand2, Loader2, X, Copy, Check, TrendingUp, Target,
  Shield, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "text-teal-400" : score >= 60 ? "text-amber-400" : "text-rose-400";

const SCORE_BG = (score: number) =>
  score >= 80 ? "bg-teal-500/10 border-teal-500/20" : score >= 60 ? "bg-amber-500/10 border-amber-500/20" : "bg-rose-500/10 border-rose-500/20";

const SCORE_RING = (score: number) =>
  score >= 80 ? "rgb(20,184,166)" : score >= 60 ? "rgb(245,158,11)" : "rgb(244,63,94)";

export default function ResumePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [copied, setCopied] = useState(false);

  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [refinementError, setRefinementError] = useState("");

  const [contentPrompt, setContentPrompt] = useState("");
  const [refiningContent, setRefiningContent] = useState(false);
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user?.profile?.preferred_job_role) setTargetRole(user.profile.preferred_job_role);
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get("/resume/analysis/latest")
        .then(res => setAnalysis(res.data))
        .catch(() => setAnalysis(null))
        .finally(() => setLoadingAnalysis(false));
    }
  }, [isAuthenticated]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true); setError("");
    const fd = new FormData();
    fd.append("file", file); fd.append("target_role", targetRole);
    try {
      const res = await api.post("/resume/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setAnalysis(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed. Please check the file type.");
    } finally { setUploading(false); }
  };

  const handleRefineRecommendations = async (customPrompt?: string) => {
    if (!analysis) return;
    const p = customPrompt || refinementPrompt;
    if (!p.trim()) return;
    setRefining(true); setRefinementError("");
    try {
      const res = await api.post("/resume/refine-recommendations", { analysis_id: analysis.id, prompt: p.trim() });
      setAnalysis(res.data); setRefinementPrompt("");
    } catch (err: any) {
      setRefinementError(err.response?.data?.detail || "Refinement failed.");
    } finally { setRefining(false); }
  };

  const handleRefineContent = async () => {
    if (!analysis) return;
    setRefiningContent(true); setContentError("");
    try {
      const res = await api.post("/resume/refine-content", { analysis_id: analysis.id, prompt: contentPrompt.trim() });
      setAnalysis(res.data); setContentPrompt("");
    } catch (err: any) {
      setContentError(err.response?.data?.detail || "Content refinement failed.");
    } finally { setRefiningContent(false); }
  };

  const copyToClipboard = () => {
    if (analysis?.resume_text) {
      navigator.clipboard.writeText(analysis.resume_text);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || loadingAnalysis) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Loading analysis…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] py-8 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-1/3 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost flex items-center gap-2 text-xs">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="text-center hidden sm:block">
            <h1 className="text-sm font-black text-white tracking-tight">ATS Resume Optimizer</h1>
            <p className="text-[10px] text-gray-500">Powered by AI keyword analysis</p>
          </div>
          {analysis && (
            <button onClick={() => router.push("/interview/setup")}
              className="btn-primary flex items-center gap-2 py-2 px-4 text-xs">
              Start Interview <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Upload Panel ── */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-card-flat rounded-3xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-black text-white mb-1">Upload Resume</h2>
                <p className="text-xs text-gray-500">PDF or DOCX · Max 10MB · Auto keyword scan</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Role</label>
                  <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Engineer" required className="glass-input w-full" />
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-violet-500/70 bg-violet-500/8 scale-[1.01]"
                      : file
                        ? "border-teal-500/50 bg-teal-500/5"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/4"
                  }`}
                >
                  <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} className="hidden" />
                  <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center ${file ? "bg-teal-500/15" : "bg-white/[0.05]"}`}>
                    {file ? <CheckCircle2 className="w-6 h-6 text-teal-400" /> : <UploadCloud className="w-6 h-6 text-gray-500" />}
                  </div>
                  {file ? (
                    <div>
                      <p className="text-xs font-bold text-teal-400 truncate max-w-[200px] mx-auto">{file.name}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to scan</p>
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}
                        className="mt-2 text-[10px] text-gray-600 hover:text-red-400 flex items-center gap-1 mx-auto transition-colors">
                        <X className="w-3 h-3" /> Remove file
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-white">Click or drag & drop</p>
                      <p className="text-[10px] text-gray-600 mt-1">PDF, DOCX, DOC supported</p>
                    </>
                  )}
                </div>

                {error && (
                  <div className="flex gap-2 p-3.5 bg-red-950/30 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={uploading || !file} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm">
                  {uploading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analysing…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Scan & Optimise</>
                  )}
                </button>
              </form>
            </div>

            {/* Tips */}
            <div className="glass-card-flat rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quick Tips</p>
              {["Use quantified achievements (e.g. 'Reduced latency by 40%')", "Include job-relevant keywords from the JD", "Keep formatting clean — no tables or images", "Use active verbs: Built, Designed, Optimised"].map(tip => (
                <div key={tip} className="flex gap-2 text-[10px] text-gray-400 leading-relaxed">
                  <span className="text-violet-400 shrink-0">›</span> {tip}
                </div>
              ))}
            </div>
          </div>

          {/* ── Analysis Panel ── */}
          <div className="lg:col-span-8 space-y-5">
            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div key="analysis" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                  {/* Score Header Card */}
                  <div className="glass-card-flat rounded-3xl p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      {/* Circular Ring */}
                      <div className="relative w-24 h-24 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="9" fill="none" />
                          <motion.circle cx="50" cy="50" r="40"
                            stroke={SCORE_RING(analysis.ats_score)}
                            strokeWidth="9" fill="none" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 40}
                            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - analysis.ats_score / 100) }}
                            transition={{ duration: 1.2, ease: "easeOut" }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-2xl font-black ${SCORE_COLOR(analysis.ats_score)}`}>{analysis.ats_score}%</span>
                          <span className="text-[8px] text-gray-500 uppercase font-bold">ATS</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-white text-base">ATS Keyword Score</h3>
                          <span className={`badge ${analysis.ats_score >= 80 ? "badge-teal" : analysis.ats_score >= 60 ? "badge-amber" : "badge-rose"}`}>
                            {analysis.ats_score >= 80 ? "Excellent" : analysis.ats_score >= 60 ? "Good" : "Needs Work"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Based on keyword density, formatting, and role alignment.</p>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const v = Math.min(Math.max((analysis.resume_score / 20) - i, 0), 1);
                            return <Star key={i} className={`w-4 h-4 ${v >= 0.8 ? "text-amber-400 fill-amber-400" : v >= 0.3 ? "text-amber-400 fill-amber-400/40" : "text-gray-700"}`} />;
                          })}
                          <span className="text-xs text-gray-500 ml-2">{(analysis.resume_score / 20).toFixed(1)} / 5.0</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "ATS Match",     score: analysis.ats_score,     icon: Target },
                      { label: "Resume Score",  score: analysis.resume_score,  icon: TrendingUp },
                      { label: "Grammar",       score: analysis.grammar_score,  icon: Shield },
                      { label: "Skill Matrix",  score: analysis.skill_score,   icon: Zap },
                    ].map(({ label, score, icon: Icon }) => (
                      <div key={label} className={`rounded-2xl p-4 border text-center ${SCORE_BG(score)}`}>
                        <Icon className={`w-4 h-4 mx-auto mb-2 ${SCORE_COLOR(score)}`} />
                        <p className={`text-2xl font-black ${SCORE_COLOR(score)}`}>{score}%</p>
                        <p className="text-[10px] text-gray-500 mt-1 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Gap & Strength */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="glass-card-flat rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.missing_skills?.length > 0 ? analysis.missing_skills.map((s: string) => (
                          <span key={s} className="badge badge-rose">{s}</span>
                        )) : <p className="text-xs text-gray-500">✓ No critical gaps found</p>}
                      </div>
                    </div>
                    <div className="glass-card-flat rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Core Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {analysis.strong_areas?.map((s: string, i: number) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-300 items-start">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div className="glass-card-flat rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" /> AI Recommendations
                    </h4>
                    <ul className="space-y-2.5">
                      {analysis.improvement_suggestions?.map((s: string, i: number) => (
                        <li key={i} className="flex gap-3 text-xs text-gray-300 leading-relaxed">
                          <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 text-[9px] font-black text-violet-400">{i + 1}</div>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Refine suggestions */}
                    <div className="border-t border-white/[0.05] pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Refine with AI</span>
                        </div>
                        {refining && <span className="text-[10px] text-violet-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Rewriting…</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {["Focus on remote roles", "Senior leadership tone", "Shorter & punchier", "DevOps & testing focus"].map(q => (
                          <button key={q} onClick={() => handleRefineRecommendations(q)} disabled={refining}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-violet-600/10 border border-white/[0.06] hover:border-violet-500/25 text-[10px] font-semibold text-gray-500 hover:text-violet-400 transition-all disabled:opacity-40">
                            {q}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={refinementPrompt} onChange={e => setRefinementPrompt(e.target.value)}
                          placeholder="Custom refinement instruction…" disabled={refining}
                          className="glass-input flex-1 py-2.5 text-xs" />
                        <button onClick={() => handleRefineRecommendations()} disabled={refining || !refinementPrompt.trim()}
                          className="btn-primary px-4 py-2.5 text-xs">Refine</button>
                      </div>
                      {refinementError && <p className="text-[10px] text-red-400">{refinementError}</p>}
                    </div>
                  </div>

                  {/* Resume Content Refiner */}
                  {analysis.resume_text && (
                    <div className="glass-card-flat rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" /> AI-Refined Resume Text
                        </h4>
                        <button onClick={copyToClipboard}
                          className="btn-ghost py-1.5 px-3 text-[10px] flex items-center gap-1.5">
                          {copied ? <><Check className="w-3 h-3 text-teal-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                      <div className="rounded-xl bg-black/40 border border-white/[0.04] p-4 max-h-64 overflow-y-auto">
                        <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap leading-relaxed select-all">{analysis.resume_text}</pre>
                      </div>
                      <div className="space-y-2">
                        <textarea rows={3} value={contentPrompt} onChange={e => setContentPrompt(e.target.value)}
                          disabled={refiningContent}
                          placeholder="Describe how to rewrite — e.g. Align to Google SDE-2 JD, add more React experience…"
                          className="glass-input w-full text-xs resize-none" />
                        <div className="flex items-center justify-between">
                          {contentError && <p className="text-[10px] text-red-400">{contentError}</p>}
                          {refiningContent && <span className="text-[10px] text-teal-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> AI rewriting…</span>}
                          <button onClick={handleRefineContent} disabled={refiningContent || !contentPrompt.trim()}
                            className="btn-primary ml-auto py-2.5 px-4 text-xs flex items-center gap-2">
                            <Wand2 className="w-3.5 h-3.5" /> Auto-Refine with AI
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-card-flat rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center animate-float">
                    <FileText className="w-9 h-9 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white mb-2">No Analysis Yet</h3>
                    <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                      Upload your resume on the left to get ATS keyword scores, skill gap analysis, and AI-powered rewrite recommendations.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    {["PDF", "DOCX", "DOC"].map(f => <span key={f} className="badge badge-gray">{f}</span>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
