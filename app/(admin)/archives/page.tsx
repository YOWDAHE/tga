import { Suspense } from "react";
import { fetchDocuments, getCategories } from "@/app/actionsServers/archive.server.actions";
import { Button, Skeleton } from "@mantine/core";
import DocumentsManagement from "@/components/DocumentsManagement";
import EmptyState from "@/components/EmptyState";
import { FileIcon, FileX2Icon } from "lucide-react";
import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

interface ArchivesPageProps {
	searchParams: Promise<{
		page?: string;
		search?: string;
		category?: string;
		sortBy?: string;
		order?: string;
	}>;
}

export default async function ArchivesPage({
	searchParams,
}: ArchivesPageProps) {
	const searchParamsResolved = await searchParams;
	const page =
		searchParamsResolved.page ? parseInt(searchParamsResolved.page) : 1;
	const search = searchParamsResolved.search || "";
	const category = searchParamsResolved.category || "";
	const sortBy = searchParamsResolved.sortBy || "createdAt";
	const order = searchParamsResolved.order || "desc";

	try {
		const documentsRes = await fetchDocuments({
			page,
			limit: 6,
			search: search || undefined,
			category: category || undefined,
			sortBy: sortBy || undefined,
			order: order || undefined,
    });
    
    		const categoriesRes = await getCategories();
		const categories = categoriesRes.success ? categoriesRes.data : [];

		if (!documentsRes.data) {
      return <EmptyState
        title="No documents found"
        description="There are no documents to display at the moment."
        icon={<FileX2Icon size={48} />}
        action={
          <Link href="/archives/uploads">
            <Button>
              <IconPlus size={16} style={{ marginRight: 4 }} /> Add Document
            </Button>
          </Link>
        }
      />;
		}

		const documents = documentsRes.data;
    const pagination = documentsRes.pagination;

		return (
			<Suspense fallback={<Skeleton height={400} />}>
				{/* <ArchivesManagement
					documents={documents}
					currentPage={pagination.currentPage}
					totalPages={pagination.totalPages}
					searchQuery={search}
				/> */}
				<DocumentsManagement
					documents={documents}
					currentPage={pagination.currentPage}
					totalPages={pagination.totalPages}
					searchQuery={search}
					category={category}
					sortBy={sortBy}
					order={order}
					initialCategories={categories}
				/>
			</Suspense>
		);
	} catch (error) {
		console.error("Error in ArchivesPage:", error);

		// Return empty state on error
		return (
			<Suspense fallback={<Skeleton height={400} />}>
				<DocumentsManagement
					documents={[]}
					currentPage={1}
					totalPages={1}
					searchQuery={search}
					category={category}
					sortBy={sortBy}
          order={order}
          initialCategories={[]}
				/>
				{/* <ArchivesManagement
					documents={[]}
					currentPage={1}
					totalPages={1}
					searchQuery={search}
				/> */}
			</Suspense>
		);
	}
}
