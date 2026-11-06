import { get } from "@/lib/axiosServerWrapper";
import type { Job, JobCounts } from "@/components/jobs/types";

type ServerError = { message?: string; status?: number };

export async function fetchJobs(params?: { q?: string; status?: string }) {
	try {
		const query = new URLSearchParams();
		if (params?.q) query.set("q", params.q);
		if (params?.status) query.set("status", params.status);
		const qs = query.toString();
		const res = await get(`/jobs${qs ? `?${qs}` : ""}`);
		return {
			success: true as const,
			jobs: (res.data.data?.jobs ?? []) as Job[],
			counts: res.data.data?.counts as JobCounts | undefined,
		};
	} catch (error: unknown) {
		const err = error as ServerError;
		return { success: false as const, error: err?.message || "Failed to fetch jobs", status: err?.status };
	}
}

export async function fetchJobById(id: string) {
	try {
		const res = await get(`/jobs/${encodeURIComponent(id)}`);
		return { success: true as const, data: res.data.data as Job };
	} catch (error: unknown) {
		const err = error as ServerError;
		return { success: false as const, error: err?.message || "Failed to fetch the job", status: err?.status };
	}
}

/** Departments already in use, for the editor's suggestions */
export async function fetchJobDepartments() {
	const res = await fetchJobs();
	if (!res.success) return [];
	return [...new Set(res.jobs.map((j) => j.department?.trim()).filter((d): d is string => Boolean(d)))].sort();
}
