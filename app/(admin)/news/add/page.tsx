import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import { fetchNewsById } from "@/app/actionsServers/news.server.actions";
import { getCategories } from "@/app/actionsServers/archive.server.actions";
import { notFound } from "next/navigation";
import NewsForm from "@/components/NewsForm";

interface NewsAddPageProps {
	searchParams: Promise<{
		edit?: string;
	}>;
}

export default async function NewsAddPage({ searchParams }: NewsAddPageProps) {
  const editId = (await searchParams).edit;
  let newsToEdit = null;
  let categories = [];

  // Fetch categories
  try {
    const categoriesRes = await getCategories();
    console.log("categoriesRes", categoriesRes);
    if (categoriesRes.success) {
      categories = categoriesRes.data || [];
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  if (editId) {
    try {
      const newsRes = await fetchNewsById(editId);
      if (newsRes.success) {
        newsToEdit = newsRes.data;
      }
    } catch (error) {
      console.error("Error fetching news for edit:", error);
      // Continue without the news data, form will be in create mode
    }
  }

  return (
    <Suspense fallback={<Skeleton height={400} />}>
      <NewsForm newsToEdit={newsToEdit} categories={categories} />
    </Suspense>
  );
} 