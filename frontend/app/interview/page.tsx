"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/lib/api";
import {
  ArrowLeft, Clock, CheckCircle2, Mic, MicOff, Loader2, Sparkles, Send,
  Award, Globe, AlertTriangle, ChevronRight, Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getInterviewer = (persona = "Neutral") => {
  switch (persona) {
    case "Friendly": return { name: "Emma", title: "Empathic Coach", emoji: "👩‍🏫",
      color: "from-teal-600/20 to-teal-900/10", border: "border-teal-500/25", badge: "badge-teal",
      accent: "text-teal-400", ring: "ring-teal-500/20",
      intro: "Hi! I'm Emma. Guide me through your thought process — there are no wrong answers, just clarity!" };
    case "Tough": return { name: "Victor", title: "Senior Architect", emoji: "👨‍💻",
      color: "from-rose-600/20 to-rose-900/10", border: "border-rose-500/25", badge: "badge-rose",
      accent: "text-rose-400", ring: "ring-rose-500/20",
      intro: "I'm Victor. I expect precise, well-reasoned answers. I will challenge your edge-case handling. Be concise." };
    default: return { name: "Alex", title: "Standard Recruiter", emoji: "🧑‍💼",
      color: "from-violet-600/20 to-violet-900/10", border: "border-violet-500/25", badge: "badge-violet",
      accent: "text-violet-400", ring: "ring-violet-500/20",
      intro: "Hello, I'm Alex. We'll cover core concepts and behavioral responses. I'll evaluate your answers objectively." };
  }
};

const ROUND_META = [
  { step: 1, label: "Aptitude",   short: "APT" },
  { step: 2, label: "Discussion", short: "GD"  },
  { step: 3, label: "Technical",  short: "TECH" },
  { step: 4, label: "Behavioral", short: "HR"  },
];

export default function InterviewFlowPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    activeSession, currentRound, aptitudeQuestions, gdTopics, techQuestions, hrQuestions,
    activeTechIndex, activeHRIndex, loadRoundData, checkActiveSession,
    submitAptitude, submitGD, submitTechnicalAnswer, submitHRAnswer, resetSession
  } = useInterviewStore();

  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState("");

  const [aptitudeAnswers, setAptitudeAnswers] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState(300);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [gdText, setGdText] = useState("");
  const [recording, setRecording] = useState(false);
  const [gdTimer, setGdTimer] = useState(60);
  const gdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [techText, setTechText] = useState("");
  const [hrText, setHrText] = useState("");
  const [roundTimer, setRoundTimer] = useState(180);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraStream(stream);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch {}
  };
  const stopCamera = () => { cameraStream?.getTracks().forEach(t => t.stop()); setCameraStream(null); };

  const startGDRecording = () => {
    setRecording(true); setGdTimer(60);
    gdTimerRef.current = setInterval(() => {
      setGdTimer(prev => {
        if (prev <= 1) { clearInterval(gdTimerRef.current!); setRecording(false);
          setGdText("Technology acts as a major enabler in corporate operations, transforming standard resume sourcing and speeding up candidate alignment."); return 60; }
        return prev - 1;
      });
    }, 1000);
  };
  const stopGDRecording = () => { if (gdTimerRef.current) clearInterval(gdTimerRef.current);
    setRecording(false); setGdText("Technology acts as a major enabler in corporate operations, transforming standard resume sourcing and speeding up candidate alignment."); };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.push("/"); }, [isAuthenticated, authLoading, router]);
  useEffect(() => { checkActiveSession(); }, [checkActiveSession]);
  useEffect(() => {
    if (currentRound === 4 && activeSession) startCamera();
    else stopCamera();
    return () => { stopCamera(); if (gdTimerRef.current) clearInterval(gdTimerRef.current); if (roundTimerRef.current) clearInterval(roundTimerRef.current); };
  }, [currentRound, activeSession]);
  useEffect(() => { if (activeSession) loadRoundData(); }, [activeSession, currentRound, loadRoundData]);
  useEffect(() => {
    if (currentRound === 1 && activeSession) {
      timerRef.current = setInterval(() => setTimer(prev => { if (prev <= 1) { clearInterval(timerRef.current!); handleAptitudeSubmit(true); return 0; } return prev - 1; }), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentRound, activeSession]);
  useEffect(() => {
    if ((currentRound === 3 || currentRound === 4) && activeSession) {
      setRoundTimer(currentRound === 3 ? 180 : 120);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      roundTimerRef.current = setInterval(() => {
        setRoundTimer(prev => {
          if (prev <= 1) { clearInterval(roundTimerRef.current!); currentRound === 3 ? handleTechSubmit(true) : handleHRSubmit(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (roundTimerRef.current) clearInterval(roundTimerRef.current); };
  }, [currentRound, activeTechIndex, activeHRIndex, activeSession]);

  const handleAptitudeSubmit = async (auto = false) => {
    if (!activeSession) return; setLoadingAction(true);
    try {
      const s = { ...aptitudeAnswers };
      aptitudeQuestions.forEach(q => { if (!s[q.id]) s[q.id] = "A"; });
      await submitAptitude(s, 300 - timer);
    } catch { setError("Failed to submit aptitude."); } finally { setLoadingAction(false); }
  };
  const handleGDSubmit = async () => {
    if (!activeSession || !selectedTopic || !gdText.trim()) return; setLoadingAction(true);
    try { await submitGD(selectedTopic.id, gdText); } catch { setError("GD submission failed."); } finally { setLoadingAction(false); }
  };
  const handleTechSubmit = async (auto = false) => {
    if (!activeSession) return;
    const val = techText.trim() || (auto ? "[Time ran out]" : "");
    if (!val) return; setLoadingAction(true);
    try { await submitTechnicalAnswer(techQuestions[activeTechIndex].id, val); setTechText(""); }
    catch { setError("Technical submission failed."); } finally { setLoadingAction(false); }
  };
  const handleHRSubmit = async (auto = false) => {
    if (!activeSession) return;
    const val = hrText.trim() || (auto ? "[Time ran out]" : "");
    if (!val) return; setLoadingAction(true);
    try { await submitHRAnswer(hrQuestions[activeHRIndex].id, val); setHrText(""); }
    catch { setError("HR submission failed."); } finally { setLoadingAction(false); }
  };
  const toggleRecording = () => {
    if (currentRound === 2) { recording ? stopGDRecording() : startGDRecording(); return; }
    setRecording(!recording);
    if (!recording) setTimeout(() => {
      const text = currentRound === 3
        ? "A list is mutable using dynamic arrays; a tuple is immutable with fixed allocation, making it memory efficient."
        : "I resolved a migration conflict by mapping pros/cons of both architectures, letting the team vote based on performance data.";
      currentRound === 3 ? setTechText(text) : setHrText(text);
      setRecording(false);
    }, 3000);
  };

  if (authLoading || !activeSession) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Loading session…</p>
      </div>
    </div>
  );

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const interviewer = getInterviewer(activeSession.persona);
  const isRambling = currentRound === 3 ? techText.length > 500 : currentRound === 4 ? hrText.length > 400 : false;
  const timerVal = currentRound === 1 ? timer : roundTimer;
  const timerLabel = currentRound === 1 ? "Aptitude Timer" : currentRound === 3 || currentRound === 4 ? "Question Timer" : null;
  const timerWarning = timerVal < 30;

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* ── Top Status Bar ── */}
      <header className="border-b border-white/[0.04] px-4 sm:px-8 py-4 flex items-center justify-between bg-[#09090b]/90 backdrop-blur-sm">
        <div>
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">AI Mock Assessment</p>
          <h2 className="text-sm font-black text-white">{activeSession.job_role}</h2>
        </div>
        <div className="flex items-center gap-3">
          {timerLabel && (
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono font-black text-sm transition-colors ${
              timerWarning ? "bg-rose-950/40 border-rose-500/30 text-rose-400" : "bg-white/[0.04] border-white/[0.07] text-white"
            }`}>
              <Clock className={`w-4 h-4 ${timerWarning ? "animate-pulse" : ""}`} />
              {fmtTime(timerVal)}
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[10px] font-bold text-teal-400">Live Session</span>
          </div>
        </div>
      </header>

      {/* ── Round Progress Tracker ── */}
      <div className="border-b border-white/[0.04] px-4 sm:px-8">
        <div className="flex">
          {ROUND_META.map(({ step, label }) => {
            const done = currentRound > step;
            const active = currentRound === step;
            return (
              <div key={step} className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-2 transition-all ${
                active ? "border-violet-500" : done ? "border-teal-500" : "border-transparent"
              }`}>
                <div className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center transition-all ${
                  done ? "bg-teal-500 text-white" : active ? "bg-violet-600 text-white ring-2 ring-violet-500/30" : "bg-white/[0.04] text-gray-600"
                }`}>
                  {done ? "✓" : step}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block ${active ? "text-violet-400" : done ? "text-teal-400" : "text-gray-600"}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/40 border border-red-500/25 text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ROUND 1: APTITUDE */}
          {currentRound === 1 && (
            <motion.div key="r1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
              <div className="text-center mb-6">
                <span className="badge badge-amber mb-3 inline-flex">⚡ Round 1 · Cognitive Aptitude</span>
                <p className="text-xs text-gray-500">Answer all {aptitudeQuestions.length} questions before the timer runs out</p>
              </div>
              {aptitudeQuestions.map((q, idx) => (
                <div key={q.id} className="glass-card-flat rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">{idx + 1}</div>
                    <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                    {q.options && Object.entries(q.options).map(([optKey, optText]) => {
                      const selected = aptitudeAnswers[q.id] === optKey;
                      return (
                        <button key={optKey} onClick={() => setAptitudeAnswers({ ...aptitudeAnswers, [q.id]: optKey })}
                          className={`text-left px-4 py-3 rounded-xl border text-xs font-medium transition-all active:scale-[0.98] ${
                            selected ? "bg-violet-600/15 border-violet-500/50 text-white" : "bg-white/[0.03] border-white/[0.07] text-gray-400 hover:border-violet-500/25 hover:text-white"
                          }`}>
                          <span className="font-black text-violet-400 mr-2">{optKey}.</span>{String(optText)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button onClick={() => handleAptitudeSubmit()} disabled={loadingAction}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 mt-4">
                {loadingAction ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</> : "Submit Round 1 & Advance →"}
              </button>
            </motion.div>
          )}

          {/* ROUND 2: GD */}
          {currentRound === 2 && (
            <motion.div key="r2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
              <div className="text-center">
                <span className="badge badge-teal mb-3 inline-flex">🗣️ Round 2 · Group Discussion</span>
                <h3 className="text-lg font-black text-white mt-3">Select a discussion topic</h3>
              </div>
              <div className="grid gap-3">
                {gdTopics.map(topic => {
                  const sel = selectedTopic?.id === topic.id;
                  return (
                    <button key={topic.id} onClick={() => setSelectedTopic(topic)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all ${sel ? "bg-teal-600/10 border-teal-500/40" : "glass-card-flat hover:border-white/[0.12]"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sel ? "bg-teal-400" : "bg-gray-600"}`} />
                        <div>
                          <h4 className="font-bold text-sm text-white mb-1">{topic.title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">{topic.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedTopic && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Contribution</p>
                    <button onClick={toggleRecording}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                        recording ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" : "bg-white/[0.05] border-white/[0.08] text-gray-400 hover:text-white"
                      }`}>
                      {recording ? <><MicOff className="w-3.5 h-3.5" /> Stop (0:{String(gdTimer).padStart(2, "0")} left)</> : <><Mic className="w-3.5 h-3.5" /> Simulate Voice</>}
                    </button>
                  </div>
                  <textarea rows={4} value={gdText} onChange={e => setGdText(e.target.value)}
                    placeholder="Type or dictate your discussion entry…"
                    className="glass-input w-full resize-none text-xs" />
                  <button onClick={handleGDSubmit} disabled={loadingAction || !gdText.trim()}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                    {loadingAction ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Submit & Advance →"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ROUND 3 & 4: TECH / HR shared layout */}
          {(currentRound === 3 || currentRound === 4) && (
            <motion.div key={`r${currentRound}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
              <div className="text-center">
                <span className={`badge inline-flex mb-3 ${currentRound === 3 ? "badge-violet" : "badge-rose"}`}>
                  {currentRound === 3 ? "💻 Round 3 · Technical Mock" : "❤️ Round 4 · HR Behavioral"}
                </span>
                <p className="text-xs text-gray-500">
                  Question {currentRound === 3 ? activeTechIndex + 1 : activeHRIndex + 1} of {currentRound === 3 ? techQuestions.length : hrQuestions.length}
                </p>
              </div>

              {/* Interviewer Card */}
              <div className={`flex gap-4 p-5 rounded-2xl bg-gradient-to-br ${interviewer.color} border ${interviewer.border}`}>
                <div className="w-14 h-14 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center text-3xl shrink-0">
                  {interviewer.emoji}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{interviewer.name}</span>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">{interviewer.title}</span>
                    <span className={`badge ${interviewer.badge}`}>Live</span>
                  </div>
                  <p className={`text-xs italic leading-relaxed ${isRambling ? "text-rose-400" : "text-gray-300"}`}>
                    {isRambling ? (
                      <span className="flex items-center gap-1.5 not-italic font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                        "Let's wrap this up — can you summarize your final trade-offs?"
                      </span>
                    ) : currentRound === 3 ? (
                      activeTechIndex === 0 ? `"${interviewer.intro}"` : techQuestions[activeTechIndex]?.topic === "Adaptive Follow-up"
                        ? `"Let me probe deeper on that. Here's a follow-up:"`
                        : `"Next question — explain your reasoning clearly:"`
                    ) : (
                      activeHRIndex === 0 ? `"Let's begin the behavioral round using the STAR method."` : `"I'd like to explore that scenario further:"`
                    )}
                  </p>
                </div>
              </div>

              {/* Question Card */}
              {((currentRound === 3 && techQuestions[activeTechIndex]) || (currentRound === 4 && hrQuestions[activeHRIndex])) && (
                <div className="glass-card-flat rounded-2xl p-5 space-y-2">
                  <span className="badge badge-gray">
                    {currentRound === 3 ? `Topic: ${techQuestions[activeTechIndex].topic}` : `Category: ${hrQuestions[activeHRIndex].category}`}
                  </span>
                  <p className="font-bold text-white text-sm leading-relaxed">
                    {currentRound === 3 ? techQuestions[activeTechIndex].question : hrQuestions[activeHRIndex].question}
                  </p>
                </div>
              )}

              {/* Camera feed for HR round */}
              {currentRound === 4 && (
                cameraStream ? (
                  <div className="relative w-full max-w-sm mx-auto h-44 rounded-2xl overflow-hidden border border-white/[0.08] bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-[9px] font-bold text-white uppercase tracking-widest animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" /> REC
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm mx-auto h-44 rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.02] flex flex-col items-center justify-center gap-3 text-center p-6">
                    <Globe className="w-7 h-7 text-gray-600" />
                    <div>
                      <p className="text-xs font-bold text-white mb-1">Enable Webcam</p>
                      <p className="text-[10px] text-gray-500">Assesses confidence, posture & visual cues</p>
                    </div>
                    <button onClick={startCamera} className="btn-primary py-2 px-4 text-xs">Allow Camera</button>
                  </div>
                )
              )}

              {/* Answer Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {currentRound === 3 ? "Code / Explanation" : "STAR Response"}
                  </p>
                  <button onClick={toggleRecording}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${recording ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" : "bg-white/[0.04] border-white/[0.07] text-gray-400 hover:text-white"}`}>
                    {recording ? <><MicOff className="w-3.5 h-3.5" /> Stop recording</> : <><Mic className="w-3.5 h-3.5" /> Dictate</>}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={currentRound === 3 ? techText : hrText}
                  onChange={e => currentRound === 3 ? setTechText(e.target.value) : setHrText(e.target.value)}
                  placeholder={currentRound === 3 ? "Write your code or explanation…" : "Situation → Task → Action → Result…"}
                  className={`glass-input w-full resize-none text-xs ${currentRound === 3 ? "font-mono" : ""}`}
                />
                <div className="flex items-center justify-between text-[10px] text-gray-600">
                  <span>{(currentRound === 3 ? techText : hrText).length} chars</span>
                  {isRambling && <span className="text-rose-400 font-bold">⚠ Too verbose — summarise!</span>}
                </div>
              </div>

              <button
                onClick={() => currentRound === 3 ? handleTechSubmit() : handleHRSubmit()}
                disabled={loadingAction || !(currentRound === 3 ? techText.trim() : hrText.trim())}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                {loadingAction ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Submit Answer →"}
              </button>
            </motion.div>
          )}

          {/* ROUND 5: COMPLETE */}
          {currentRound === 5 && (
            <motion.div key="r5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-16 space-y-6">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600/30 to-indigo-700/20 border border-violet-500/30 flex items-center justify-center shadow-2xl shadow-violet-500/20">
                <Award className="w-12 h-12 text-violet-400" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-black text-white mb-3">Assessment Complete! 🎉</h2>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  All 4 rounds completed. Your AI-scored evaluation report is ready — it includes scores, STAR analysis, and a personalised learning roadmap.
                </p>
              </div>
              <button
                onClick={() => { router.push(`/interview/report/${activeSession.id}`); resetSession(); }}
                className="btn-primary flex items-center gap-2 py-4 px-8 text-sm">
                <Sparkles className="w-4 h-4" /> View Full Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
