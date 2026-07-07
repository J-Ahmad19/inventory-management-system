import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { InventoryTable } from "@/components/inventory/inventory-table";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <Header
        title="Inventory"
        description="Track and manage stock levels across all products and locations"
      />
      <div className="p-8">
        <InventoryTable initialSearch={params.search ?? ""} />
      </div>
    </AppShell>
  );
}
