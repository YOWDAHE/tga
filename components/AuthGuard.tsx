"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Loader, Center } from "@mantine/core"

interface AuthGuardProps {
  children: React.ReactNode
}

const publicRoutes = ["/login", "/signup"]

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !publicRoutes.includes(pathname)) {
        router.push("/login");
        return;
      }
      if (isAuthenticated && pathname === "/login") {
        router.push("/");
        return;
      }
    }
  }, [isAuthenticated, pathname, router, isLoading]);

  if (isLoading || (!isAuthenticated && !publicRoutes.includes(pathname))) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return <>{children}</>;
}
