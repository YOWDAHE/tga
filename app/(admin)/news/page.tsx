import { Suspense } from "react";
import { fetchNews } from "@/app/actionsServers/news.server.actions";
import { Button, Skeleton, TextInput, Group } from "@mantine/core";
import NewsManagement from "@/components/NewsManagement";
import EmptyState from "@/components/EmptyState";
import { FileX2Icon } from "lucide-react";
import Link from "next/link";
import { IconPlus, IconSearch } from "@tabler/icons-react";

interface NewsPageProps {
	searchParams: Promise<{
		page?: string;
		search?: string;
		sortBy?: string;
		order?: string;
	}>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const searchParamsResolved = await searchParams;
  const page = searchParamsResolved.page ? parseInt(searchParamsResolved.page) : 1;
  const search = searchParamsResolved.search || "";
  const sortBy = searchParamsResolved.sortBy || "createdAt";
  const order = searchParamsResolved.order || "desc";

  try {
    const newsRes = await fetchNews({
      page,
      limit: 6,
      search: search || undefined,
      sortBy: sortBy || undefined,
      order: order || undefined,
    });
    const news = newsRes.success ? newsRes.data : [];
    const pagination = newsRes.pagination || { currentPage: 1, totalPages: 1 };

    if (!news || news.length === 0) {
      return (
        <EmptyState
          title="No news found"
          description={
            search || sortBy !== "createdAt" || order !== "desc"
              ? "There are no news articles that match your search criteria."
              : "There are no news articles to display at the moment."
          }
          icon={<FileX2Icon size={48} />}
          action={
            search || sortBy !== "createdAt" || order !== "desc" ? (
              <Link href="/news">
                <Button variant="light">Clear Search</Button>
              </Link>
            ) : (
              <Link href="/news/add">
                <Button>
                  <IconPlus size={16} style={{ marginRight: 4 }} /> Add News
                </Button>
              </Link>
            )
          }
        />
      );
    }

    return (
      <Suspense fallback={<Skeleton height={400} />}>
        <NewsManagement
          initialNews={news}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          searchQuery={search}
          sortBy={sortBy}
          order={order}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Error in NewsPage:", error);
    return (
      <Suspense fallback={<Skeleton height={400} />}>
        <NewsManagement 
          initialNews={[]} 
          currentPage={1} 
          totalPages={1} 
          searchQuery={search}
          sortBy={sortBy}
          order={order}
        />
      </Suspense>
    );
  }
}
