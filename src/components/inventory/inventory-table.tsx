"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStatusColor, getStatusLabel } from "@/lib/engine/inventory-engine";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Category, InventoryItem, Location } from "@/lib/types";

interface InventoryTableProps {
  initialSearch?: string;
}

export function InventoryTable({ initialSearch = "" }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (locationId) params.set("locationId", locationId);
    if (status) params.set("status", status);

    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setItems(data.items);
    setCategories(data.categories);
    setLocations(data.locations);
    setLoading(false);
  }, [search, categoryId, locationId, status]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search by name, SKU, or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-200"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-10 rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-200"
            >
              <option value="">All Locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="critical">Critical</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstock">Overstock</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchInventory}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              {items.length} items
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
                  <th className="pb-3 pr-4 font-medium">Total Stock</th>
                  <th className="pb-3 pr-4 font-medium">Available</th>
                  <th className="pb-3 pr-4 font-medium">Value</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Locations</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <Fragment key={item.id}>
                    <tr
                      className="cursor-pointer border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
                      onClick={() =>
                        setExpandedId(expandedId === item.id ? null : item.id)
                      }
                    >
                      <td className="py-3 pr-4 font-medium text-slate-200">
                        {item.name}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-400">
                        {item.sku}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{item.categoryName}</td>
                      <td className="py-3 pr-4 text-slate-300">
                        {formatNumber(item.totalQuantity)}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {formatNumber(item.totalAvailable)}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">
                        {formatCurrency(item.totalQuantity * item.unitCost)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(item.status)}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {item.locations.length} loc
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr className="bg-slate-900/50">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {item.locations.map((loc) => (
                              <div
                                key={loc.locationId}
                                className="rounded-lg border border-slate-800 p-3"
                              >
                                <p className="text-xs font-medium text-slate-300">
                                  {loc.locationName}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-lg font-bold text-white">
                                    {loc.available}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    / {loc.quantity} ({loc.reserved} reserved)
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    loc.status === "in_stock"
                                      ? "success"
                                      : loc.status === "critical" ||
                                          loc.status === "out_of_stock"
                                        ? "danger"
                                        : "warning"
                                  }
                                  className="mt-1"
                                >
                                  {getStatusLabel(loc.status)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex gap-4 text-xs text-slate-500">
                            <span>Supplier: {item.supplier}</span>
                            <span>Reorder Point: {item.reorderPoint}</span>
                            <span>Lead Time: {item.leadTimeDays}d</span>
                            <span>Unit Cost: {formatCurrency(item.unitCost)}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
