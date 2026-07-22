"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Sparkles, Loader2, Minimize2 } from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

interface Message { role: "user" | "assistant"; content: string; }

const SUGGESTIONS = [
  "Explain Big O notation",
  "STAR method for HR rounds",
  "Top Amazon system design topics",
];

export default function ChatbotWidget() {
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your SAN AI Career Coach 🚀\n\nAsk me anything — interview prep, system design, resume tips, or aptitude puzzles!" }
  ]);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (isOpen) setUnread(0);
  }, [messages, isOpen]);

  if (!isAuthenticated || !user) return null;

  const handleSend = async (e?: React.FormEvent, preset?: string) => {
    if (e) e.preventDefault();
    const text = preset || message.trim();
    if (!text || sending) return;
    setMessage("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await api.post("/chatbot/chat", {
        message: text,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
      if (!isOpen) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally { setSending(false); }
  };

  return (
    <>
      {/* ── Floating Bubble ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="w-[360px] sm:w-[400px] h-[520px] flex flex-col bg-[#0d0d11] border border-white/[0.07] rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-gradient-to-r from-violet-950/40 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-teal-400 border-2 border-[#0d0d11]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">AI Career Coach</p>
                    <p className="text-[10px] text-teal-400 font-semibold">● Online · Ready to help</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="w-3 h-3 text-violet-400" />
                      </div>
                    )}
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-tr-sm"
                        : "bg-white/[0.05] border border-white/[0.06] text-gray-200 rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {sending && (
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-violet-400" />
                    </div>
                    <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 150, 300].map(d => (
                          <div key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {messages.length < 3 && (
                <div className="px-4 pb-2 flex gap-2 flex-wrap">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => handleSend(undefined, s)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.06] text-[10px] font-semibold text-gray-400 hover:text-white transition-all active:scale-95">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-white/[0.05] flex gap-2">
                <input
                  type="text" value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Ask anything…"
                  className="glass-input flex-1 py-2.5 text-xs"
                  disabled={sending}
                />
                <button type="submit" disabled={!message.trim() || sending}
                  className="w-10 h-10 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 flex items-center justify-center text-white transition-all active:scale-95 shrink-0">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger Button */}
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
          onClick={() => setIsOpen(o => !o)}
          className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-violet-600/30 border border-violet-500/30 text-white"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sparkles className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Unread badge */}
          {unread > 0 && !isOpen && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 border-2 border-[#09090b] flex items-center justify-center text-[10px] font-black text-white">
              {unread}
            </motion.div>
          )}
        </motion.button>
      </div>
    </>
  );
}
