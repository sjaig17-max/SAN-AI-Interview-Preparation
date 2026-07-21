"use client";

import "@/app/globals.css";
import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <html lang="en">
      <body className="gradient-bg text-white selection:bg-violet-600 selection:text-white">
        <QueryClientProvider client={queryClient}>
          <div className="relative min-h-screen flex flex-col">
            {/* Ambient background glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
            
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
