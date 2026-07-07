"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Location, LocationType } from "@/lib/types";

interface LocationFormProps {
  location?: Location | null;
  onClose: () => void;
  onSave: () => void;
}

const locationTypes: LocationType[] = ["WAREHOUSE", "RETAIL", "DARK_STORE"];

export function LocationForm({ location, onClose, onSave }: LocationFormProps) {
  const [formData, setFormData] = useState({
    name: location?.name || "",
    type: location?.type || "WAREHOUSE" as LocationType,
    capacity: location?.capacity || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.name) {
        throw new Error("Name is required");
      }

      const url = location ? `/api/locations/${location.id}` : "/api/locations";
      const method = location ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save location");
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
        <CardTitle>{location ? "Edit Location" : "Create Location"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Location Name</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
              placeholder="e.g., Main Warehouse"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Location Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as LocationType })
              }
              disabled={loading}
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-200"
            >
              {locationTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Capacity (units)
            </label>
            <Input
              type="number"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
              }
              disabled={loading}
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Location"}
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
