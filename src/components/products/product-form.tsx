"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/types";

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

export function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const [formData, setFormData] = useState({
    sku: product?.sku || "",
    name: product?.name || "",
    category: product?.category || "",
    lead_time_days: product?.lead_time_days || 7,
    base_price: product ? product.base_price / 100 : 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        base_price: Math.round(formData.base_price * 100),
      };

      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save product");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? "Edit Product" : "Create Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">SKU</label>
            <Input
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              disabled={loading || !!product}
              placeholder="e.g., LAPTOP-001"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Name</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              placeholder="Product name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Category</label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={loading}
              placeholder="e.g., Electronics"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Lead Time (days)</label>
              <Input
                type="number"
                value={formData.lead_time_days}
                onChange={(e) =>
                  setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })
                }
                disabled={loading}
                min="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Base Price ($)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.base_price}
                onChange={(e) =>
                  setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })
                }
                disabled={loading}
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Product"}
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
