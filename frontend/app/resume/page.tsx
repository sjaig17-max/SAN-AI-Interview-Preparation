"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { 
  FileText, UploadCloud, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, 
  Sparkles, ShieldCheck, HeartPulse, GraduationCap, Code2, Briefcase, Star,
  Wand2, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResumePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [refinementError, setRefinementError] = useState("");

  const [contentPrompt, setContentPrompt] = useState("");
  const [refiningContent, setRefiningContent] = useState(false);
  const [contentError, setContentError] = useState("");

  const handleRefineRecommendations = async (customPrompt?: string) => {
    if (!analysis) return;
    
    const promptToSend = customPrompt || refinementPrompt;
    if (!promptToSend.trim()) return;

    setRefining(true);
    setRefinementError("");

    try {
      const res = await api.post("/resume/refine-recommendations", {
        analysis_id: analysis.id,
        prompt: promptToSend.trim()
      });
      setAnalysis(res.data);
      setRefinementPrompt("");
    } catch (err: any) {
      setRefinementError(err.response?.data?.detail || "Refinement failed. Try again.");
    } finally {
      setRefining(false);
    }
  };

  const handleRefineContent = async () => {
    if (!analysis) return;
    setRefiningContent(true);
    setContentError("");
    try {
      const res = await api.post("/resume/refine-content", {
        analysis_id: analysis.id,
        prompt: contentPrompt.trim()
      });
      setAnalysis(res.data);
      setContentPrompt("");
    } catch (err: any) {
      setContentError(err.response?.data?.detail || "Content refinement failed. Try again.");
    } finally {
      setRefiningContent(false);
    }
  };


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get("/resume/analysis/latest")
        .then((res) => {
          setAnalysis(res.data);
        })
        .catch(() => {
          // If no resume is uploaded yet, ignore error and show uploader
          setAnalysis(null);
        })
        .finally(() => setLoadingAnalysis(false));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user?.profile?.preferred_job_role) {
      setTargetRole(user.profile.preferred_job_role);
    }
  }, [user]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_role", targetRole);

    try {
      const res = await api.post("/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAnalysis(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload analysis failed. Ensure correct file type.");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || loadingAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-6 max-w-7xl mx-auto space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-xl font-black tracking-wider text-white">
          ATS OPTIMIZER ENGINE
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="font-extrabold text-lg text-white">Upload Resume</h3>
              <p className="text-xs text-gray-400 mt-1">Upload your PDF or Word document to parse skills and analyze ATS scores.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Job Role</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>

              {/* Drag Drop Box */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-violet-500/40 cursor-pointer transition-all bg-white/2"
              >
                <input 
                  type="file" 
                  id="resume-file" 
                  accept=".pdf,.docx,.doc" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <label htmlFor="resume-file" className="cursor-pointer space-y-3 block">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto text-gray-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-gray-400">
                    {file ? (
                      <span className="font-bold text-violet-400 truncate max-w-xs block">{file.name}</span>
                    ) : (
                      <>
                        <span className="text-white font-bold">Click to upload</span> or drag and drop <br />
                        PDF, DOCX, or DOC (Max 10MB)
                      </>
                    )}
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex gap-2 p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing Keywords...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Scan & Optimize
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Evaluation Output Panel (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Visual ATS Score & Star Rating Header */}
                <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    {/* Circular Progress Ring */}
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="rgb(139, 92, 246)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 * (1 - (analysis.ats_score || 75) / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-black text-white">{analysis.ats_score}%</span>
                        <span className="text-[7px] text-gray-500 uppercase font-bold">ATS</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">ATS Keyword Fit & Score</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Overall grading based on structure, skills, and formatting guidelines.</p>
                      {/* Star dashboard */}
                      <div className="flex items-center gap-1 mt-1.5">
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const ratingValue = (analysis.resume_score || 80) / 20;
                          const fillValue = Math.min(Math.max(ratingValue - idx, 0), 1);
                          return (
                            <Star
                              key={idx}
                              className={`w-4 h-4 ${
                                fillValue >= 0.8
                                  ? "text-yellow-400 fill-yellow-400"
                                  : fillValue >= 0.3
                                  ? "text-yellow-400 fill-yellow-400/50"
                                  : "text-gray-600"
                              }`}
                            />
                          );
                        })}
                        <span className="text-xs font-bold text-gray-400 ml-2">
                          {((analysis.resume_score || 80) / 20).toFixed(1)} / 5.0
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Button to proceed to Page 4: Interview Setup */}
                  <button
                    onClick={() => router.push("/interview/setup")}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 active:scale-95 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                  >
                    Proceed to Interview Rounds
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Scoring metrics grids */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { title: "ATS Match", score: analysis.ats_score, desc: "Keyword compliance" },
                    { title: "Resume Rating", score: analysis.resume_score, desc: "Format & structure" },
                    { title: "Grammar Core", score: analysis.grammar_score, desc: "Sentence patterns" },
                    { title: "Skill Matrix", score: analysis.skill_score, desc: "Expertise depth" },
                  ].map((metric) => (
                    <div key={metric.title} className="glass-card rounded-2xl p-4 text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400">{metric.title}</p>
                      <h4 className="text-3xl font-black text-white mt-1">{metric.score}%</h4>
                      <p className="text-[9px] text-gray-500 mt-0.5">{metric.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Missing keywords vs suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-3xl p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Identified Gaps & Missing Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {analysis.missing_skills && analysis.missing_skills.length > 0 ? (
                        analysis.missing_skills.map((skill: string) => (
                          <span key={skill} className="px-2.5 py-1 rounded-full bg-red-950/20 border border-red-500/20 text-[10px] font-bold text-red-400">
                            + {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">No missing keywords found!</p>
                      )}
                    </div>
                  </div>

                  <div className="glass-card rounded-3xl p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Core Strengths Verified
                    </h4>
                    <ul className="space-y-2 pt-2">
                      {analysis.strong_areas && analysis.strong_areas.map((str: string, i: number) => (
                        <li key={i} className="flex gap-2 text-xs text-gray-300 items-start">
                          <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Detailed improvement steps card */}
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Actionable Recommendations
                  </h4>
                  <ul className="space-y-3 pt-2">
                    {analysis.improvement_suggestions && analysis.improvement_suggestions.map((sug: string, i: number) => (
                      <li key={i} className="flex gap-3 text-xs text-gray-300 leading-relaxed">
                        <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5 font-bold text-violet-400 text-[10px]">
                          {i + 1}
                        </div>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Refinement Panel inside Recommendations card */}
                  <div className="border-t border-white/5 pt-5 mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Refine suggestions with AI</span>
                      </div>
                      {refining && (
                        <span className="text-[10px] text-violet-400 flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          AI is rewriting suggestions...
                        </span>
                      )}
                    </div>
                    
                    {/* Quick Filters */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Focus on remote roles",
                        "Emphasize senior leadership",
                        "Make them shorter & punchier",
                        "Focus on testing & DevOps",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          disabled={refining}
                          onClick={() => handleRefineRecommendations(suggestion)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/10 hover:border-violet-500/20 border border-white/5 text-[10px] font-semibold text-gray-400 hover:text-violet-400 transition-all disabled:opacity-40"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>

                    {/* Custom Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Focus suggestions on cloud/AWS skills or make them more specific..."
                        value={refinementPrompt}
                        onChange={(e) => setRefinementPrompt(e.target.value)}
                        disabled={refining}
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => handleRefineRecommendations()}
                        disabled={refining || !refinementPrompt.trim()}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 active:scale-95 text-white disabled:text-gray-500 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-40"
                      >
                        Refine
                      </button>
                    </div>

                    {refinementError && (
                      <p className="text-[10px] text-red-400 font-semibold">{refinementError}</p>
                    )}
                  </div>
                </div>

                {/* Rewritten Resume Content Refiner */}
                <div className="glass-card rounded-3xl p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI-Refined Resume Document Content
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    This represents the fully optimized, rewritten, and structured text of your resume generated by our advanced LLM models.
                  </p>
                  
                  {analysis.resume_text && (
                    <div className="relative rounded-2xl bg-zinc-950 p-4 border border-white/5 max-h-80 overflow-y-auto">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
                        {analysis.resume_text}
                      </pre>
                    </div>
                  )}

                  <div className="border-t border-white/5 pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Refine entire document content</span>
                      {refiningContent && (
                        <span className="text-[10px] text-teal-400 flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          AI model is auto-writing resume text...
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <textarea
                        rows={3}
                        placeholder="e.g. Incorporate more experience in React/Next.js, align with Google's SDE-2 job description, or emphasize Kubernetes clusters..."
                        value={contentPrompt}
                        onChange={(e) => setContentPrompt(e.target.value)}
                        disabled={refiningContent}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleRefineContent}
                        disabled={refiningContent || !contentPrompt.trim()}
                        className="self-end px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 active:scale-95 text-white disabled:text-gray-500 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-40"
                      >
                        Auto-Refine Resume with AI
                      </button>
                    </div>

                    {contentError && (
                      <p className="text-[10px] text-red-400 font-semibold">{contentError}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card rounded-3xl p-12 text-center flex flex-col items-center justify-center h-[400px]">
                <FileText className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="font-extrabold text-lg text-white">No Analysis Report Yet</h3>
                <p className="text-xs text-gray-400 mt-2 max-w-sm leading-relaxed">
                  Upload your resume file on the left panel to scan keywords, calculate ATS alignment scores, and get optimization advice.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
