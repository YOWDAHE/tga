import { fetchJobDepartments } from "@/app/actionsServers/jobs.server.actions";
import JobEditor from "@/components/jobs/JobEditor";

export default async function AddJobPage() {
	const departments = await fetchJobDepartments();
	return <JobEditor key="new" departments={departments} />;
}
