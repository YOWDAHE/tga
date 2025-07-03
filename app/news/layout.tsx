import { Container } from "@mantine/core";
import React from "react";

function layout({ children }: { children: React.ReactNode }) {
	return (
		<div style={{ padding: "24px" }}>
			{children}
		</div>
	);
}

export default layout;
