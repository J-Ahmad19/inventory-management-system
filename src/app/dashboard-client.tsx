"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import {
  CategoryChart,
  LocationUtilizationChart,
  StockTrendChart,
} from "@/components/dashboard/charts";
import { AlertsFeed } from "@/components/dashboard/alerts-feed";
import { PredictionsTable } from "@/components/dashboard/predictions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/hooks/use-realtime";
import type {
  Alert,
  DashboardMetrics,
  ReplenishmentPrediction,
  ShrinkageReport,
  StockMovement,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  metrics: DashboardMetrics;
  trends: Array<{ day: string; inbound: number; outbound: number; shrinkage: number }>;
  categories: Array<{ name: string; units: number; value: number }>;
  locations: Array<{ name: string; utilization: number; used: number; capacity: number }>;
  recentMovements: StockMovement[];
  predictions: ReplenishmentPrediction[];
  shrinkage: ShrinkageReport[];
}

const movementColors: Record<string, string> = {
  inbound: "text-emerald-400",
  outbound: "text-cyan-400",
  transfer: "text-violet-400",
  adjustment: "text-amber-400",
  shrinkage: "text-red-400",
};

export default function DashboardPage() {
  const { metrics: liveMetrics, alerts: liveAlerts } = useRealtime();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const metrics = liveMetrics ?? data?.metrics;
  const displayAlerts = liveAlerts.length > 0 ? liveAlerts : data?.recentMovements || [];

  if (!data && !metrics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Header
        title="Dashboard"
        description="Real-time inventory overview across all locations"
      />
      <div className="space-y-6 p-8">
        {metrics && <KpiCards metrics={metrics} />}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {data && <StockTrendChart data={data.trends} />}
          </div>
          <div>
            <AlertsFeed alerts={displayAlerts} compact />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {data && <CategoryChart data={data.categories} />}
          {data && <LocationUtilizationChart data={data.locations} />}
        </div>

        {data && data.predictions.length > 0 && (
          <PredictionsTable predictions={data.predictions} />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Movements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.recentMovements.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {mov.type}
                      </Badge>
                      <span className="text-sm text-slate-300">
                        {mov.quantity} units
                      </span>
                      {mov.reference && (
                        <span className="text-xs text-slate-500">{mov.reference}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium capitalize ${movementColors[mov.type]}`}
                    >
                      {mov.type}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data && data.shrinkage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shrinkage Detection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.shrinkage.map((s) => (
                  <div
                    key={`${s.productId}-${s.locationId}`}
                    className="flex items-center justify-between rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {s.productName}
                      </p>
                      <p className="text-xs text-slate-500">{s.locationName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-400">
                        -{s.variance} units ({s.variancePercent.toFixed(0)}%)
                      </p>
                      <p className="text-xs text-slate-500">
                        Loss: {formatCurrency(s.estimatedLoss)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
