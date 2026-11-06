"use client";

import PageBuilder, { type PageBuilderProps } from "@/components/page-builder/PageBuilder";

// The "Website pages" admin: the home and about pages built from modules, plus the shared lists
export default function HomepageManagement(props: PageBuilderProps) {
	return <PageBuilder {...props} />;
}
