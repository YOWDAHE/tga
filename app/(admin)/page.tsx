import Dashboard from "@/components/Dashboard"
import { getDashboardDataServer } from "@/app/actionsServers/dashboard.server.actions"

export default async function AdminDashboard() {
  const dashboardResult = await getDashboardDataServer();

  return <Dashboard initialData={dashboardResult.success ? dashboardResult.data : null} />
}
