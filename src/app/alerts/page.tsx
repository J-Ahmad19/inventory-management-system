"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { AppShell } from "@/components/layout/app-shell";
import { AlertsFeed } from "@/components/dashboard/alerts-feed";
import { useRealtime } from "@/hooks/use-realtime";
import type { Alert } from "@/lib/types";

export default function AlertsPage() {
  const { alerts: liveAlerts } = useRealtime();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "acknowledged">("active");

  const fetchAlerts = useCallback(async () => {
    const params =
      filter === "active"
        ? "?unacknowledged=true"
        : filter === "acknowledged"
          ? ""
          : "";
    const res = await fetch(`/api/alerts${params}`);
    const data = await res.json();
    setAlerts(data.data || []);
  }, [filter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async (id: string) => {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert_id: id, acknowledged: true }),
    });
    fetchAlerts();
  };

  const displayAlerts =
    liveAlerts.length > 0 && filter === "active"
      ? [...liveAlerts, ...alerts.filter((a) => !liveAlerts.find((l) => l.id === a.id))]
      : alerts;

  return (
    <AppShell>
      <Header
        title="Alerts"
        description="Real-time notifications for stock, shrinkage, and replenishment"
      />
      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8">
        <div className="mb-4 flex flex-wrap gap-2">
          {(["active", "all", "acknowledged"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-emerald-600/10 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <AlertsFeed alerts={displayAlerts} onAcknowledge={handleAcknowledge} />
      </div>
    </AppShell>
  );
}
