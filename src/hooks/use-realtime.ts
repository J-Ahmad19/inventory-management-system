"use client";

import { useEffect, useState } from "react";
import type { Alert, DashboardMetrics } from "@/lib/types";

interface RealtimeState {
  metrics: DashboardMetrics | null;
  alerts: Alert[];
}

export function useRealtime() {
  const [state, setState] = useState<RealtimeState>({
    metrics: null,
    alerts: [],
  });

  useEffect(() => {
    // Initial load
    const loadData = async () => {
      try {
        const [metricsRes, alertsRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/alerts?unacknowledged=true"),
        ]);

        const metrics = await metricsRes.json();
        const alertsData = await alertsRes.json();

        setState({
          metrics,
          alerts: alertsData.data || [],
        });
      } catch (error) {
        console.error("Failed to load realtime data:", error);
      }
    };

    loadData();

    // Poll for updates every 5 seconds
    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, []);

  return state;
}
