"use client";

import ProtectedPage from "@/components/ProtectedPage";
import { Box } from "@mantine/core";

export default function JobsLayout({ children }: { children: React.ReactNode }) {
	return (
		<ProtectedPage requiredPermissions={["JOBS_CRUD"]}>
			<Box p={{ base: "sm", sm: "lg" }}>{children}</Box>
		</ProtectedPage>
	);
}
