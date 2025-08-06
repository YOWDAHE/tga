"use client";

import type React from "react";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { UserPermission } from "@/types/permissions";
import { Center, Loader } from "@mantine/core";

interface AuthGuardProps {
	children: React.ReactNode;
	requiredPermissions?: UserPermission[];
	requireAny?: boolean;
}

export default function AuthGuard({
	children,
	requiredPermissions = [],
	requireAny = true,
}: AuthGuardProps) {
	const { isAuthenticated, isLoading, hasAnyPermission, hasAllPermissions } =
		useAuth();
	const router = useRouter();
	const pathname = usePathname();

	// Skip authentication check for login page
	const isLoginPage = pathname === "/login";

	useEffect(() => {
		if (!isLoading && !isAuthenticated && !isLoginPage) {
			router.push("/test");
		}
	}, [isAuthenticated, isLoading, router, isLoginPage]);

	// If it's the login page, render children without authentication check
	if (isLoginPage) {
		return <>{children}</>;
	}

	if (isLoading) {
		return (
			<Center h="100vh">
				<Loader size="lg" />
			</Center>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	if (requiredPermissions.length > 0) {
		const hasPermission =
			requireAny ?
				hasAnyPermission(requiredPermissions)
			:	hasAllPermissions(requiredPermissions);

		if (!hasPermission) {
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
						<p className="text-gray-600">
							You don't have the required permissions to access this page.
						</p>
					</div>
				</div>
			);
		}
	}

	return <>{children}</>;
}
