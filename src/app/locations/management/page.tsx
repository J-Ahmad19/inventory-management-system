import { LocationsClient } from "@/components/locations/locations-client";

export const metadata = {
  title: "Locations Management | StockFlow",
  description: "Manage warehouses and store locations",
};

export default function LocationsManagementPage() {
  return <LocationsClient />;
}
