import { Box } from "@mantine/core";
import { fetchDocuments, getCategories } from "@/app/actionsServers/archive.server.actions";
import DocumentsManagement from "@/components/DocumentsManagement";

interface ArchivesPageProps {
	searchParams: Promise<{
		page?: string;
		search?: string;
		category?: string;
		sortBy?: string;
		order?: string;
	}>;
}

export default async function ArchivesPage({ searchParams }: ArchivesPageProps) {
	const params = await searchParams;
	const page = params.page ? parseInt(params.page) : 1;
	const search = params.search || "";
	const category = params.category || "";
	const sortBy = params.sortBy || "createdAt";
	const order = params.order || "desc";

	const [documentsRes, categoriesRes] = await Promise.all([
		fetchDocuments({ page, limit: 10, search: search || undefined, category: category || undefined, sortBy, order }),
		getCategories(),
	]);
	const pagination = (documentsRes.success && documentsRes.pagination) || { currentPage: 1, totalPages: 1, totalCount: 0 };

	return (
		<Box p={{ base: "sm", sm: "lg" }}>
			<DocumentsManagement
				documents={documentsRes.success ? documentsRes.data ?? [] : []}
				error={documentsRes.success ? null : documentsRes.error}
				currentPage={pagination.currentPage}
				totalPages={pagination.totalPages}
				totalItems={Number(pagination.totalCount ?? 0)}
				searchQuery={search}
				category={category}
				sortBy={sortBy}
				order={order}
				initialCategories={categoriesRes.success ? categoriesRes.data : []}
			/>
		</Box>
	);
}
