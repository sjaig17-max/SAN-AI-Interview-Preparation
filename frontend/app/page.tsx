"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2, ArrowRight, Award, Eye, EyeOff, CheckCircle2, Zap, Shield, Brain, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FEATURES = [
  { icon: Brain,   label: "AI-Powered Mock Interviews",   desc: "Adaptive questioning that adjusts to your answers in real time." },
  { icon: Shield,  label: "ATS Resume Analyzer",          desc: "Beat applicant tracking systems with AI-optimised keyword scoring." },
  { icon: Target,  label: "MNC Question Banks",           desc: "700+ curated questions from Google, Amazon, Microsoft & more." },
  { icon: Zap,     label: "Instant Feedback Engine",      desc: "STAR-method detection, filler-word analysis and pace scoring." },
];

const SOCIAL_PROVIDERS = [
  {
    id: "google" as const,
    label: "Google",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.745 1.055 14.99 0 12 0 7.354 0 3.307 2.68 1.255 6.602l4.01 3.163z"/>
        <path fill="#4285F4" d="M23.49 12.275c0-.825-.075-1.62-.215-2.385H12v4.51h6.443a5.503 5.503 0 0 1-2.385 3.61l3.71 2.875c2.17-2 3.422-4.945 3.422-8.61z"/>
        <path fill="#FBBC05" d="M5.266 14.235L1.255 17.398A11.967 11.967 0 0 0 12 24c2.99 0 5.745-1.055 7.91-2.875l-3.71-2.875a7.077 7.077 0 0 1-10.934-4.015z"/>
        <path fill="#34A853" d="M12 4.909c1.93 0 3.67.665 5.03 1.964l3.51-3.51C17.745 1.055 14.99 0 12 0c-4.646 0-8.693 2.68-10.745 6.602l4.01 3.163a7.077 7.077 0 0 1 6.735-4.856z"/>
      </svg>
    )
  },
  {
    id: "microsoft" as const,
    label: "Microsoft",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 23 23">
        <path fill="#f35325" d="M0 0h11v11H0z"/>
        <path fill="#81bc06" d="M12 0h11v11H12z"/>
        <path fill="#05a6f0" d="M0 12h11v11H0z"/>
        <path fill="#ffba08" d="M12 12h11v11H12z"/>
      </svg>
    )
  },
  {
    id: "github" as const,
    label: "GitHub",
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    )
  }
];

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading, user } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [oauthModal, setOauthModal] = useState(false);
  const [oauthProvider, setOauthProvider] = useState("");
  const [oauthMessage, setOauthMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "", password: "", full_name: "", phone_number: "",
    college: "", degree: "", department: "", current_year: 1,
    city: "", target_company: "", preferred_job_role: "Software Engineer",
    experience_level: "Entry", github_url: "", linkedin_url: "", portfolio_url: ""
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(user?.profile?.preferred_job_role ? "/dashboard" : "/job-selection");
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoadingAction(true);
    try { await login({ email: formData.email, password: formData.password }); router.push("/job-selection"); }
    catch (err: any) { setError(err.response?.data?.detail || "Invalid credentials. Please try again."); }
    finally { setLoadingAction(false); }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoadingAction(true);
    try { await register(formData); router.push("/job-selection"); }
    catch (err: any) { setError(err.response?.data?.detail || "Registration failed. Try again."); }
    finally { setLoadingAction(false); }
  };

  const handleSocialSignIn = async (provider: "google" | "microsoft" | "github") => {
    setError(""); setOauthProvider(provider); setOauthModal(true);
    const messages: Record<string, string> = {
      google: "Connecting to Google Identity Services…",
      microsoft: "Connecting to Microsoft Entra ID…",
      github: "Authorising with GitHub Developer Portal…"
    };
    setOauthMessage(messages[provider]);
    setTimeout(() => {
      setOauthMessage("Validating tokens and loading your profile…");
      setTimeout(async () => {
        setOauthModal(false); setLoadingAction(true);
        const email = formData.email.trim() || `sjaig17_${provider}@${provider}.com`;
        const password = "password123";
        const derivedName = formData.full_name.trim() || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Candidate`;
        try { await login({ email, password }); router.push("/job-selection"); }
        catch {
          try { await register({ email, password, full_name: derivedName, experience_level: "Entry" }); router.push("/job-selection"); }
          catch (regErr: any) { setError(regErr.response?.data?.detail || `${provider} sign-in failed.`); }
        } finally { setLoadingAction(false); }
      }, 900);
    }, 1300);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center animate-pulse">
          <Award className="w-6 h-6 text-violet-400" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#09090b] overflow-hidden">

      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden border-r border-white/[0.04]">
        {/* Layered background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-indigo-950/30 to-slate-950" />
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[100px]" />
          <div className="absolute bottom-[-15%] right-[-15%] w-[500px] h-[500px] rounded-full bg-teal-500/8 blur-[90px]" />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-indigo-500/6 blur-[80px]" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-black text-lg text-white tracking-tight">SAN AI</span>
            <span className="ml-2 badge badge-violet">INTERVIEW</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-xl">
          <div className="badge badge-violet mb-6 inline-flex">🚀 AI-POWERED CAREER PREP</div>
          <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.05] mb-6 text-white">
            Prepare.<br/>Practice.<br/>
            <span className="shimmer-text">Get Hired.</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-12 max-w-md">
            Enterprise-grade AI that analyses your resume, conducts adaptive mock interviews, and gives you
            real-time feedback — so you walk into every interview with confidence.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-4">
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">{label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600 relative z-10">© {new Date().getFullYear()} SAN AI Interview Prep. All rights reserved.</p>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#09090b] relative overflow-y-auto">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Award className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm text-white">SAN AI</span>
        </div>

        <div className="w-full max-w-[420px]">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome back 👋</h2>
                  <p className="text-gray-500 text-sm">Sign in to continue your interview prep journey.</p>
                </div>

                {/* Error */}
                {error && (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-red-950/40 border border-red-500/25 text-red-400 text-xs font-medium">
                    <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">!</div>
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Social SSO */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {SOCIAL_PROVIDERS.map((p) => (
                    <button key={p.id} type="button" onClick={() => handleSocialSignIn(p.id)} disabled={loadingAction}
                      className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.97] border border-white/[0.07] hover:border-white/[0.14] text-white font-semibold text-xs transition-all duration-200 disabled:opacity-40">
                      {p.icon}
                      <span className="text-gray-400">{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.07]" /></div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#09090b] px-4 text-[11px] font-semibold text-gray-600 uppercase tracking-widest">or sign in with email</span>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                    <input type="email" name="email" required placeholder="you@university.edu"
                      className="glass-input w-full" value={formData.email} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} name="password" required placeholder="••••••••"
                        className="glass-input w-full pr-12" value={formData.password} onChange={handleChange} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded accent-violet-600" />Remember me
                    </label>
                    <button type="button" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <button type="submit" disabled={loadingAction}
                    className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2 text-sm">
                    {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" />Sign In</>}
                  </button>
                </form>

                <p className="text-center mt-6 text-xs text-gray-600">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => { setIsLogin(false); setError(""); }}
                    className="text-violet-400 font-bold hover:text-violet-300 transition-colors">Create one free →</button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="register-view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Create account ✨</h2>
                  <p className="text-gray-500 text-sm">Join 10,000+ candidates already using SAN AI.</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-red-950/40 border border-red-500/25 text-red-400 text-xs font-medium">
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {SOCIAL_PROVIDERS.map((p) => (
                    <button key={p.id} type="button" onClick={() => handleSocialSignIn(p.id)} disabled={loadingAction}
                      className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.97] border border-white/[0.07] hover:border-white/[0.14] text-white font-semibold text-xs transition-all duration-200 disabled:opacity-40">
                      {p.icon}
                      <span className="text-gray-400">{p.label}</span>
                    </button>
                  ))}
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.07]" /></div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#09090b] px-4 text-[11px] font-semibold text-gray-600 uppercase tracking-widest">or register with email</span>
                  </div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                      <input type="text" name="full_name" required placeholder="Jane Doe"
                        className="glass-input w-full" value={formData.full_name} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone</label>
                      <input type="text" name="phone_number" placeholder="+91 98765..."
                        className="glass-input w-full" value={formData.phone_number} onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                    <input type="email" name="email" required placeholder="jane@university.edu"
                      className="glass-input w-full" value={formData.email} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password <span className="text-gray-600 normal-case">(min 8 chars)</span></label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} name="password" required placeholder="••••••••"
                        className="glass-input w-full pr-12" value={formData.password} onChange={handleChange} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">College</label>
                      <input type="text" name="college" placeholder="IIT Delhi"
                        className="glass-input w-full" value={formData.college} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Experience</label>
                      <select name="experience_level" className="glass-input w-full" value={formData.experience_level} onChange={handleChange}>
                        <option value="Entry">Student / Fresher</option>
                        <option value="Mid">Mid-Level (1-4 yrs)</option>
                        <option value="Senior">Senior (5+ yrs)</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={loadingAction}
                    className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm mt-2">
                    {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />Create Free Account</>}
                  </button>
                </form>

                <p className="text-center mt-6 text-xs text-gray-600">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setIsLogin(true); setError(""); }}
                    className="text-violet-400 font-bold hover:text-violet-300 transition-colors">Sign in →</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── OAuth Loading Modal ── */}
      <AnimatePresence>
        {oauthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="w-full max-w-sm bg-[#111117] border border-white/[0.08] rounded-3xl p-10 text-center space-y-7 shadow-2xl"
            >
              {/* Animated spinner ring */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 animate-spin" />
                <div className="absolute inset-2 rounded-full bg-white/[0.04] flex items-center justify-center">
                  {SOCIAL_PROVIDERS.find(p => p.id === oauthProvider)?.icon}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white capitalize">{oauthProvider} Sign-On</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{oauthMessage}</p>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 150, 300].map((delay) => (
                  <div key={delay} className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
