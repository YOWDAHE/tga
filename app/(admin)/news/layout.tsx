import { Box } from "@mantine/core";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
	return <Box p={{ base: "sm", sm: "lg" }}>{children}</Box>;
}
