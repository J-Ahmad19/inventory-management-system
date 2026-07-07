import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const locationId = searchParams.get("locationId");

    let query = supabase
      .from("inventory")
      .select(
        `
        *,
        product:product_id(*),
        location:location_id(*)
      `
      );

    if (productId) {
      query = query.eq("product_id", productId);
    }

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
