import { fetchJobs } from "@/app/actionsServers/jobs.server.actions";
import JobsManagement from "@/components/jobs/JobsManagement";

const FILTERS = ["live", "draft", "expired", "closed"];

interface JobsPageProps {
	searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
	const params = await searchParams;
	const q = params.q?.trim() || "";
	const status = params.status && FILTERS.includes(params.status) ? params.status : "";
	const res = await fetchJobs({ q, status });

	return (
		<JobsManagement
			jobs={res.success ? res.jobs : []}
			counts={res.success ? res.counts : undefined}
			error={res.success ? null : res.error}
			query={q}
			status={status}
		/>
	);
}
