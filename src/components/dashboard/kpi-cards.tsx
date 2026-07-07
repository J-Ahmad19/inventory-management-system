"use client";

import {
  AlertTriangle,
  ArrowDownUp,
  DollarSign,
  Package,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { DashboardMetrics } from "@/lib/types";

interface KpiCardsProps {
  metrics: DashboardMetrics;
}

const kpiConfig = [
  {
    key: "totalUnits" as const,
    label: "Total Units",
    icon: Package,
    format: formatNumber,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    key: "totalValue" as const,
    label: "Inventory Value",
    icon: DollarSign,
    format: formatCurrency,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    key: "criticalStockCount" as const,
    label: "Critical Items",
    icon: AlertTriangle,
    format: formatNumber,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    key: "activeAlerts" as const,
    label: "Active Alerts",
    icon: TrendingDown,
    format: formatNumber,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    key: "fillRate" as const,
    label: "Fill Rate",
    icon: TrendingUp,
    format: (v: number) => `${v}%`,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    key: "turnoverRate" as const,
    label: "Turnover Rate",
    icon: ArrowDownUp,
    format: (v: number) => `${v}x`,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

export function KpiCards({ metrics }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = metrics[kpi.key];
        return (
          <Card key={kpi.key} className="glow-emerald transition-transform hover:scale-[1.02]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${kpi.bg}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{kpi.format(value)}</p>
              <p className="text-xs text-slate-500">{kpi.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
