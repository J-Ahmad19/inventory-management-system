"use client";

import { useCallback, useEffect, useState } from "react";
import type { Alert, DashboardMetrics, RealtimeEvent } from "@/lib/types";

interface RealtimeState {
  connected: boolean;
  metrics: DashboardMetrics | null;
  alerts: Alert[];
  lastEvent: RealtimeEvent | null;
}

export function useRealtime() {
  const [state, setState] = useState<RealtimeState>({
    connected: false,
    metrics: null,
    alerts: [],
    lastEvent: null,
  });

  const refreshMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setState((prev) => ({ ...prev, metrics: data.metrics }));
    } catch {
      // ignore fetch errors during reconnect
    }
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      eventSource = new EventSource("/api/events");

      eventSource.onopen = () => {
        setState((prev) => ({ ...prev, connected: true }));
      };

      eventSource.onmessage = (event) => {
        const data: RealtimeEvent = JSON.parse(event.data);

        if (data.type === "init") {
          const payload = data.payload as { metrics: DashboardMetrics; alerts: Alert[] };
          setState((prev) => ({
            ...prev,
            metrics: payload.metrics,
            alerts: payload.alerts,
            lastEvent: data,
          }));
        } else if (data.type === "metrics") {
          setState((prev) => ({
            ...prev,
            metrics: data.payload as DashboardMetrics,
            lastEvent: data,
          }));
        } else if (data.type === "alert") {
          setState((prev) => ({
            ...prev,
            alerts: [data.payload as Alert, ...prev.alerts].slice(0, 10),
            lastEvent: data,
          }));
        } else {
          setState((prev) => ({ ...prev, lastEvent: data }));
          if (data.type === "stock_update" || data.type === "movement") {
            refreshMetrics();
          }
        }
      };

      eventSource.onerror = () => {
        setState((prev) => ({ ...prev, connected: false }));
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [refreshMetrics]);

  return state;
}
