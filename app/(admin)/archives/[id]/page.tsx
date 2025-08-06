import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import DocumentDetails from "@/components/DocumentDetails";
import { fetchDocument } from "@/app/actionsServers/archive.server.actions";
import { getCategories } from "@/app/actionsServers/archive.server.actions";
import { notFound } from "next/navigation";

interface DocumentPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
	try {
		const documentRes = await fetchDocument((await params).id);
		const categoriesRes = await getCategories();

		if (!documentRes.success) {
			notFound();
		}

		const document = documentRes.data;
		const categories = categoriesRes.success ? categoriesRes.data : [];

		return (
			<Suspense fallback={<Skeleton height={400} />}>
				<DocumentDetails document={document} categories={categories} />
			</Suspense>
		);
	} catch (error) {
		console.error("Error in DocumentPage:", error);
		notFound();
	}
} 