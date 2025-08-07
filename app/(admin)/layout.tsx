import AdminLayout from "@/components/AdminLayout";
import AuthGuard from "@/components/AuthGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import { MantineProvider } from "@mantine/core";
import React from "react";

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<AuthGuard>
				<AdminLayout>{children}</AdminLayout>
			</AuthGuard>
		</AuthProvider>
	);
}

export default Layout;
