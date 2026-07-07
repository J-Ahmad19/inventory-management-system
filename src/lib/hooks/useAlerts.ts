import useSWR from "swr";
import { Alert } from "../types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export function useAlerts(unacknowledgedOnly = false) {
  const query = unacknowledgedOnly ? "?unacknowledged=true" : "";

  const { data, error, isLoading, mutate } = useSWR<{ data: Alert[] }>(
    `/api/alerts${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId, acknowledged: true }),
      });
      mutate();
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  return {
    alerts: data?.data || [],
    error,
    isLoading,
    mutate,
    acknowledgeAlert,
  };
}
