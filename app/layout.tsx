import type React from "react"
import "@mantine/core/styles.css"
import "@mantine/dropzone/styles.css"
import "@mantine/dates/styles.css"
import "@mantine/notifications/styles.css"

import { ColorSchemeScript, MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { theme } from "@/config/theme"
import { AuthProvider } from "@/contexts/AuthContext"
import AuthGuard from "@/components/AuthGuard"
import AdminLayout from "@/components/AdminLayout"

export const metadata = {
  title: "TGA Dashboard",
  description: "Admin portal for content management",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications />
          <AuthProvider>
            <AuthGuard>
              <AdminLayout>{children}</AdminLayout>
            </AuthGuard>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
