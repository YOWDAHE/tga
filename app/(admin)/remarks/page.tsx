import { Box } from "@mantine/core";
import { fetchRemarksServer } from "@/app/actionsServers/remarks.server.actions";
import RemarksManagement from "@/components/RemarksManagement";

interface RemarksPageProps {
	searchParams: Promise<{ search?: string; status?: string; sort?: string; page?: string }>;
}

export default async function RemarksPage({ searchParams }: RemarksPageProps) {
	const { search = "", status = "", sort = "", page = "1" } = await searchParams;
	const result = await fetchRemarksServer({ search, status, sort, page: Number(page) || 1 });

	return (
		<Box p={{ base: "sm", sm: "lg" }}>
			<RemarksManagement
				remarks={result.success ? result.data.remarks : []}
				statusCounts={result.success ? result.data.statusCounts : undefined}
				pagination={result.success ? result.data.pagination : undefined}
				mail={result.success ? result.data.mail : undefined}
				error={result.success ? null : result.error}
				searchQuery={search}
				status={status}
				sort={sort}
			/>
		</Box>
	);
}
