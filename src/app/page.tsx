import { AppShell } from "@/components/layout/app-shell";
import DashboardPage from "./dashboard-client";

export default function Page() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
