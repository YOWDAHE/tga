import { Suspense } from "react";
import { fetchNews } from "@/app/actionsServers/news.server.actions";
import { Button, Skeleton, TextInput, Group } from "@mantine/core";
import NewsManagement from "@/components/NewsManagement";
import EmptyState from "@/components/EmptyState";
import { FileX2Icon } from "lucide-react";
import Link from "next/link";
import { IconPlus, IconSearch } from "@tabler/icons-react";

interface NewsPageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const search = searchParams.search || "";

  try {
    const newsRes = await fetchNews({
      page,
      limit: 6,
      search: search || undefined,
    });
    const news = newsRes.success ? newsRes.data : [];
    const pagination = newsRes.pagination || { currentPage: 1, totalPages: 1 };

    if (!news || news.length === 0) {
      return (
        <EmptyState
          title="No news found"
          description="There are no news articles to display at the moment."
          icon={<FileX2Icon size={48} />}
          action={
          //   <Group>
          //     <TextInput
          //       placeholder="Search news..."
          //       leftSection={<IconSearch size={16} />}
          //       defaultValue={search}
          //       onKeyDown={e => {
          //         if (e.key === "Enter") {
          //           const value = (e.target as HTMLInputElement).value;
          //           window.location.href = `/news?search=${encodeURIComponent(value)}`;
          //         }
          //       }}
          //       style={{ minWidth: 250 }}
          //     />
              <Button component={Link} href="/news/create">
                <IconPlus size={16} style={{ marginRight: 4 }} /> Add News
              </Button>
          //   </Group>
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
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Error in NewsPage:", error);
    return (
      <Suspense fallback={<Skeleton height={400} />}>
        <NewsManagement initialNews={[]} currentPage={1} totalPages={1} searchQuery={search} />
      </Suspense>
    );
  }
}
