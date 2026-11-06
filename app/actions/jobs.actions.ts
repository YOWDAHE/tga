import { del, post, put } from "@/lib/axiosWrapper";
import type { Job, JobInput } from "@/components/jobs/types";

type Result<T> = { success: true; data: T } | { success: false; error: string };

// axiosWrapper rejects with { message } carrying the backend's message (e.g. a 400 validation error)
const failure = (error: unknown, fallback: string): { success: false; error: string } => ({
	success: false,
	error: (error as { message?: string })?.message || fallback,
});

export async function createJob(data: JobInput): Promise<Result<Job>> {
	try {
		const res = await post("/jobs", data);
		return { success: true, data: res.data.data };
	} catch (error) {
		return failure(error, "Failed to create the job");
	}
}

/** The backend replaces every field, so always send the whole job */
export async function updateJob(id: number, data: JobInput & { repost?: boolean }): Promise<Result<Job>> {
	try {
		const res = await put(`/jobs/${id}`, data);
		return { success: true, data: res.data.data };
	} catch (error) {
		return failure(error, "Failed to update the job");
	}
}

export async function deleteJob(id: number): Promise<Result<{ id: number }>> {
	try {
		const res = await del(`/jobs/${id}`);
		return { success: true, data: res.data.data };
	} catch (error) {
		return failure(error, "Failed to delete the job");
	}
}
