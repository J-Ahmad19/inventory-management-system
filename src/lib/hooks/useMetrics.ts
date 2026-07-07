import useSWR from "swr";
import { DashboardMetrics } from "../types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export function useMetrics() {
  const { data, error, isLoading, mutate } = useSWR<DashboardMetrics>(
    "/api/metrics",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    metrics: data,
    error,
    isLoading,
    mutate,
  };
}
