"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/lib/api";
import { 
  ArrowLeft, Clock, Info, CheckCircle2, ChevronRight, Mic, MicOff, Loader2, Sparkles, Send, Award, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Round 1 Aptitude States
  const [aptitudeAnswers, setAptitudeAnswers] = useState<Record<string, string>>({});
  const [timer, setTimer] = useState(300); // 5 Minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Round 2 GD States
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [gdText, setGdText] = useState("");
  const [recording, setRecording] = useState(false);
  const [gdTimer, setGdTimer] = useState(60);
  const gdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Round 3 Tech States
  const [techText, setTechText] = useState("");

  // Round 4 HR States
  const [hrText, setHrText] = useState("");

  // Camera integration states/refs for Round 4
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access denied or unavailable:", err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Start GD 1-minute speaking countdown
  const startGDRecording = () => {
    setRecording(true);
    setGdTimer(60);
    gdTimerRef.current = setInterval(() => {
      setGdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(gdTimerRef.current!);
          setRecording(false);
          setGdText("Technology acts as a major enabler in corporate operations, transforming standard resume sourcing and speeding up candidate alignment.");
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopGDRecording = () => {
    if (gdTimerRef.current) {
      clearInterval(gdTimerRef.current);
    }
    setRecording(false);
    setGdText("Technology acts as a major enabler in corporate operations, transforming standard resume sourcing and speeding up candidate alignment.");
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    checkActiveSession();
  }, [checkActiveSession]);

  // Handle camera activation lifecycle
  useEffect(() => {
    if (currentRound === 4 && activeSession) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
      if (gdTimerRef.current) clearInterval(gdTimerRef.current);
    };
  }, [currentRound, activeSession]);

  useEffect(() => {
    if (activeSession) {
      loadRoundData();
    }
  }, [activeSession, currentRound, loadRoundData]);

  // Aptitude Round timer countdown
  useEffect(() => {
    if (currentRound === 1 && activeSession) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAptitudeSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound, activeSession]);

  const handleAptitudeSubmit = async (auto = false) => {
    if (!activeSession) return;
    setLoadingAction(true);
    try {
      // Package default blank answers if auto-submitted
      const submissions = { ...aptitudeAnswers };
      aptitudeQuestions.forEach((q) => {
        if (!submissions[q.id]) submissions[q.id] = "A";
      });

      await submitAptitude(submissions, 300 - timer);
    } catch (err) {
      setError("Failed to submit aptitude score.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGDSubmit = async () => {
    if (!activeSession || !selectedTopic || !gdText.trim()) return;
    setLoadingAction(true);
    try {
      await submitGD(selectedTopic.id, gdText);
    } catch (err) {
      setError("Failed to grade GD submission.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleTechSubmit = async () => {
    if (!activeSession || !techText.trim()) return;
    setLoadingAction(true);
    try {
      const activeQ = techQuestions[activeTechIndex];
      await submitTechnicalAnswer(activeQ.id, techText);
      setTechText("");
    } catch (err) {
      setError("Failed to submit technical response.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleHRSubmit = async () => {
    if (!activeSession || !hrText.trim()) return;
    setLoadingAction(true);
    try {
      const activeQ = hrQuestions[activeHRIndex];
      await submitHRAnswer(activeQ.id, hrText);
      setHrText("");
    } catch (err) {
      setError("Failed to submit HR response.");
    } finally {
      setLoadingAction(false);
    }
  };

  // Simulated Voice recording toggles
  const toggleRecording = () => {
    if (currentRound === 2) {
      if (recording) {
        stopGDRecording();
      } else {
        startGDRecording();
      }
      return;
    }

    setRecording(!recording);
    if (!recording) {
      // Simulate speech to text insertion
      setTimeout(() => {
        const text = currentRound === 3
          ? "A list in Python is mutable and uses dynamic arrays, whereas a tuple is immutable and has a fixed allocation, making it highly memory efficient."
          : "I once resolved a codebase migration conflict by listing the pros and cons of both architectures, allowing the team to vote based on performance metrics.";
        
        if (currentRound === 3) setTechText(text);
        if (currentRound === 4) setHrText(text);
        setRecording(false);
      }, 3000);
    }
  };

  if (authLoading || !activeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-sm text-gray-400">Loading exam sessions...</p>
        </div>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="min-h-screen py-10 px-6 max-w-4xl mx-auto space-y-6 flex flex-col justify-between">
      {/* Upper Status Line */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Mock Preparation Process</span>
          <h2 className="text-lg font-black text-white">{activeSession.job_role}</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
          <Clock className="w-4 h-4 text-violet-400" />
          <span>Timer: {currentRound === 1 ? formatTime(timer) : "Unlimited"}</span>
        </div>
      </div>

      {/* Primary Interative Window */}
      <div className="flex-1 flex flex-col justify-center my-6">
        <AnimatePresence mode="wait">
          
          {/* ROUND 1: APTITUDE */}
          {currentRound === 1 && (
            <motion.div 
              key="round1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                  Round 1: Cognitive Aptitude
                </span>
              </div>

              {aptitudeQuestions.map((q, idx) => (
                <div key={q.id} className="glass-card rounded-3xl p-6 space-y-4">
                  <p className="text-sm font-semibold text-white">Q{idx + 1}. {q.question}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {q.options && Object.entries(q.options).map(([optKey, optText]) => {
                      const isSelected = aptitudeAnswers[q.id] === optKey;
                      return (
                        <button
                          key={optKey}
                          onClick={() => setAptitudeAnswers({ ...aptitudeAnswers, [q.id]: optKey })}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all ${
                            isSelected 
                              ? "bg-violet-600/10 border-violet-500 text-white shadow-md shadow-violet-500/5" 
                              : "bg-zinc-950 border-white/5 text-gray-300 hover:border-white/10"
                          }`}
                        >
                          <span className="font-extrabold mr-2">{optKey}.</span> {optText}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                onClick={() => handleAptitudeSubmit()}
                disabled={loadingAction}
                className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Round 1 & Advance"}
              </button>
            </motion.div>
          )}

          {/* ROUND 2: GROUP DISCUSSION */}
          {currentRound === 2 && (
            <motion.div 
              key="round2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                  Round 2: Simulated Group Discussion
                </span>
                <h3 className="text-xl font-bold text-white mt-4">Select discussion topic to begin:</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {gdTopics.map((topic) => {
                  const isSelected = selectedTopic?.id === topic.id;
                  return (
                    <div 
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-6 rounded-2xl cursor-pointer border glass-card transition-all ${
                        isSelected ? "border-violet-500 bg-violet-600/5" : "border-white/5 hover:border-white/10"
                      }`}
                    >
                      <h4 className="font-bold text-sm text-white mb-2">{topic.title}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{topic.description}</p>
                    </div>
                  );
                })}
              </div>

              {selectedTopic && (
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Draft Your Contribution:</span>
                    <button 
                      onClick={toggleRecording}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all ${
                        recording 
                          ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" 
                          : "bg-white/5 border-white/5 text-gray-300 hover:text-white"
                      }`}
                    >
                      {recording ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Stop Recording (0:{gdTimer < 10 ? "0" : ""}{gdTimer} left)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Simulate Voice (1 Min)</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <textarea
                    rows={4}
                    className="w-full p-4 rounded-2xl bg-zinc-950 border border-white/5 text-xs text-gray-200 focus:outline-none focus:border-violet-500 resize-none"
                    placeholder="Type or dictate your discussion entry..."
                    value={gdText}
                    onChange={(e) => setGdText(e.target.value)}
                  />

                  <button
                    onClick={handleGDSubmit}
                    disabled={loadingAction || !gdText.trim()}
                    className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Contribution"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ROUND 3: TECHNICAL INTERVIEW */}
          {currentRound === 3 && (
            <motion.div 
              key="round3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                  Round 3: Core Technical Mock
                </span>
                <p className="text-xs text-gray-400 mt-2">Question {activeTechIndex + 1} of {techQuestions.length}</p>
              </div>

              {techQuestions[activeTechIndex] && (
                <div className="space-y-4">
                  <div className="glass-card rounded-3xl p-6 space-y-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded">
                      Topic: {techQuestions[activeTechIndex].topic}
                    </span>
                    <h3 className="font-extrabold text-sm text-white leading-relaxed">{techQuestions[activeTechIndex].question}</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Response Editor:</span>
                      <button 
                        onClick={toggleRecording}
                        className="flex items-center gap-1 bg-white/5 text-[10px] px-2.5 py-1.5 rounded-full border border-white/5 hover:text-white"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        Dictate Answer
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      className="w-full p-4 rounded-2xl bg-zinc-950 border border-white/5 text-xs text-gray-200 focus:outline-none focus:border-violet-500 resize-none font-mono"
                      placeholder="Write your explanation or code block answer..."
                      value={techText}
                      onChange={(e) => setTechText(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleTechSubmit}
                    disabled={loadingAction || !techText.trim()}
                    className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Answer"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ROUND 4: HR INTERVIEW */}
          {currentRound === 4 && (
            <motion.div 
              key="round4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                  Round 4: HR & Behavioral Assessment
                </span>
                <p className="text-xs text-gray-400 mt-2">Question {activeHRIndex + 1} of {hrQuestions.length}</p>
              </div>

              {/* Webcam View Feed */}
              {cameraStream ? (
                <div className="relative w-full max-w-md mx-auto h-52 rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 text-[9px] font-bold text-white uppercase tracking-widest animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    Webcam Monitoring Active
                  </div>
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                    <span>Posture & Pacing Check</span>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md mx-auto h-52 rounded-3xl border border-dashed border-white/10 bg-zinc-950/40 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <Globe className="w-8 h-8 text-gray-500 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Camera Access Requested</h4>
                    <p className="text-[10px] text-gray-400 mt-1 max-w-xs">To assess confidence, posture, and facial indicators, please enable your camera feed.</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold rounded-xl text-[10px] transition-all"
                  >
                    Allow Webcam Feed
                  </button>
                </div>
              )}

              {hrQuestions[activeHRIndex] && (
                <div className="space-y-4">
                  <div className="glass-card rounded-3xl p-6 space-y-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded">
                      Category: {hrQuestions[activeHRIndex].category}
                    </span>
                    <h3 className="font-extrabold text-sm text-white leading-relaxed">{hrQuestions[activeHRIndex].question}</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Response Input (STAR method suggested):</span>
                      <button 
                        onClick={toggleRecording}
                        className="flex items-center gap-1 bg-white/5 text-[10px] px-2.5 py-1.5 rounded-full border border-white/5 hover:text-white"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        Dictate Answer
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      className="w-full p-4 rounded-2xl bg-zinc-950 border border-white/5 text-xs text-gray-200 focus:outline-none focus:border-violet-500 resize-none"
                      placeholder="Situation, Task, Action, Result explanation..."
                      value={hrText}
                      onChange={(e) => setHrText(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleHRSubmit}
                    disabled={loadingAction || !hrText.trim()}
                    className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit HR Response"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ROUND 5: COMPLETED */}
          {currentRound === 5 && (
            <motion.div 
              key="round5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto shadow-lg shadow-violet-500/10">
                <Award className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Interview Rounds Completed!</h2>
                <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  Your answers have been graded. The AI Engine has calculated cumulative scores and mapped your customized learning roadmap.
                </p>
              </div>

              <button
                onClick={() => {
                  router.push(`/interview/report/${activeSession.id}`);
                  resetSession();
                }}
                className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-violet-500/20"
              >
                Access Evaluation Report
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Progress Tracker bar */}
      <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-4">
        {[
          { title: "Aptitude", step: 1 },
          { title: "GD Session", step: 2 },
          { title: "Technical", step: 3 },
          { title: "HR STAR", step: 4 },
        ].map((round) => {
          const isDone = currentRound > round.step;
          const isActive = currentRound === round.step;
          return (
            <div key={round.title} className="space-y-1">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isDone ? "bg-teal-400" : isActive ? "bg-violet-500 animate-pulse" : "bg-white/0"
                  }`}
                  style={{ width: isDone || isActive ? "100%" : "0%" }}
                />
              </div>
              <span className={`text-[9px] font-bold block ${
                isDone ? "text-teal-400" : isActive ? "text-violet-400" : "text-gray-600"
              }`}>
                {round.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
