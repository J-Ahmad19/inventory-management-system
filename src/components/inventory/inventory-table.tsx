"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Filter, RefreshCw, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Inventory, Product, Location } from "@/lib/types";
import { StockAdjustmentModal } from "./stock-adjustment-modal";

interface InventoryTableProps {
  initialSearch?: string;
}

export function InventoryTable({ initialSearch = "" }: InventoryTableProps) {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [locations, setLocations] = useState<Map<string, Location>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [locationId, setLocationId] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [adjustingInventory, setAdjustingInventory] = useState<Inventory | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (locationId) params.set("locationId", locationId);

      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();

      const productMap = new Map<string, Product>();
      const locationMap = new Map<string, Location>();

      data.data?.forEach((inv: Inventory) => {
        if (inv.product) productMap.set(inv.product_id, inv.product);
        if (inv.location) locationMap.set(inv.location_id, inv.location);
      });

      setInventory(data.data || []);
      setProducts(productMap);
      setLocations(locationMap);
      setAllLocations(Array.from(locationMap.values()));
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
    setLoading(false);
  }, [locationId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const getStatusColor = (onHand: number, reorderPoint: number) => {
    if (onHand === 0) return "border-red-500/30 bg-red-500/10 text-red-400";
    if (onHand <= reorderPoint) return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  };

  const getStatusLabel = (onHand: number, reorderPoint: number) => {
    if (onHand === 0) return "Out of Stock";
    if (onHand <= reorderPoint) return "Low Stock";
    return "In Stock";
  };

  // Filter inventory by search
  const filteredInventory = inventory.filter((inv) => {
    const product = products.get(inv.product_id);
    if (!product) return false;
    if (search && !product.name.toLowerCase().includes(search.toLowerCase()) &&
        !product.sku.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group inventory by product
  const groupedByProduct = new Map<string, Inventory[]>();
  filteredInventory.forEach((inv) => {
    if (!groupedByProduct.has(inv.product_id)) {
      groupedByProduct.set(inv.product_id, []);
    }
    groupedByProduct.get(inv.product_id)!.push(inv);
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {adjustingInventory && (
        <StockAdjustmentModal
          inventory={adjustingInventory}
          onClose={() => setAdjustingInventory(null)}
          onSave={() => {
            setAdjustingInventory(null);
            fetchInventory();
          }}
        />
      )}

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-200 sm:w-auto"
            >
              <option value="">All Locations</option>
              {allLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInventory}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
            <div className="flex items-center gap-1 text-xs text-slate-500 sm:ml-auto">
              <Filter className="h-3.5 w-3.5" />
              {filteredInventory.length} items
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 sticky top-0 bg-slate-900/50">
                  <th className="pb-3 pr-2 sm:pr-4 font-medium">Product</th>
                  <th className="pb-3 pr-2 sm:pr-4 font-medium hidden sm:table-cell">SKU</th>
                  <th className="pb-3 pr-2 sm:pr-4 font-medium hidden md:table-cell">Category</th>
                  <th className="pb-3 pr-2 sm:pr-4 font-medium">On Hand</th>
                  <th className="pb-3 pr-2 sm:pr-4 font-medium hidden md:table-cell">Allocated</th>
                  <th className="pb-3 pr-2 sm:pr-4 font-medium hidden lg:table-cell">Reorder</th>
                  <th className="pb-3 pr-2 sm:pr-4 font-medium hidden xl:table-cell">Value</th>
                  <th className="pb-3 pr-2 sm:pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(groupedByProduct.entries()).map(([productId, invList]) => {
                  const product = products.get(productId);
                  if (!product) return null;

                  const totalOnHand = invList.reduce((sum, i) => sum + i.qty_on_hand, 0);
                  const totalAllocated = invList.reduce((sum, i) => sum + i.qty_allocated, 0);
                  const totalValue = totalOnHand * product.base_price;

                  return (
                    <Fragment key={productId}>
                      <tr
                        className="cursor-pointer border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
                        onClick={() =>
                          setExpandedId(expandedId === productId ? null : productId)
                        }
                      >
                        <td className="py-2 sm:py-3 pr-2 sm:pr-4 font-medium text-slate-200 text-xs sm:text-sm">
                          {product.name}
                        </td>
                        <td className="py-2 sm:py-3 pr-2 sm:pr-4 font-mono text-xs text-slate-400 hidden sm:table-cell">
                          {product.sku}
                        </td>
                        <td className="py-2 sm:py-3 pr-2 sm:pr-4 text-slate-400 hidden md:table-cell text-xs">
                          {product.category}
                        </td>
                        <td className="py-2 sm:py-3 pr-2 sm:pr-4 text-slate-300 font-semibold">
                          {formatNumber(totalOnHand)}
                        </td>
                        <td className="py-2 sm:py-3 pr-2 sm:pr-4 text-slate-300 hidden md:table-cell text-xs">
                          {formatNumber(totalAllocated)}
                        </td>
                        <td className="py-2 sm:py-3 pr-2 sm:pr-4 text-slate-300 hidden lg:table-cell text-xs">
                          {formatNumber(invList[0]?.reorder_point || 0)}
                        </td>
                        <td className="py-2 sm:py-3 pr-2 sm:pr-4 text-slate-400 hidden xl:table-cell text-xs">
                          {formatCurrency(totalValue / 100)}
                        </td>
                        <td className="py-2 sm:py-3 pr-2 sm:pr-4">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(totalOnHand, invList[0]?.reorder_point || 0)}`}
                          >
                            {getStatusLabel(totalOnHand, invList[0]?.reorder_point || 0)}
                          </span>
                        </td>
                      </tr>
                      {expandedId === productId && (
                        <tr className="bg-slate-900/50">
                          <td colSpan={8} className="px-3 sm:px-4 py-3">
                            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                              {invList.map((inv) => {
                                const loc = locations.get(inv.location_id);
                                return (
                                  <div
                                    key={inv.id}
                                    className="rounded-lg border border-slate-800 p-3"
                                  >
                                    <p className="text-xs font-medium text-slate-300">
                                      {loc?.name || "Unknown"}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-lg font-bold text-white">
                                        {inv.qty_on_hand}
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        available ({inv.qty_allocated} allocated)
                                      </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <Badge
                                        variant={inv.qty_on_hand === 0 ? "destructive" : "secondary"}
                                      >
                                        {getStatusLabel(inv.qty_on_hand, inv.reorder_point)}
                                      </Badge>
                                      <button
                                        onClick={() => setAdjustingInventory(inv)}
                                        className="ml-auto text-[10px] text-slate-400 hover:text-slate-200"
                                      >
                                        <Settings2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-2 flex gap-4 text-xs text-slate-500">
                              <span>Lead Time: {product.lead_time_days}d</span>
                              <span>Base Price: {formatCurrency(product.base_price / 100)}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
