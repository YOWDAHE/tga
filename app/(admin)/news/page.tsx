import { fetchNews } from "@/app/actionsServers/news.server.actions";
import { getCategories } from "@/app/actionsServers/archive.server.actions";
import NewsManagement from "@/components/NewsManagement";

interface NewsPageProps {
	searchParams: Promise<{
		page?: string;
		search?: string;
		category?: string;
		sortBy?: string;
		order?: string;
	}>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
	const params = await searchParams;
	const page = params.page ? parseInt(params.page) : 1;
	const search = params.search || "";
	const category = params.category || "";
	const sortBy = params.sortBy || "createdAt";
	const order = params.order || "desc";

	const [newsRes, categoriesRes] = await Promise.all([
		fetchNews({ page, limit: 10, search: search || undefined, category: category || undefined, sortBy, order }),
		getCategories(),
	]);
	const pagination = (newsRes.success && newsRes.pagination) || { currentPage: 1, totalPages: 1, totalItems: 0 };

	return (
		<NewsManagement
			initialNews={newsRes.success ? newsRes.data ?? [] : []}
			error={newsRes.success ? null : newsRes.error}
			currentPage={pagination.currentPage}
			totalPages={pagination.totalPages}
			totalItems={Number(pagination.totalItems ?? 0)}
			searchQuery={search}
			category={category}
			sortBy={sortBy}
			order={order}
			categories={categoriesRes.success ? categoriesRes.data : []}
		/>
	);
}
