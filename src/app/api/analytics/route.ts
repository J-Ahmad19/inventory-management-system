import { NextResponse } from "next/server";
import { getStore } from "@/lib/store/inventory-store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    metrics: store.getDashboardMetrics(),
    trends: store.getStockTrend(),
    categories: store.getCategoryDistribution(),
    locations: store.getLocationUtilization(),
    recentMovements: store.getMovements(10),
    predictions: store.getReplenishmentPredictions().slice(0, 5),
    shrinkage: store.getShrinkageReports().slice(0, 5),
  });
}
