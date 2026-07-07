import { NextResponse } from "next/server";
import { getStore } from "@/lib/store/inventory-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = getStore();

  const items = store.getInventoryItems({
    search: searchParams.get("search") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    locationId: searchParams.get("locationId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  return NextResponse.json({
    items,
    categories: store.getCategories(),
    locations: store.getLocations(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = getStore();

    if (body.action === "transfer") {
      const result = store.transferStock(
        body.productId,
        body.fromLocationId,
        body.toLocationId,
        body.quantity
      );
      return NextResponse.json({ success: true, data: result });
    }

    if (body.action === "adjust") {
      const result = store.adjustStock(
        body.productId,
        body.locationId,
        body.quantity,
        body.reason
      );
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed" },
      { status: 400 }
    );
  }
}
