"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ReplenishmentPrediction } from "@/lib/types";

const urgencyVariant = {
  critical: "danger" as const,
  high: "warning" as const,
  medium: "info" as const,
  low: "outline" as const,
};

interface PredictionsTableProps {
  predictions: ReplenishmentPrediction[];
}

export function PredictionsTable({ predictions }: PredictionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Replenishment Predictions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                <th className="pb-3 pr-4 font-medium">Product</th>
                <th className="pb-3 pr-4 font-medium">Location</th>
                <th className="pb-3 pr-4 font-medium">Stock</th>
                <th className="pb-3 pr-4 font-medium">Velocity</th>
                <th className="pb-3 pr-4 font-medium">Days Left</th>
                <th className="pb-3 pr-4 font-medium">Order Qty</th>
                <th className="pb-3 font-medium">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => (
                <tr
                  key={`${p.productId}-${p.locationId}`}
                  className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
                >
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-200">{p.productName}</p>
                    <p className="text-xs text-slate-500">{p.sku}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">{p.locationName}</td>
                  <td className="py-3 pr-4 text-slate-300">{p.currentStock}</td>
                  <td className="py-3 pr-4 text-slate-400">{p.dailyVelocity}/day</td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        p.daysUntilStockout <= 3
                          ? "font-semibold text-red-400"
                          : "text-slate-300"
                      }
                    >
                      {p.daysUntilStockout}d
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">
                    {p.recommendedOrderQty}
                    <span className="ml-1 text-xs text-slate-500">
                      ({formatCurrency(p.estimatedCost)})
                    </span>
                  </td>
                  <td className="py-3">
                    <Badge variant={urgencyVariant[p.urgency]}>{p.urgency}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
