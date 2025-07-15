"use client";

import { Container, Tabs } from "@mantine/core";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div style={{ padding: "24px" }}>
			<Tabs defaultValue="news" value={usePathname() === "/news/other" ? "other" : "news"}>
				<Tabs.List mb="lg">
					<Tabs.Tab value="news" component={Link} href="/news">
						News Articles
					</Tabs.Tab>
					<Tabs.Tab value="other" component={Link} href="/news/other">
						Other News
					</Tabs.Tab>
				</Tabs.List>
			</Tabs>
			{children}
		</div>
	);
}

export default Layout;
