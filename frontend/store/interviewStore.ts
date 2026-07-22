import { create } from "zustand";
import { api } from "@/lib/api";

interface Session {
  id: string;
  job_role: string;
  experience_level: string;
  current_round: number;
  overall_score: number;
  status: string;
  persona?: string;
}

interface Question {
  id: string;
  question: string;
  options?: Record<string, string>;
  subject?: string;
  topic?: string;
  difficulty?: string;
  category?: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface InterviewState {
  activeSession: Session | null;
  currentRound: number;
  aptitudeQuestions: Question[];
  gdTopics: Topic[];
  techQuestions: Question[];
  hrQuestions: Question[];
  activeTechIndex: number;
  activeHRIndex: number;
  isLoading: boolean;
  
  startInterview: (jobRole: string, expLevel: string, persona?: string) => Promise<Session>;
  checkActiveSession: () => Promise<void>;
  loadRoundData: () => Promise<void>;
  submitAptitude: (answers: Record<string, string>, duration: number) => Promise<void>;
  submitGD: (topicId: string, answerText: string) => Promise<void>;
  submitTechnicalAnswer: (questionId: string, answerText: string) => Promise<void>;
  submitHRAnswer: (questionId: string, answerText: string) => Promise<void>;
  resetSession: () => void;
}

export const useInterviewStore = create<InterviewState>((set: any, get: any) => ({
  activeSession: null,
  currentRound: 1,
  aptitudeQuestions: [],
  gdTopics: [],
  techQuestions: [],
  hrQuestions: [],
  activeTechIndex: 0,
  activeHRIndex: 0,
  isLoading: false,

  startInterview: async (jobRole: any, expLevel: any, persona = "Neutral") => {
    set({ isLoading: true });
    try {
      const res = await api.post("/interview/session", {
        job_role: jobRole,
        experience_level: expLevel,
        persona: persona
      });
      const session = res.data;
      set({ 
        activeSession: session, 
        currentRound: session.current_round,
        activeTechIndex: 0,
        activeHRIndex: 0
      });
      return session;
    } catch (err) {
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  checkActiveSession: async () => {
    try {
      const res = await api.get("/interview/session/active");
      if (res.data) {
        const session = res.data;
        set({ 
          activeSession: session, 
          currentRound: session.current_round 
        });
      } else {
        set({ activeSession: null });
      }
    } catch (err) {
      set({ activeSession: null });
    }
  },

  loadRoundData: async () => {
    const session = get().activeSession;
    if (!session) return;
    
    set({ isLoading: true });
    try {
      const round = session.current_round;
      if (round === 1) {
        const res = await api.get(`/interview/session/${session.id}/aptitude`);
        set({ aptitudeQuestions: res.data });
      } else if (round === 2) {
        const res = await api.get(`/interview/session/${session.id}/gd`);
        set({ gdTopics: res.data });
      } else if (round === 3) {
        const res = await api.get(`/interview/session/${session.id}/technical`);
        set({ techQuestions: res.data });
      } else if (round === 4) {
        const res = await api.get(`/interview/session/${session.id}/hr`);
        set({ hrQuestions: res.data });
      }
    } catch (err) {
      console.error("Failed to load round questions", err);
    } finally {
      set({ isLoading: false });
    }
  },

  submitAptitude: async (answers: any, duration: any) => {
    const session = get().activeSession;
    if (!session) return;
    set({ isLoading: true });
    try {
      await api.post("/interview/submit/aptitude", {
        session_id: session.id,
        answers,
        duration_seconds: duration,
      });
      // Refresh session
      const sessRes = await api.get(`/interview/session/${session.id}`);
      set({ activeSession: sessRes.data, currentRound: sessRes.data.current_round });
    } catch (err) {
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  submitGD: async (topicId: any, answerText: any) => {
    const session = get().activeSession;
    if (!session) return;
    set({ isLoading: true });
    try {
      await api.post("/interview/submit/gd", {
        session_id: session.id,
        topic_id: topicId,
        answer_text: answerText,
      });
      // Refresh session
      const sessRes = await api.get(`/interview/session/${session.id}`);
      set({ activeSession: sessRes.data, currentRound: sessRes.data.current_round });
    } catch (err) {
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  submitTechnicalAnswer: async (questionId: any, answerText: any) => {
    const session = get().activeSession;
    if (!session) return;
    set({ isLoading: true });
    try {
      await api.post("/interview/submit/technical", {
        session_id: session.id,
        question_id: questionId,
        user_answer: answerText,
      });
      
      // Re-fetch questions to include newly generated follow-up
      const questionsRes = await api.get(`/interview/session/${session.id}/technical`);
      const updatedQuestions = questionsRes.data;
      set({ techQuestions: updatedQuestions });
      
      const newIndex = get().activeTechIndex + 1;
      const total = updatedQuestions.length;
      
      if (newIndex >= total) {
        // All technical answers submitted, reload session state from DB
        const sessRes = await api.get(`/interview/session/${session.id}`);
        set({ 
          activeSession: sessRes.data, 
          currentRound: sessRes.data.current_round,
          activeTechIndex: 0
        });
      } else {
        set({ activeTechIndex: newIndex });
      }
    } catch (err) {
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  submitHRAnswer: async (questionId: any, answerText: any) => {
    const session = get().activeSession;
    if (!session) return;
    set({ isLoading: true });
    try {
      await api.post("/interview/submit/hr", {
        session_id: session.id,
        question_id: questionId,
        user_answer: answerText,
      });
      
      // Re-fetch questions to include newly generated follow-up
      const questionsRes = await api.get(`/interview/session/${session.id}/hr`);
      const updatedQuestions = questionsRes.data;
      set({ hrQuestions: updatedQuestions });
      
      const newIndex = get().activeHRIndex + 1;
      const total = updatedQuestions.length;
      
      if (newIndex >= total) {
        // All HR answers submitted, session is completed
        const sessRes = await api.get(`/interview/session/${session.id}`);
        set({ 
          activeSession: sessRes.data, 
          currentRound: sessRes.data.current_round,
          activeHRIndex: 0
        });
      } else {
        set({ activeHRIndex: newIndex });
      }
    } catch (err) {
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  resetSession: () => {
    set({
      activeSession: null,
      currentRound: 1,
      aptitudeQuestions: [],
      gdTopics: [],
      techQuestions: [],
      hrQuestions: [],
      activeTechIndex: 0,
      activeHRIndex: 0,
    });
  },
}));
