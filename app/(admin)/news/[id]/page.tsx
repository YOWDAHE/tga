import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import NewsDetails from "@/components/NewsDetails";
import { fetchNewsById } from "@/app/actionsServers/news.server.actions";
import { notFound } from "next/navigation";

interface NewsPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function NewsPage({ params }: NewsPageProps) {
	try {
		const newsRes = await fetchNewsById((await params).id);

		if (!newsRes.success) {
			notFound();
		}

		const news = newsRes.data;

		return (
			<Suspense fallback={<Skeleton height={400} />}>
				<NewsDetails news={news} />
			</Suspense>
		);
	} catch (error) {
		console.error("Error in NewsPage:", error);
		notFound();
	}
}
