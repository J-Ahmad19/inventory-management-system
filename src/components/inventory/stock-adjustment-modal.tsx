"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Inventory } from "@/lib/types";

interface StockAdjustmentModalProps {
  inventory: Inventory;
  onClose: () => void;
  onSave: () => void;
}

export function StockAdjustmentModal({
  inventory,
  onClose,
  onSave,
}: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!quantity || quantity === 0) {
        throw new Error("Please enter a quantity change");
      }

      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: inventory.product_id,
          location_id: inventory.location_id,
          quantity_change: quantity,
          reason: reason || "Manual adjustment",
          initiated_by: "User",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to adjust stock");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const newQuantity = inventory.qty_on_hand + quantity;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adjust Stock</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

          <div className="rounded-lg bg-slate-900/50 p-3 text-sm">
            <p className="text-slate-400">
              Current quantity: <span className="font-bold text-white">{inventory.qty_on_hand}</span>
            </p>
            {newQuantity !== inventory.qty_on_hand && (
              <p className="mt-1 text-slate-400">
                New quantity:{" "}
                <span
                  className={`font-bold ${newQuantity >= 0 ? "text-white" : "text-red-400"}`}
                >
                  {newQuantity}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Quantity Change
            </label>
            <Input
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              disabled={loading}
              placeholder="Enter positive or negative number"
            />
            <p className="mt-1 text-xs text-slate-500">
              Positive = add stock, Negative = remove stock
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Reason</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="e.g., Physical count discrepancy"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || quantity === 0}>
              {loading ? "Adjusting..." : "Adjust Stock"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
