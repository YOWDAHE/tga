import { notFound } from "next/navigation";
import { Alert } from "@mantine/core";
import { fetchJobById, fetchJobDepartments } from "@/app/actionsServers/jobs.server.actions";
import JobEditor from "@/components/jobs/JobEditor";

interface EditJobPageProps {
	params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: EditJobPageProps) {
	const { id } = await params;
	if (!/^\d+$/.test(id)) notFound();
	const [res, departments] = await Promise.all([fetchJobById(id), fetchJobDepartments()]);

	if (!res.success) {
		if (res.status === 404) notFound();
		return (
			<Alert color="red" radius="lg" title="Couldn't load this job">
				{res.error}
			</Alert>
		);
	}

	return <JobEditor key={res.data.id} job={res.data} departments={departments} />;
}
