"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code, Layout, Server, Database, Shield, GitBranch, PenTool, Search, 
  Terminal, Sparkles, User, BarChart, Loader2, Briefcase, HeartPulse,
  GraduationCap, DollarSign, Globe, Scale, ArrowRight, Check
} from "lucide-react";

interface RoleOption {
  name: string;
  category: string;
  desc: string;
  icon: React.ComponentType<any>;
}

const ROLES: RoleOption[] = [
  // Tech & Engineering
  { name: "Software Engineer", category: "Technology", desc: "Solve algorithmic challenges and build core systems.", icon: Code },
  { name: "Frontend Developer", category: "Technology", desc: "Construct responsive layout structures and pixel-perfect UIs.", icon: Layout },
  { name: "Backend Developer", category: "Technology", desc: "Design secure scalable APIs, databases, and message queues.", icon: Server },
  { name: "Full Stack Developer", category: "Technology", desc: "Manage frontend screens and backend server deployments.", icon: Terminal },
  { name: "AI Engineer", category: "Technology", desc: "Build neural network layers and integrate LLM pipelines.", icon: Sparkles },
  { name: "Data Scientist", category: "Technology", desc: "Perform statistical queries, datasets analyses, and visualizations.", icon: Database },
  { name: "DevOps Engineer", category: "Technology", desc: "Deploy Docker files, configure CI/CD paths, and Nginx.", icon: GitBranch },
  { name: "Cyber Security Analyst", category: "Technology", desc: "Inspect network vulnerabilities, firewall logs, and encryption.", icon: Shield },
  
  // Design & Creative
  { name: "UI UX Designer", category: "Design", desc: "Sketch wireframes, build high fidelity figma flows, and colors.", icon: PenTool },
  { name: "Graphic Designer", category: "Design", desc: "Create high-impact branding materials and digital illustrations.", icon: Layout },
  
  // Business & Operations
  { name: "Project Manager", category: "Business", desc: "Track engineering milestones, plan sprints, and direct projects.", icon: Briefcase },
  { name: "Data Analyst", category: "Business", desc: "Interpret data logs, configure SQL queries, and present reports.", icon: BarChart },
  { name: "HR Manager", category: "Business", desc: "Coordinate recruitments, verify candidates, and culture fits.", icon: User },
  
  // Finance
  { name: "Financial Analyst", category: "Finance", desc: "Inspect corporate balance sheets, audit budgets, and forecasts.", icon: DollarSign },
  
  // Healthcare & Science
  { name: "Medical Doctor", category: "Healthcare", desc: "Diagnose patient symptoms, prescribe cures, and treatments.", icon: HeartPulse },
  
  // Education & Legal
  { name: "Teacher / Professor", category: "Education", desc: "Design syllabus curricula, evaluate tests, and teach classes.", icon: GraduationCap },
  { name: "Lawyer / Attorney", category: "Legal", desc: "Represent legal disputes, inspect contracts, and arguments.", icon: Scale },
  
  // Other/Custom
  { name: "Other (Type custom role)", category: "Custom", desc: "Enter a job role not listed in our global list.", icon: Globe }
];

const steps = [
  { id: 1, label: "Account Setup", status: "complete" },
  { id: 2, label: "Target Pathway", status: "current" },
  { id: 3, label: "ATS Resume Scan", status: "upcoming" },
  { id: 4, label: "Simulated Interview", status: "upcoming" }
];

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Technology":
      return {
        glow: "hover:border-violet-500/40 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]",
        selected: "border-violet-500 bg-violet-600/10 shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)]",
        badge: "text-violet-400 bg-violet-500/10 border-violet-500/20",
        iconBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
        iconSelected: "bg-violet-600 text-white border-violet-500"
      };
    case "Design":
      return {
        glow: "hover:border-pink-500/40 hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)]",
        selected: "border-pink-500 bg-pink-600/10 shadow-[0_0_30px_-5px_rgba(236,72,153,0.4)]",
        badge: "text-pink-400 bg-pink-500/10 border-pink-500/20",
        iconBg: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        iconSelected: "bg-pink-600 text-white border-pink-500"
      };
    case "Business":
      return {
        glow: "hover:border-amber-500/40 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]",
        selected: "border-amber-500 bg-amber-600/10 shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)]",
        badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        iconSelected: "bg-amber-600 text-white border-amber-500"
      };
    case "Finance":
      return {
        glow: "hover:border-emerald-500/40 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]",
        selected: "border-emerald-500 bg-emerald-600/10 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]",
        badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        iconSelected: "bg-emerald-600 text-white border-emerald-500"
      };
    case "Healthcare":
      return {
        glow: "hover:border-sky-500/40 hover:shadow-[0_0_30px_-5px_rgba(14,165,233,0.3)]",
        selected: "border-sky-500 bg-sky-600/10 shadow-[0_0_30px_-5px_rgba(14,165,233,0.4)]",
        badge: "text-sky-400 bg-sky-500/10 border-sky-500/20",
        iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        iconSelected: "bg-sky-600 text-white border-sky-500"
      };
    case "Education":
      return {
        glow: "hover:border-cyan-500/40 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]",
        selected: "border-cyan-500 bg-cyan-600/10 shadow-[0_0_30px_-5px_rgba(6,182,212,0.4)]",
        badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        iconSelected: "bg-cyan-600 text-white border-cyan-500"
      };
    case "Legal":
      return {
        glow: "hover:border-indigo-500/40 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]",
        selected: "border-indigo-500 bg-indigo-600/10 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)]",
        badge: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        iconSelected: "bg-indigo-600 text-white border-indigo-500"
      };
    default:
      return {
        glow: "hover:border-gray-500/40 hover:shadow-[0_0_30px_-5px_rgba(156,163,175,0.3)]",
        selected: "border-white/30 bg-white/5 shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]",
        badge: "text-gray-400 bg-white/5 border-white/10",
        iconBg: "bg-white/5 text-gray-400 border-white/10",
        iconSelected: "bg-white text-black border-white"
      };
  }
};

export default function JobSelectionPage() {
  const router = useRouter();
  const { updateProfile } = useAuthStore();
  
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [saving, setSaving] = useState(false);
  const [activatingRole, setActivatingRole] = useState("");

  const categories = ["All", "Technology", "Design", "Business & Finance", "Healthcare & Science", "Other"];

  const filteredRoles = ROLES.filter(role => {
    const matchesSearch = 
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeCategory === "All") return true;
    if (activeCategory === "Technology") return role.category === "Technology";
    if (activeCategory === "Design") return role.category === "Design";
    if (activeCategory === "Business & Finance") return role.category === "Business" || role.category === "Finance";
    if (activeCategory === "Healthcare & Science") return role.category === "Healthcare";
    if (activeCategory === "Other") return role.category === "Education" || role.category === "Legal" || role.category === "Custom";
    return true;
  });

  const handleSelectRole = async (roleName: string) => {
    if (activatingRole || saving) return; // Prevent double clicks during redirect
    
    setSelectedRole(roleName);
    
    if (roleName === "Other (Type custom role)") {
      return; // Wait for user to type and click proceed inside the custom form
    }

    setActivatingRole(roleName);
    setSaving(true);
    try {
      await updateProfile({ preferred_job_role: roleName });
      router.push("/resume"); // Direct redirect to Page 3: Resume Upload & Analysis
    } catch (err) {
      console.error(err);
      setSaving(false);
      setActivatingRole("");
    }
  };

  const handleProceedCustom = async () => {
    if (!customRole.trim() || saving) return;
    
    setSaving(true);
    try {
      await updateProfile({ preferred_job_role: customRole.trim() });
      router.push("/resume");
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-6 max-w-6xl mx-auto flex flex-col justify-center relative">
      
      {/* Onboarding Progress Stepper */}
      <div className="max-w-3xl mx-auto w-full mb-12 hidden md:block">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/5 z-0" />
          <div className="absolute left-0 w-1/3 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-violet-600 to-indigo-500 z-0" />

          {steps.map((step) => {
            const isCompleted = step.id < 2;
            const isActive = step.id === 2;
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-300 ${
                  isCompleted 
                    ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/30" 
                    : isActive
                      ? "bg-[#09090b] border-violet-500 text-violet-400 ring-4 ring-violet-500/20 shadow-md"
                      : "bg-[#09090b] border-white/10 text-gray-500"
                }`}>
                  {isCompleted ? <Check className="w-4.5 h-4.5" /> : step.id}
                </div>
                <span className={`text-[11px] mt-2.5 font-medium transition-all ${
                  isActive ? "text-violet-400 font-bold" : isCompleted ? "text-gray-300" : "text-gray-500"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4"
        >
          Select Your Target{" "}
          <span className="bg-gradient-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">
            Job Pathway
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 max-w-lg mx-auto text-sm md:text-base"
        >
          Choose a role to configure your AI dashboard. Selecting a pathway will load tailored ATS resume analysis checklists and mock interviews.
        </motion.p>
      </div>

      {/* Search Filter & Category Tabs */}
      <div className="max-w-xl mx-auto w-full mb-8">
        <div className="relative mb-6">
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search global industries and roles (e.g. Frontend)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input text-sm"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  isActive 
                    ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/25" 
                    : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fullscreen subtle backdrop blur when saving / redirecting */}
      {saving && !activatingRole && (
        <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
            <p className="text-sm font-semibold text-gray-200">Configuring your AI dashboard...</p>
          </div>
        </div>
      )}

      {/* Job Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredRoles.map((role, idx) => {
            const IconComp = role.icon;
            const isSelected = selectedRole === role.name;
            const isActivating = activatingRole === role.name;
            const isAnyActivating = activatingRole !== "";
            const catStyle = getCategoryStyles(role.category);

            return (
              <motion.div
                key={role.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: isAnyActivating && !isActivating ? 0.2 : 1,
                  scale: isAnyActivating && !isActivating ? 0.95 : 1,
                  filter: isAnyActivating && !isActivating ? "blur(2px)" : "blur(0px)"
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={isAnyActivating ? {} : { y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => handleSelectRole(role.name)}
                className={`p-6 rounded-2xl cursor-pointer glass-card flex flex-col justify-between h-48 border transition-all duration-300 relative overflow-hidden group ${
                  isSelected 
                    ? catStyle.selected 
                    : `${catStyle.glow} border-white/5`
                }`}
              >
                {/* Glow ring when activating */}
                {isActivating && (
                  <div className="absolute inset-0 border border-violet-500/80 rounded-2xl animate-pulse pointer-events-none" />
                )}

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                    isSelected ? catStyle.iconSelected : catStyle.iconBg
                  } group-hover:scale-110`}>
                    {isActivating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <IconComp className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full border ${catStyle.badge}`}>
                    {role.category}
                  </span>
                </div>
                
                <div className="relative z-10">
                  <h3 className="font-extrabold text-white text-base mb-1 tracking-tight group-hover:text-violet-400 transition-colors">
                    {role.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {role.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Custom Other Form Option */}
      <AnimatePresence>
        {selectedRole === "Other (Type custom role)" && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: 15 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="mt-8 max-w-xl mx-auto w-full glass-card p-6 rounded-2xl border border-violet-500/30 overflow-hidden"
          >
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Specify Custom Job Role</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="e.g. Blockchain Developer, Flight Attendant, Baker..." 
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl glass-input text-sm focus:ring-2 focus:ring-violet-500/50"
                autoFocus
              />
              <button
                onClick={handleProceedCustom}
                disabled={!customRole.trim() || saving}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Proceed
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
