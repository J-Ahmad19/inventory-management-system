import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

// POST - adjust inventory quantity
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { product_id, location_id, quantity_change, reason, initiated_by } = body;

    if (!product_id || !location_id || !quantity_change) {
      return NextResponse.json(
        { error: "product_id, location_id, and quantity_change are required" },
        { status: 400 }
      );
    }

    // Get current inventory
    const { data: inventory, error: fetchError } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_id", product_id)
      .eq("location_id", location_id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    const currentQty = inventory?.qty_on_hand || 0;
    const newQty = Math.max(0, currentQty + quantity_change);

    // Update inventory
    const { error: updateError } = await supabase
      .from("inventory")
      .update({
        qty_on_hand: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", product_id)
      .eq("location_id", location_id);

    if (updateError) throw updateError;

    // Record transaction
    const { error: txnError } = await supabase.from("transaction_ledger").insert([
      {
        type: "ADJUST",
        product_id,
        to_location: location_id,
        quantity: Math.abs(quantity_change),
        reason: reason || "Stock adjustment",
        initiated_by: initiated_by || "System",
      },
    ]);

    if (txnError) throw txnError;

    return NextResponse.json({ success: true, qty_on_hand: newQty });
  } catch (error) {
    console.error("Error adjusting inventory:", error);
    return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
  }
}
