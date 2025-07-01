"use client"
import { IconNews, IconArchive, IconCategory, IconHome, IconDashboard } from "@tabler/icons-react"
import Dashboard from "@/components/Dashboard"

const navigationItems = [
  { label: "Dashboard", icon: IconDashboard, value: "dashboard" },
  { label: "News Management", icon: IconNews, value: "news" },
  { label: "Archives", icon: IconArchive, value: "archives" },
  { label: "Categories", icon: IconCategory, value: "categories" },
  { label: "Homepage", icon: IconHome, value: "homepage" },
]

export default function AdminDashboard() {
  return <Dashboard />
}
