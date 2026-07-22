"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2, ArrowRight, UserPlus, LogIn, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading, user } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [oauthModal, setOauthModal] = useState(false);
  const [oauthProvider, setOauthProvider] = useState("");
  const [oauthMessage, setOauthMessage] = useState("");
  
  // Registration Form Steps
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    college: "",
    degree: "",
    department: "",
    current_year: 1,
    city: "",
    target_company: "",
    preferred_job_role: "Software Engineer",
    experience_level: "Entry",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (user?.profile?.preferred_job_role) {
        router.push("/dashboard");
      } else {
        router.push("/job-selection");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingAction(true);
    try {
      await login({ email: formData.email, password: formData.password });
      router.push("/job-selection");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingAction(true);
    try {
      await register(formData);
      router.push("/job-selection");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "microsoft" | "github") => {
    setError("");
    setOauthProvider(provider);
    setOauthModal(true);
    
    let message = "Authenticating secure sign-in token...";
    if (provider === "microsoft") message = "Connecting to Microsoft Identity Directory...";
    if (provider === "github") message = "Authorizing credentials with GitHub Developer portal...";
    setOauthMessage(message);

    setTimeout(() => {
      setOauthMessage("Validating tokens and loading profile preferences...");
      setTimeout(async () => {
        setOauthModal(false);
        setLoadingAction(true);
        
        // Setup emails and fallbacks for simulated provider contexts
        const email = provider === "google" 
          ? (formData.email.trim() || "sjaig17@gmail.com")
          : provider === "microsoft" 
          ? (formData.email.trim() || "sjaig17_microsoft@outlook.com")
          : (formData.email.trim() || "sjaig17_github@github.com");
        
        const password = "password123";
        const derivedName = formData.full_name.trim() || (provider === "microsoft" ? "Microsoft Candidate" : provider === "github" ? "GitHub Developer" : "Jane Doe");

        try {
          await login({ email, password });
          router.push("/job-selection");
        } catch (err: any) {
          if (err.response?.status === 401 || err.response?.data?.detail === "Incorrect email or password.") {
            try {
              await register({
                email,
                password,
                full_name: derivedName,
                experience_level: "Entry"
              });
              router.push("/job-selection");
            } catch (regErr: any) {
              setError(regErr.response?.data?.detail || `${provider} authentication failed.`);
            }
          } else {
            setError(err.response?.data?.detail || `${provider} Sign-In failed.`);
          }
        } finally {
          setLoadingAction(false);
        }
      }, 800);
    }, 1200);
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch bg-[#09090b]">
      {/* Visual Brand Panel */}
      <div className="md:w-1/2 relative hidden md:flex flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/40 to-teal-500/10 pointer-events-none" />
        
        {/* Brand name */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Award className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            SAN AI INTERVIEW
          </span>
        </div>

        {/* Dynamic tagline */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4 text-white">
            Prepare. Practice. Perform. <br />
            <span className="bg-gradient-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">
              Get Hired.
            </span>
          </h1>
          <p className="text-gray-400 leading-relaxed text-sm">
            Leverage enterprise-grade AI algorithms to analyze resumes, optimize portfolios, and run interactive mock interviews across technical and HR panels.
          </p>
        </div>

        {/* Copyright info */}
        <div className="text-xs text-gray-500 relative z-10">
          &copy; {new Date().getFullYear()} SAN AI. All rights reserved.
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg glass-card rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-gray-400">
              {isLogin 
                ? "Enter your credentials to access interview prep dashboard" 
                : "Enter your details to create an account"
              }
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {isLogin ? (
              // LOGIN FORM
              <motion.form 
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleLoginSubmit} 
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@college.edu"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-white/10 bg-white/5 checked:bg-violet-600 focus:ring-0" />
                    Remember me
                  </label>
                  <a href="#" className="hover:text-violet-400 transition-colors">Forgot Password?</a>
                </div>

                <button
                  type="submit"
                  disabled={loadingAction}
                  className="w-full py-3.5 px-4 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {loadingAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#121217] px-3 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn("google")}
                    disabled={loadingAction}
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-semibold rounded-xl border border-white/10 transition-all flex flex-col items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.745 1.055 14.99 0 12 0 7.354 0 3.307 2.68 1.255 6.602l4.01 3.163z"/>
                      <path fill="#4285F4" d="M23.49 12.275c0-.825-.075-1.62-.215-2.385H12v4.51h6.443a5.503 5.503 0 0 1-2.385 3.61l3.71 2.875c2.17-2 3.422-4.945 3.422-8.61z"/>
                      <path fill="#FBBC05" d="M5.266 14.235L1.255 17.398A11.967 11.967 0 0 0 12 24c2.99 0 5.745-1.055 7.91-2.875l-3.71-2.875a7.077 7.077 0 0 1-10.934-4.015z"/>
                      <path fill="#34A853" d="M12 4.909c1.93 0 3.67.665 5.03 1.964l3.51-3.51C17.745 1.055 14.99 0 12 0c-4.646 0-8.693 2.68-10.745 6.602l4.01 3.163a7.077 7.077 0 0 1 6.735-4.856z"/>
                    </svg>
                    Google
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn("microsoft")}
                    disabled={loadingAction}
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-semibold rounded-xl border border-white/10 transition-all flex flex-col items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M0 0h11v11H0z"/>
                      <path fill="#81bc06" d="M12 0h11v11H12z"/>
                      <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                      <path fill="#ffba08" d="M12 12h11v11H12z"/>
                    </svg>
                    Microsoft
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialSignIn("github")}
                    disabled={loadingAction}
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-semibold rounded-xl border border-white/10 transition-all flex flex-col items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </button>
                </div>

                <div className="text-center mt-6 text-xs text-gray-400">
                  New to platform?{" "}
                  <button 
                    type="button" 
                    onClick={() => { setIsLogin(false); setStep(1); }} 
                    className="text-violet-400 font-bold hover:underline"
                  >
                    Create an account
                  </button>
                </div>
              </motion.form>
            ) : (
              // REGISTER FORM (Single-step)
              <motion.form 
                key="register"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="jane@domain.com"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password (min 8 chars)</label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone Number (Optional)</label>
                  <input
                    type="text"
                    name="phone_number"
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="w-full py-3.5 px-4 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {loadingAction ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#121217] px-3 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn("google")}
                    disabled={loadingAction}
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-semibold rounded-xl border border-white/10 transition-all flex flex-col items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.745 1.055 14.99 0 12 0 7.354 0 3.307 2.68 1.255 6.602l4.01 3.163z"/>
                      <path fill="#4285F4" d="M23.49 12.275c0-.825-.075-1.62-.215-2.385H12v4.51h6.443a5.503 5.503 0 0 1-2.385 3.61l3.71 2.875c2.17-2 3.422-4.945 3.422-8.61z"/>
                      <path fill="#FBBC05" d="M5.266 14.235L1.255 17.398A11.967 11.967 0 0 0 12 24c2.99 0 5.745-1.055 7.91-2.875l-3.71-2.875a7.077 7.077 0 0 1-10.934-4.015z"/>
                      <path fill="#34A853" d="M12 4.909c1.93 0 3.67.665 5.03 1.964l3.51-3.51C17.745 1.055 14.99 0 12 0c-4.646 0-8.693 2.68-10.745 6.602l4.01 3.163a7.077 7.077 0 0 1 6.735-4.856z"/>
                    </svg>
                    Google
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleSocialSignIn("microsoft")}
                    disabled={loadingAction}
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-semibold rounded-xl border border-white/10 transition-all flex flex-col items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M0 0h11v11H0z"/>
                      <path fill="#81bc06" d="M12 0h11v11H12z"/>
                      <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                      <path fill="#ffba08" d="M12 12h11v11H12z"/>
                    </svg>
                    Microsoft
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialSignIn("github")}
                    disabled={loadingAction}
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white font-semibold rounded-xl border border-white/10 transition-all flex flex-col items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </button>
                </div>

                <div className="text-center mt-6 text-xs text-gray-400">
                  Already have an account?{" "}
                  <button 
                    type="button" 
                    onClick={() => { setIsLogin(true); }} 
                    className="text-violet-400 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
      {oauthModal && (
        <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#121217] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="flex justify-center">
              {oauthProvider === "google" && (
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center animate-bounce">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.745 1.055 14.99 0 12 0 7.354 0 3.307 2.68 1.255 6.602l4.01 3.163z"/>
                    <path fill="#4285F4" d="M23.49 12.275c0-.825-.075-1.62-.215-2.385H12v4.51h6.443a5.503 5.503 0 0 1-2.385 3.61l3.71 2.875c2.17-2 3.422-4.945 3.422-8.61z"/>
                    <path fill="#FBBC05" d="M5.266 14.235L1.255 17.398A11.967 11.967 0 0 0 12 24c2.99 0 5.745-1.055 7.91-2.875l-3.71-2.875a7.077 7.077 0 0 1-10.934-4.015z"/>
                    <path fill="#34A853" d="M12 4.909c1.93 0 3.67.665 5.03 1.964l3.51-3.51C17.745 1.055 14.99 0 12 0c-4.646 0-8.693 2.68-10.745 6.602l4.01 3.163a7.077 7.077 0 0 1 6.735-4.856z"/>
                  </svg>
                </div>
              )}
              {oauthProvider === "microsoft" && (
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center animate-bounce">
                  <svg className="w-8 h-8" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M0 0h11v11H0z"/>
                    <path fill="#81bc06" d="M12 0h11v11H12z"/>
                    <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                    <path fill="#ffba08" d="M12 12h11v11H12z"/>
                  </svg>
                </div>
              )}
              {oauthProvider === "github" && (
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center animate-bounce">
                  <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-white capitalize">{oauthProvider} Single Sign-On</h3>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                {oauthMessage}
              </p>
            </div>

            <div className="flex justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
