"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Sparkles, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotWidget() {
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your SAN AI Career Coach. Ask me anything about MNC coding questions, system design approaches, resume improvements, or aptitude tricks!",
    },
  ]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!isAuthenticated || !user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const userMsg = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setSending(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post("/chatbot/chat", {
        message: userMsg,
        history: chatHistory,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error connecting to the AI client. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="w-[360px] h-[500px] rounded-3xl bg-[#0e0e11]/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden mb-4 backdrop-blur-lg"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-200 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wide uppercase">AI Interview Coach</h4>
                  <span className="text-[9px] text-violet-200 font-bold uppercase tracking-widest">Always Active</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin select-text"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-tr-none shadow-md"
                        : "bg-white/5 border border-white/5 text-gray-300 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 text-xs text-gray-400 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                    <span>Coach is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-zinc-950 flex gap-2">
              <input
                type="text"
                placeholder="Ask about coding, SQL, resumes..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="p-2 bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 active:scale-95 text-white rounded-xl transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-violet-500/35 border border-violet-400/20 hover:opacity-95 focus:outline-none"
      >
        <MessageSquare className="w-6 h-6 animate-pulse" />
      </motion.button>
    </div>
  );
}
