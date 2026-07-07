"use client";

import { useEffect, useState } from "react";
import { MapPin, Package, User, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

interface LocationData {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  capacity: number;
  manager: string;
  used: number;
  utilization: number;
  skuCount: number;
}

const typeIcons = {
  warehouse: Warehouse,
  distribution: Package,
  store: MapPin,
};

export function LocationsGrid() {
  const [locations, setLocations] = useState<LocationData[]>([]);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => setLocations(d.locations));
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {locations.map((loc) => {
        const Icon = typeIcons[loc.type as keyof typeof typeIcons] ?? MapPin;
        const utilizationColor =
          loc.utilization > 80
            ? "bg-red-500"
            : loc.utilization > 60
              ? "bg-amber-500"
              : "bg-emerald-500";

        return (
          <Card key={loc.id} className="transition-transform hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-base">{loc.name}</CardTitle>
                  <p className="text-xs text-slate-500">{loc.code}</p>
                </div>
              </div>
              <Badge variant="outline">{loc.type}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-400">{loc.address}</p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-lg font-bold text-white">
                    {formatNumber(loc.used)}
                  </p>
                  <p className="text-[10px] text-slate-500">Units Stored</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{loc.skuCount}</p>
                  <p className="text-[10px] text-slate-500">SKUs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{loc.utilization}%</p>
                  <p className="text-[10px] text-slate-500">Utilization</p>
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                  <span>Capacity</span>
                  <span>
                    {formatNumber(loc.used)} / {formatNumber(loc.capacity)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${utilizationColor}`}
                    style={{ width: `${Math.min(loc.utilization, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <User className="h-3.5 w-3.5" />
                {loc.manager}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
