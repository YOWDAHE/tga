"use client";

import { Container, Tabs } from "@mantine/core";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import router from "next/router";

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div style={{ padding: "24px" }}>
			<Tabs
				defaultValue="news"
				value={usePathname() === "/news/other" ? "/news/other" : "/news"}
				onChange={(value) => value && router.push(value)}
			>
				<Tabs.List mb="lg">
					<Tabs.Tab value="/news" component={Link}>
						News Articles
					</Tabs.Tab>
					<Tabs.Tab value="/news/other" component={Link}>
						Other News
					</Tabs.Tab>
				</Tabs.List>
			</Tabs>
			{children}
		</div>
	);
}

export default Layout;
