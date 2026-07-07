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
    // Check if data already exists
    const { data: existingProducts } = await supabase
      .from("product")
      .select("id")
      .limit(1);

    if (existingProducts && existingProducts.length > 0) {
      return NextResponse.json({ message: "Database already initialized" });
    }

    // Seed locations
    const { data: locations, error: locError } = await supabase
      .from("location")
      .insert([
        {
          name: "Main Warehouse",
          type: "WAREHOUSE",
          capacity: 10000,
        },
        {
          name: "Retail Store - Downtown",
          type: "RETAIL",
          capacity: 500,
        },
        {
          name: "Dark Store - North",
          type: "DARK_STORE",
          capacity: 1000,
        },
      ])
      .select();

    if (locError) throw locError;

    // Seed products
    const { data: products, error: prodError } = await supabase
      .from("product")
      .insert([
        {
          sku: "PROD-001",
          name: "Laptop Computer",
          category: "Electronics",
          lead_time_days: 7,
          base_price: 99999,
        },
        {
          sku: "PROD-002",
          name: "Wireless Mouse",
          category: "Accessories",
          lead_time_days: 3,
          base_price: 2999,
        },
        {
          sku: "PROD-003",
          name: "USB-C Cable",
          category: "Cables",
          lead_time_days: 2,
          base_price: 1299,
        },
        {
          sku: "PROD-004",
          name: "Monitor Stand",
          category: "Office",
          lead_time_days: 5,
          base_price: 4999,
        },
        {
          sku: "PROD-005",
          name: "Keyboard Mechanical",
          category: "Accessories",
          lead_time_days: 4,
          base_price: 14999,
        },
      ])
      .select();

    if (prodError) throw prodError;

    // Seed inventory levels
    if (locations && products) {
      const inventoryData = [];
      for (const location of locations) {
        for (const product of products) {
          inventoryData.push({
            product_id: product.id,
            location_id: location.id,
            qty_on_hand: Math.floor(Math.random() * 500) + 10,
            qty_allocated: Math.floor(Math.random() * 100),
            reorder_point: 50,
          });
        }
      }

      const { error: invError } = await supabase.from("inventory").insert(inventoryData);
      if (invError) throw invError;
    }

    // Add some sample alerts
    if (locations && products) {
      const alertData = [];
      // Pick a few random products and locations for alerts
      for (let i = 0; i < 3; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        alertData.push({
          type: Math.random() > 0.5 ? "LOW_STOCK" : "LOW_STOCK_PREDICTION",
          product_id: product.id,
          location_id: location.id,
          message: `Low stock alert for ${product.name} at ${location.name}`,
          days_until_stockout: Math.floor(Math.random() * 7) + 1,
          recommended_order_qty: 50,
          confidence_score: 0.95,
          acknowledged: false,
        });
      }

      const { error: alertError } = await supabase.from("alerts").insert(alertData);
      if (alertError) throw alertError;
    }

    return NextResponse.json({
      message: "Database initialized successfully",
      locations: locations?.length || 0,
      products: products?.length || 0,
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
