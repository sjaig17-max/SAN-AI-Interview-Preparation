"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code, Layout, Server, Database, Shield, GitBranch, PenTool, Search, 
  Terminal, Sparkles, User, BarChart, Loader2, Briefcase, HeartPulse,
  GraduationCap, DollarSign, Globe, Scale, ArrowRight
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

export default function JobSelectionPage() {
  const router = useRouter();
  const { updateProfile } = useAuthStore();
  
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredRoles = ROLES.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProceed = async () => {
    const finalRole = selectedRole === "Other (Type custom role)" ? customRole.trim() : selectedRole;
    if (!finalRole) return;

    setSaving(true);
    try {
      await updateProfile({ preferred_job_role: finalRole });
      router.push("/resume"); // Redirect to Page 3: Resume Upload & Analysis
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-6 max-w-6xl mx-auto flex flex-col justify-center">
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4"
        >
          Select Your Target{" "}
          <span className="bg-gradient-to-r from-violet-400 to-teal-300 bg-clip-text text-transparent">
            Job Role
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 max-w-lg mx-auto text-sm md:text-base"
        >
          We will customize your resume ATS analyzer, learning streak objectives, and interview questions specifically for this career pathway.
        </motion.p>
      </div>

      {/* Search Filter */}
      <div className="max-w-md mx-auto w-full mb-10 relative">
        <Search className="w-5 h-5 text-gray-500 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search global industries and roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl glass-input text-sm"
        />
      </div>

      {saving && (
        <div className="fixed inset-0 bg-[#09090b]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
            <p className="text-sm font-semibold">Configuring your AI dashboard...</p>
          </div>
        </div>
      )}

      {/* Job Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredRoles.map((role, idx) => {
          const IconComp = role.icon;
          const isSelected = selectedRole === role.name;

          return (
            <motion.div
              key={role.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => setSelectedRole(role.name)}
              className={`p-6 rounded-2xl cursor-pointer glass-card flex flex-col justify-between h-48 border transition-all ${
                isSelected 
                  ? "border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/20" 
                  : "border-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400"
                }`}>
                  <IconComp className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  {role.category}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-base mb-1">{role.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{role.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Custom Other Form Option */}
      <AnimatePresence>
        {selectedRole === "Other (Type custom role)" && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 max-w-xl mx-auto w-full glass-card p-6 rounded-2xl border border-violet-500/30 overflow-hidden"
          >
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Specify Custom Job Role</label>
            <input 
              type="text" 
              placeholder="e.g. Blockchain Developer, Flight Attendant, Baker..." 
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-input text-sm"
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proceed Button */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={handleProceed}
          disabled={
            !selectedRole || 
            (selectedRole === "Other (Type custom role)" && !customRole.trim()) || 
            saving
          }
          className="px-8 py-3.5 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
        >
          Proceed to Resume Upload
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
