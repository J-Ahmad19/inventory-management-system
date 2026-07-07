"use client";

import { useEffect, useState } from "react";
import { MapPin, Package, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { Location } from "@/lib/types";

const typeIcons = {
  WAREHOUSE: Warehouse,
  RETAIL: Package,
  DARK_STORE: MapPin,
};

export function LocationsGrid() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => {
        setLocations(d.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load locations:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        Loading locations...
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <MapPin className="mb-2 h-8 w-8 opacity-50" />
        <p>No locations found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {locations.map((loc) => {
        const Icon = typeIcons[loc.type as keyof typeof typeIcons] ?? MapPin;
        const typeLabel = loc.type.replace(/_/g, " ");

        return (
          <Card key={loc.id} className="transition-transform hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base">{loc.name}</CardTitle>
                  <p className="text-xs text-slate-500">
                    {new Date(loc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{typeLabel}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-lg font-bold text-white">
                    {formatNumber(loc.capacity)}
                  </p>
                  <p className="text-[10px] text-slate-500">Capacity</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{loc.type}</p>
                  <p className="text-[10px] text-slate-500">Type</p>
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                  <span>Created</span>
                  <span>{new Date(loc.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Last updated: {new Date(loc.updated_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
