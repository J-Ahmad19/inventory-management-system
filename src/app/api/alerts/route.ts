import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { searchParams } = new URL(request.url);
    const unacknowledgedOnly = searchParams.get("unacknowledged") === "true";

    let query = supabase
      .from("alerts")
      .select(
        `
        *,
        product:product_id(*),
        location:location_id(*)
      `
      )
      .order("created_at", { ascending: false });

    if (unacknowledgedOnly) {
      query = query.eq("acknowledged", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { alert_id, acknowledged } = body;

    if (!alert_id) {
      return NextResponse.json(
        { error: "Missing alert_id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("alerts")
      .update({ acknowledged })
      .eq("id", alert_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}
