import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignored
          }
        },
      },
    }
  );
}

export async function GET() {
  const supabase = await createClient();

  try {
    // Get transaction ledger data for trends
    const { data: transactions } = await supabase
      .from("transaction_ledger")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    // Get inventory with product data for categories and locations
    const { data: inventory } = await supabase
      .from("inventory")
      .select(
        `
        *,
        product:product_id(name, category, base_price),
        location:location_id(name, type, capacity)
      `
      );

    // Get products for categories
    const { data: products } = await supabase.from("product").select("*");

    // Get locations for utilization
    const { data: locations } = await supabase.from("location").select("*");

    // Calculate trends (group by day)
    const trends: Array<{ day: string; inbound: number; outbound: number; shrinkage: number }> =
      [];
    if (transactions) {
      const grouped: Record<string, Record<string, number>> = {};
      transactions.forEach((t: any) => {
        const day = new Date(t.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!grouped[day]) {
          grouped[day] = { INBOUND: 0, OUTBOUND: 0, ADJUST: 0 };
        }
        grouped[day][t.type] = (grouped[day][t.type] || 0) + t.quantity;
      });

      Object.entries(grouped)
        .reverse()
        .slice(0, 7)
        .forEach(([day, counts]) => {
          trends.push({
            day,
            inbound: counts.INBOUND || 0,
            outbound: counts.OUTBOUND || 0,
            shrinkage: counts.ADJUST || 0,
          });
        });
    }

    // Calculate categories
    const categories: Array<{ name: string; units: number; value: number }> = [];
    if (inventory && products) {
      const categoryMap: Record<string, { units: number; value: number }> = {};
      inventory.forEach((inv: any) => {
        const category = inv.product?.category || "Uncategorized";
        if (!categoryMap[category]) {
          categoryMap[category] = { units: 0, value: 0 };
        }
        const itemValue = (inv.qty_on_hand * (inv.product?.base_price || 0)) / 100;
        categoryMap[category].units += inv.qty_on_hand;
        categoryMap[category].value += itemValue;
      });

      Object.entries(categoryMap).forEach(([name, data]) => {
        categories.push({ name, ...data });
      });
    }

    // Calculate location utilization
    const locationUtilization: Array<{
      name: string;
      utilization: number;
      used: number;
      capacity: number;
    }> = [];
    if (inventory && locations) {
      locations.forEach((loc: any) => {
        const locInventory = inventory.filter((inv: any) => inv.location_id === loc.id);
        const used = locInventory.reduce((sum: number, inv: any) => sum + inv.qty_on_hand, 0);
        const utilization = loc.capacity > 0 ? Math.round((used / loc.capacity) * 100) : 0;
        locationUtilization.push({
          name: loc.name,
          utilization,
          used,
          capacity: loc.capacity,
        });
      });
    }

    return NextResponse.json({
      metrics: {
        totalProducts: products?.length || 0,
        totalLocations: locations?.length || 0,
        lowStockItems: inventory?.filter((i: any) => i.qty_on_hand <= i.reorder_point).length ||
          0,
        pendingAlerts: 0,
        totalInventoryValue: 0,
        stockoutRiskItems: 0,
      },
      trends: trends.length > 0 ? trends : [],
      categories,
      locations: locationUtilization,
      recentMovements: transactions?.slice(0, 10) || [],
      predictions: [],
      shrinkage: [],
    });
  } catch (error) {
    console.error("Error calculating analytics:", error);
    return NextResponse.json(
      { error: "Failed to calculate analytics" },
      { status: 500 }
    );
  }
}
