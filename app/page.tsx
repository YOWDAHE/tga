import { IconNews, IconArchive, IconCategory, IconHome, IconDashboard } from "@tabler/icons-react"
import Dashboard from "@/components/Dashboard"
import { getDashboardDataServer } from "@/app/actionsServers/dashboard.server.actions"

const navigationItems = [
  { label: "Dashboard", icon: IconDashboard, value: "dashboard" },
  { label: "News Management", icon: IconNews, value: "news" },
  { label: "Archives", icon: IconArchive, value: "archives" },
  { label: "Categories", icon: IconCategory, value: "categories" },
  { label: "Homepage", icon: IconHome, value: "homepage" },
]

export default async function AdminDashboard() {
  const dashboardResult = await getDashboardDataServer();
  
  return <Dashboard initialData={dashboardResult.success ? dashboardResult.data : null} />
}
