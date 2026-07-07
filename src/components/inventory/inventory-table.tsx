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
    <div className="space-y-4">
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
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-10 rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-200"
            >
              <option value="">All Locations</option>
              {allLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={fetchInventory} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              {filteredInventory.length} items
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Product</th>
                  <th className="pb-3 pr-4 font-medium">SKU</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">On Hand</th>
                  <th className="pb-3 pr-4 font-medium">Allocated</th>
                  <th className="pb-3 pr-4 font-medium">Reorder Point</th>
                  <th className="pb-3 pr-4 font-medium">Value</th>
                  <th className="pb-3 font-medium">Status</th>
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
                        <td className="py-3 pr-4 font-medium text-slate-200">
                          {product.name}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-slate-400">
                          {product.sku}
                        </td>
                        <td className="py-3 pr-4 text-slate-400">{product.category}</td>
                        <td className="py-3 pr-4 text-slate-300">
                          {formatNumber(totalOnHand)}
                        </td>
                        <td className="py-3 pr-4 text-slate-300">
                          {formatNumber(totalAllocated)}
                        </td>
                        <td className="py-3 pr-4 text-slate-300">
                          {formatNumber(invList[0]?.reorder_point || 0)}
                        </td>
                        <td className="py-3 pr-4 text-slate-400">
                          {formatCurrency(totalValue / 100)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(totalOnHand, invList[0]?.reorder_point || 0)}`}
                          >
                            {getStatusLabel(totalOnHand, invList[0]?.reorder_point || 0)}
                          </span>
                        </td>
                      </tr>
                      {expandedId === productId && (
                        <tr className="bg-slate-900/50">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
