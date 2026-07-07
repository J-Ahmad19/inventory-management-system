import { NextResponse } from "next/server";
import { getStore } from "@/lib/store/inventory-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const acknowledged = searchParams.get("acknowledged");
  const store = getStore();

  const alerts =
    acknowledged === "true"
      ? store.getAlerts(true)
      : acknowledged === "false"
        ? store.getAlerts(false)
        : store.getAlerts();

  return NextResponse.json({ alerts });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const store = getStore();
  const alert = store.acknowledgeAlert(body.id);
  if (!alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
  return NextResponse.json({ alert });
}
