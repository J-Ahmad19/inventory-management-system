import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  try {
    // Get total products
    const { data: products } = await supabase.from("product").select("id");

    // Get total locations
    const { data: locations } = await supabase.from("location").select("id");

    // Get low stock items (qty_on_hand <= reorder_point)
    const { data: lowStockItems } = await supabase
      .from("inventory")
      .select("id")
      .lte("qty_on_hand", "reorder_point");

    // Get pending alerts
    const { data: pendingAlerts } = await supabase
      .from("alerts")
      .select("id")
      .eq("acknowledged", false);

    // Calculate total inventory value
    const { data: inventoryData } = await supabase
      .from("inventory")
      .select(
        `
        qty_on_hand,
        product:product_id(base_price)
      `
      );

    let totalInventoryValue = 0;
    if (inventoryData) {
      totalInventoryValue = inventoryData.reduce(
        (sum: number, item: any) =>
          sum + (item.qty_on_hand * (item.product?.base_price || 0)),
        0
      );
    }

    // Get stockout risk items (days_until_stockout < 7 and acknowledged = false)
    const { data: stockoutRiskAlerts } = await supabase
      .from("alerts")
      .select("id")
      .eq("type", "LOW_STOCK_PREDICTION")
      .eq("acknowledged", false)
      .lt("days_until_stockout", 7);

    const metrics = {
      totalProducts: products?.length || 0,
      totalLocations: locations?.length || 0,
      lowStockItems: lowStockItems?.length || 0,
      pendingAlerts: pendingAlerts?.length || 0,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      stockoutRiskItems: stockoutRiskAlerts?.length || 0,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error calculating metrics:", error);
    return NextResponse.json(
      { error: "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}
