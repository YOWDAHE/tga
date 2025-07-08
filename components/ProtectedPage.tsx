"use client"

import { ReactNode } from "react"
import AuthGuard from "./AuthGuard"
import { UserPermission } from "@/types/permissions"

interface ProtectedPageProps {
  children: ReactNode
  requiredPermissions?: UserPermission[]
  requireAny?: boolean
  fallback?: ReactNode
}

export default function ProtectedPage({ 
  children, 
  requiredPermissions = [], 
  requireAny = true,
  fallback
}: ProtectedPageProps) {
  return (
    <AuthGuard 
      requiredPermissions={requiredPermissions} 
      requireAny={requireAny}
    >
      {fallback || children}
    </AuthGuard>
  )
}

// Pre-configured components for common permission patterns
export function NewsProtectedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedPage requiredPermissions={["NEWS_CRUD"]}>
      {children}
    </ProtectedPage>
  )
}

export function ArchivesProtectedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedPage requiredPermissions={["ARCHIVES_CRUD"]}>
      {children}
    </ProtectedPage>
  )
}

export function UsersProtectedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedPage requiredPermissions={["USER_CRUD"]}>
      {children}
    </ProtectedPage>
  )
}

export function HomepageProtectedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedPage requiredPermissions={["HOMEPAGE_CRUD"]}>
      {children}
    </ProtectedPage>
  )
}

export function AdminProtectedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedPage 
      requiredPermissions={["USER_CRUD", "NEWS_CRUD", "ARCHIVES_CRUD"]}
      requireAny={true}
    >
      {children}
    </ProtectedPage>
  )
} 