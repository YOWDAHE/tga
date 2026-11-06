// Job openings: the admin's copy of the contract in tga-backend/src/controllers/jobs.controller.ts
import { SITE_URL } from "@/lib/page-modules";

export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "INTERN"] as const;
export const WORKPLACE_TYPES = ["ON_SITE", "HYBRID", "REMOTE"] as const;
export const JOB_STATUSES = ["draft", "open", "closed"] as const;
export const SALARY_PERIODS = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type WorkplaceType = (typeof WORKPLACE_TYPES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
	FULL_TIME: "Full-time",
	PART_TIME: "Part-time",
	CONTRACTOR: "Contract",
	TEMPORARY: "Temporary",
	INTERN: "Internship",
};
export const WORKPLACE_LABELS: Record<WorkplaceType, string> = {
	ON_SITE: "On-site",
	HYBRID: "Hybrid",
	REMOTE: "Remote",
};
export const STATUS_LABELS: Record<JobStatus, string> = { draft: "Draft", open: "Open", closed: "Closed" };
export const PERIOD_LABELS: Record<SalaryPeriod, string> = {
	HOUR: "Per hour",
	DAY: "Per day",
	WEEK: "Per week",
	MONTH: "Per month",
	YEAR: "Per year",
};

export type Job = {
	id: number;
	title: string;
	slug: string;
	department: string | null;
	employment_type: EmploymentType;
	workplace_type: WorkplaceType;
	location_city: string;
	location_region: string | null;
	location_country: string;
	experience: string | null;
	education: string | null;
	summary: string | null;
	description: string;
	salary_min: number | null;
	salary_max: number | null;
	salary_currency: string;
	salary_period: SalaryPeriod;
	apply_email: string | null;
	apply_url: string | null;
	apply_instructions: string | null;
	openings: number;
	status: JobStatus;
	posted_at: string | null;
	closes_at: string | null;
	meta_description: string | null;
	seo_keywords: string | null;
	view_count: number;
	created_by: string | null;
	updated_by: string | null;
	createdAt: string;
	updatedAt: string;
	is_open: boolean;
};

export type JobCounts = { total: number; live: number; draft: number; closed: number; expired: number };

/** What POST /jobs and PUT /jobs/:id read */
export type JobInput = Omit<
	Job,
	"id" | "slug" | "view_count" | "created_by" | "updated_by" | "createdAt" | "updatedAt" | "posted_at" | "is_open"
>;

/** The fields of an existing job, ready to send back (the backend replaces every field on update) */
export function toInput(job: Job): JobInput {
	return {
		title: job.title,
		department: job.department,
		employment_type: job.employment_type,
		workplace_type: job.workplace_type,
		location_city: job.location_city,
		location_region: job.location_region,
		location_country: job.location_country,
		experience: job.experience,
		education: job.education,
		summary: job.summary,
		description: job.description,
		salary_min: job.salary_min,
		salary_max: job.salary_max,
		salary_currency: job.salary_currency,
		salary_period: job.salary_period,
		apply_email: job.apply_email,
		apply_url: job.apply_url,
		apply_instructions: job.apply_instructions,
		openings: job.openings,
		status: job.status,
		closes_at: job.closes_at,
		meta_description: job.meta_description,
		seo_keywords: job.seo_keywords,
	};
}

/** Live, draft, expired (open but past its closing date) or closed */
export type JobState = "live" | "draft" | "expired" | "closed";

export const isPast = (date?: string | Date | null) => Boolean(date) && new Date(date as string).getTime() <= Date.now();

export function jobState(job: Pick<Job, "status" | "closes_at">): JobState {
	if (job.status === "draft") return "draft";
	if (job.status === "closed") return "closed";
	return isPast(job.closes_at) ? "expired" : "live";
}

export const STATE_BADGE: Record<JobState, { label: string; tone?: "good" | "warn" | "bad" }> = {
	live: { label: "Live", tone: "good" },
	draft: { label: "Draft" },
	expired: { label: "Expired", tone: "warn" },
	closed: { label: "Closed", tone: "bad" },
};

/** The job's page on the public site (drafts have none) */
export function publicJobUrl(slug: string) {
	const origin = SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
	return `${origin}/careers/${slug}`;
}

export const htmlText = (html?: string | null) =>
	(html ?? "")
		.replace(/<\/(p|li|h\d)>|<br\s*\/?>/g, " ")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&[a-z]+;|&#\d+;/g, " ")
		.replace(/\s+/g, " ")
		.trim();

const DAY = 24 * 60 * 60 * 1000;
const formatDay = (date: string | Date) =>
	new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "Closes in 5 days", "Closes today", "Closed on Mar 3, 2026" or "No closing date" */
export function closingLabel(closesAt?: string | null) {
	if (!closesAt) return "No closing date";
	const end = new Date(closesAt);
	if (end.getTime() <= Date.now()) return `Closed on ${formatDay(end)}`;
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);
	const endDay = new Date(end);
	endDay.setHours(0, 0, 0, 0);
	const days = Math.round((endDay.getTime() - startOfToday.getTime()) / DAY);
	if (days <= 0) return "Closes today";
	if (days === 1) return "Closes tomorrow";
	if (days <= 60) return `Closes in ${days} days`;
	return `Closes ${formatDay(end)}`;
}
