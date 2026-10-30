import { Box } from "@mantine/core";
import { notFound } from "next/navigation";
import DocumentDetails from "@/components/DocumentDetails";
import { fetchDocument, getCategories } from "@/app/actionsServers/archive.server.actions";

interface DocumentPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
	const { id } = await params;
	const [documentRes, categoriesRes] = await Promise.all([fetchDocument(id), getCategories()]);

	if (!documentRes.success || !documentRes.data) notFound();

	return (
		<Box p={{ base: "sm", sm: "lg" }}>
			<DocumentDetails document={documentRes.data} categories={categoriesRes.success ? categoriesRes.data : []} />
		</Box>
	);
}
