"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/hooks/use-realtime";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { connected, alerts } = useRealtime();
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/60 px-8 backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search inventory..."
            className="w-64 pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = (e.target as HTMLInputElement).value;
                if (q) window.location.href = `/inventory?search=${encodeURIComponent(q)}`;
              }
            }}
          />
        </div>

        <button className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200">
          <Bell className="h-5 w-5" />
          {activeAlerts > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {activeAlerts}
            </span>
          )}
        </button>

        <Badge variant={connected ? "success" : "danger"} className="hidden sm:flex">
          {connected ? "Real-time" : "Offline"}
        </Badge>
      </div>
    </header>
  );
}
