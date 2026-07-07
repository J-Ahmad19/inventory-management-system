import { NextResponse } from "next/server";
import { getStore } from "@/lib/store/inventory-store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({
    locations: store.getLocationUtilization(),
    predictions: store.getReplenishmentPredictions(),
    shrinkage: store.getShrinkageReports(),
  });
}
