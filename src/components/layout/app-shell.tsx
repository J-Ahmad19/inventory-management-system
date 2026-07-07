"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile nav bar */}
      <div className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur-xl md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <h1 className="text-sm font-bold text-white">StockFlow</h1>
        <div className="w-10" />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar isMobile={false} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <Sidebar isMobile={true} onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="min-h-screen grid-pattern pt-16 md:ml-64 md:pt-0">
        {children}
      </main>
    </div>
  );
}
