import useSWR from "swr";
import { Inventory } from "../types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export function useInventory(productId?: string, locationId?: string) {
  const query = new URLSearchParams();
  if (productId) query.append("productId", productId);
  if (locationId) query.append("locationId", locationId);

  const { data, error, isLoading, mutate } = useSWR<{ data: Inventory[] }>(
    `/api/inventory?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    inventory: data?.data || [],
    error,
    isLoading,
    mutate,
  };
}
