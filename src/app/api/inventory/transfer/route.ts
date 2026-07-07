import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { product_id, from_location, to_location, quantity, reason } = body;

    // Validate inputs
    if (!product_id || !from_location || !to_location || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be positive" },
        { status: 400 }
      );
    }

    // Get current inventory at source location
    const { data: sourceInventory, error: fetchError } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_id", product_id)
      .eq("location_id", from_location)
      .single();

    if (fetchError || !sourceInventory) {
      return NextResponse.json(
        { error: "Source inventory not found" },
        { status: 404 }
      );
    }

    // Check if sufficient quantity available
    if (sourceInventory.qty_on_hand < quantity) {
      return NextResponse.json(
        {
          error: `Insufficient quantity. Available: ${sourceInventory.qty_on_hand}, Requested: ${quantity}`,
        },
        { status: 400 }
      );
    }

    // Start transaction: reduce source and increase destination
    // Step 1: Record the transaction
    const { error: transactionError } = await supabase
      .from("transaction_ledger")
      .insert({
        type: "TRANSFER",
        product_id,
        from_location,
        to_location,
        quantity,
        reason: reason || "Inventory transfer",
        initiated_by: "system",
      });

    if (transactionError) throw transactionError;

    // Step 2: Update source inventory
    const { error: updateSourceError } = await supabase
      .from("inventory")
      .update({
        qty_on_hand: sourceInventory.qty_on_hand - quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", product_id)
      .eq("location_id", from_location);

    if (updateSourceError) throw updateSourceError;

    // Step 3: Get destination inventory (or create if not exists)
    const { data: destInventory } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_id", product_id)
      .eq("location_id", to_location)
      .single();

    if (destInventory) {
      // Update existing destination inventory
      const { error: updateDestError } = await supabase
        .from("inventory")
        .update({
          qty_on_hand: destInventory.qty_on_hand + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("product_id", product_id)
        .eq("location_id", to_location);

      if (updateDestError) throw updateDestError;
    } else {
      // Create new inventory record at destination
      const { error: insertError } = await supabase.from("inventory").insert({
        product_id,
        location_id: to_location,
        qty_on_hand: quantity,
        qty_allocated: 0,
        reorder_point: 50,
      });

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: `Transferred ${quantity} units from source to destination`,
    });
  } catch (error) {
    console.error("Error transferring inventory:", error);
    return NextResponse.json(
      { error: "Failed to transfer inventory" },
      { status: 500 }
    );
  }
}
