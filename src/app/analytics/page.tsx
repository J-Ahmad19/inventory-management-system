"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { AppShell } from "@/components/layout/app-shell";
import { PredictionsTable } from "@/components/dashboard/predictions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ReplenishmentPrediction, ShrinkageReport } from "@/lib/types";

export default function AnalyticsPage() {
  const [predictions, setPredictions] = useState<ReplenishmentPrediction[]>([]);
  const [shrinkage, setShrinkage] = useState<ShrinkageReport[]>([]);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => {
        setPredictions(d.predictions);
        setShrinkage(d.shrinkage);
      });
  }, []);

  const totalReplenishmentCost = predictions.reduce((s, p) => s + p.estimatedCost, 0);
  const totalShrinkageLoss = shrinkage.reduce((s, r) => s + r.estimatedLoss, 0);
  const criticalCount = predictions.filter((p) => p.urgency === "critical").length;

  return (
    <AppShell>
      <Header
        title="Analytics & Intelligence"
        description="AI-powered replenishment predictions and shrinkage analysis"
      />
      <div className="space-y-6 p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-2xl font-bold text-white">{predictions.length}</p>
              <p className="text-xs text-slate-500">Items Needing Replenishment</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
              <p className="text-xs text-slate-500">Critical Urgency Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(totalReplenishmentCost)}
              </p>
              <p className="text-xs text-slate-500">Estimated Replenishment Cost</p>
            </CardContent>
          </Card>
        </div>

        <PredictionsTable predictions={predictions} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Shrinkage Analysis</CardTitle>
            <Badge variant="danger">
              Total Loss: {formatCurrency(totalShrinkageLoss)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Product</th>
                    <th className="pb-3 pr-4 font-medium">Location</th>
                    <th className="pb-3 pr-4 font-medium">Expected</th>
                    <th className="pb-3 pr-4 font-medium">Actual</th>
                    <th className="pb-3 pr-4 font-medium">Variance</th>
                    <th className="pb-3 font-medium">Est. Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {shrinkage.map((s) => (
                    <tr
                      key={`${s.productId}-${s.locationId}`}
                      className="border-b border-slate-800/50"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-200">
                        {s.productName}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{s.locationName}</td>
                      <td className="py-3 pr-4 text-slate-300">{s.expectedQty}</td>
                      <td className="py-3 pr-4 text-slate-300">{s.actualQty}</td>
                      <td className="py-3 pr-4 text-red-400">
                        -{s.variance} ({s.variancePercent.toFixed(1)}%)
                      </td>
                      <td className="py-3 font-medium text-red-400">
                        {formatCurrency(s.estimatedLoss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supply Chain Optimization Insights</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InsightCard
              title="Cross-Location Transfers"
              description="3 items at West Retail Hub can be replenished from Central Warehouse instead of new purchase orders, saving an estimated $2,400."
              variant="success"
            />
            <InsightCard
              title="Consolidate Orders"
              description="Bundle replenishment for 4 products from TechSound Inc. into a single PO to reduce shipping costs by 18%."
              variant="info"
            />
            <InsightCard
              title="Safety Stock Adjustment"
              description="Food & Beverage category has 22% overstock at East Coast DC. Consider redistributing 340 units to South Regional Store."
              variant="warning"
            />
            <InsightCard
              title="Shrinkage Prevention"
              description="Enable cycle counting at West Retail Hub — 3 of 4 shrinkage incidents occurred at this location in the past 30 days."
              variant="danger"
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function InsightCard({
  title,
  description,
  variant,
}: {
  title: string;
  description: string;
  variant: "success" | "info" | "warning" | "danger";
}) {
  const borderColors = {
    success: "border-emerald-500/20",
    info: "border-blue-500/20",
    warning: "border-amber-500/20",
    danger: "border-red-500/20",
  };

  return (
    <div className={`rounded-lg border p-4 ${borderColors[variant]}`}>
      <div className="mb-2 flex items-center gap-2">
        <Badge variant={variant}>{title.split(" ")[0]}</Badge>
        <p className="text-sm font-medium text-slate-200">{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}
