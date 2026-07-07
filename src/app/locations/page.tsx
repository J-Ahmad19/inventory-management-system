import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { LocationsGrid } from "@/components/locations/locations-grid";

export default function LocationsPage() {
  return (
    <AppShell>
      <Header
        title="Locations"
        description="Multi-location warehouse and store management"
      />
      <div className="p-8">
        <LocationsGrid />
      </div>
    </AppShell>
  );
}
