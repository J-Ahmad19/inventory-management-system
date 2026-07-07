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

// GET all products
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.from("product").select("*").order("name");

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST - create product
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { sku, name, category, lead_time_days, base_price } = body;

    if (!sku || !name) {
      return NextResponse.json({ error: "SKU and name are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("product")
      .insert([
        {
          sku,
          name,
          category,
          lead_time_days: lead_time_days || 7,
          base_price: base_price || 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
