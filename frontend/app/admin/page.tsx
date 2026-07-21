"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { 
  ArrowLeft, Search, Plus, UploadCloud, Download, Users, FileText, Database, 
  Settings, CheckCircle2, ShieldAlert, Sparkles, Check, Trash2
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");

  // Simulated Database entries
  const [usersList, setUsersList] = useState([
    { id: "1", name: "Jane Doe", email: "jane@harvard.edu", role: "USER", status: "Active" },
    { id: "2", name: "Alex Smith", email: "alex@state.edu", role: "USER", status: "Active" },
    { id: "3", name: "Sarah Connor", email: "sarah@mit.edu", role: "ADMIN", status: "Active" },
  ]);

  const [questionsList, setQuestionsList] = useState([
    { id: "101", question: "Explain decorator wrapper execution in Python.", type: "Technical", diff: "Medium" },
    { id: "102", question: "Describe difference between a B-Tree and Hash Index in Postgres.", type: "Technical", diff: "Hard" },
    { id: "103", question: "Tell me about a time you worked in a high conflict team environment.", type: "HR Behavioral", diff: "Medium" },
  ]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.is_admin)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, authLoading, router]);

  const handleExportCSV = () => {
    // Generate simulated CSV string and trigger download
    const csvContent = "data:text/csv;charset=utf-8,ID,Question,Type,Difficulty\n" + 
      questionsList.map((q: any) => `${q.id},"${q.question.replace(/"/g, '""')}",${q.type},${q.diff}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "questions_bank_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = () => {
    // Simulate adding questions from file upload
    setQuestionsList([
      ...questionsList,
      { id: "104", question: "Describe Next.js 15 routing parameters.", type: "Technical", diff: "Easy" }
    ]);
  };

  const handleDeleteUser = (id: string) => {
    setUsersList(usersList.filter((u: any) => u.id !== id));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-6 max-w-6xl mx-auto space-y-8">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white transition-all text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-400 animate-spin" />
          ENTERPRISE ADMIN PANEL
        </h1>
      </div>

      {/* Main Tab Controller Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: "users", title: "User Accounts", icon: Users },
            { id: "questions", title: "Question Bank", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive 
                    ? "bg-violet-600/15 border-violet-500/35 text-violet-400" 
                    : "bg-white/2 border-white/5 text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.title}
              </button>
            );
          })}
        </div>

        {/* Tab display window */}
        <div className="lg:col-span-9 glass-card rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-white/5 text-xs text-gray-200 focus:outline-none"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {activeTab === "questions" && (
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={handleImportCSV}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  Import CSV
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-2xl">
            {activeTab === "users" ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/2 border-b border-white/5 text-gray-400 font-bold">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.filter((u: any) => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map((u: any) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/2">
                      <td className="p-4 font-semibold text-white">{u.name}</td>
                      <td className="p-4 text-gray-400">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === "ADMIN" ? "bg-red-500/10 text-red-400" : "bg-violet-500/10 text-violet-400"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/2 border-b border-white/5 text-gray-400 font-bold">
                    <th className="p-4">ID</th>
                    <th className="p-4">Question</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {questionsList.filter((q: any) => q.question.toLowerCase().includes(searchQuery.toLowerCase())).map((q: any) => (
                    <tr key={q.id} className="border-b border-white/5 hover:bg-white/2">
                      <td className="p-4 font-mono text-gray-500">{q.id}</td>
                      <td className="p-4 font-semibold text-white max-w-sm truncate">{q.question}</td>
                      <td className="p-4 text-gray-400">{q.type}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400">
                          {q.diff}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
