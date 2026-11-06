"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	IconAlertCircle,
	IconBriefcase,
	IconCopy,
	IconDoorEnter,
	IconDoorExit,
	IconEdit,
	IconExternalLink,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { createJob, deleteJob, updateJob } from "@/app/actions/jobs.actions";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import {
	EmptyList,
	PageHeader,
	RowActions,
	SearchPill,
	StatusBadge,
	StatusTabs,
	TableCard,
	TitleCell,
	Toolbar,
	ToolbarRow,
	formatDate,
	listClasses as classes,
	useListParams,
	type RowAction,
} from "@/components/admin-ui";
import {
	EMPLOYMENT_LABELS,
	STATE_BADGE,
	WORKPLACE_LABELS,
	closingLabel,
	isPast,
	jobState,
	publicJobUrl,
	toInput,
	type Job,
	type JobCounts,
} from "./types";

const FILTERS = [
	{ value: "live", label: "Live", count: "live" },
	{ value: "draft", label: "Drafts", count: "draft" },
	{ value: "expired", label: "Expired", count: "expired" },
	{ value: "closed", label: "Closed", count: "closed" },
	{ value: "", label: "All", count: "total" },
] as const;

const EMPTY_TEXT: Record<string, { title: string; body: string }> = {
	live: { title: "No live openings", body: "Open positions that are still taking applications appear here." },
	draft: { title: "No drafts", body: "Jobs you save without publishing appear here." },
	expired: { title: "Nothing has expired", body: "Open jobs whose closing date has passed appear here." },
	closed: { title: "No closed jobs", body: "Jobs you close stay on the site as “closed” and appear here." },
};

interface JobsManagementProps {
	jobs: Job[];
	counts?: JobCounts;
	error?: string | null;
	query: string;
	status: string;
}

export default function JobsManagement({ jobs: initialJobs, counts, error, query, status }: JobsManagementProps) {
	const router = useRouter();
	const { update, pending } = useListParams();
	const [jobs, setJobs] = useState(initialJobs);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [toDelete, setToDelete] = useState<Job | null>(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => setJobs(initialJobs), [initialJobs]);

	const fail = (message: string) => notifications.show({ title: "Couldn't do that", message, color: "red" });

	const setStatus = async (job: Job, next: "open" | "closed") => {
		setBusyId(job.id);
		try {
			const input = toInput(job);
			// Reopening a job whose closing date has passed would leave it expired, so drop that date
			const clearDate = next === "open" && isPast(job.closes_at);
			const res = await updateJob(job.id, { ...input, status: next, closes_at: clearDate ? null : input.closes_at });
			if (!res.success) return fail(res.error);
			notifications.show({
				title: next === "open" ? "Job reopened" : "Job closed",
				message:
					next === "open" ?
						clearDate ? "It's live again. Its closing date had passed, so it no longer has one." : "It's live again."
					:	"Its page stays up and says the position is closed.",
				color: "green",
			});
			router.refresh();
		} finally {
			setBusyId(null);
		}
	};

	const duplicate = async (job: Job) => {
		setBusyId(job.id);
		try {
			const res = await createJob({ ...toInput(job), title: `${job.title} (copy)`.slice(0, 200), status: "draft" });
			if (!res.success) return fail(res.error);
			notifications.show({ title: "Copy created", message: "Saved as a draft.", color: "green" });
			router.refresh();
		} finally {
			setBusyId(null);
		}
	};

	const remove = async () => {
		if (!toDelete) return;
		setDeleting(true);
		try {
			const res = await deleteJob(toDelete.id);
			if (!res.success) return fail(res.error);
			setJobs((prev) => prev.filter((j) => j.id !== toDelete.id));
			notifications.show({ title: "Deleted", message: `“${toDelete.title}” was removed`, color: "green" });
			setToDelete(null);
			router.refresh();
		} finally {
			setDeleting(false);
		}
	};

	const actionsFor = (job: Job): RowAction[] => {
		const state = jobState(job);
		const list: RowAction[] = [{ label: "Edit", icon: <IconEdit size={14} />, href: `/jobs/${job.id}` }];
		if (state !== "draft")
			list.push({ label: "View on site", icon: <IconExternalLink size={14} />, href: publicJobUrl(job.slug), external: true });
		if (state === "live" || state === "expired")
			list.push({ label: "Close", icon: <IconDoorExit size={14} />, onClick: () => setStatus(job, "closed") });
		if (state === "closed")
			list.push({ label: "Reopen", icon: <IconDoorEnter size={14} />, onClick: () => setStatus(job, "open") });
		list.push({ label: "Duplicate", icon: <IconCopy size={14} />, onClick: () => duplicate(job) });
		list.push({ label: "Delete", icon: <IconTrash size={14} />, danger: true, divider: true, onClick: () => setToDelete(job) });
		return list;
	};

	const postButton = (
		<Button component={Link} href="/jobs/add" leftSection={<IconPlus size={16} />}>
			Post a job
		</Button>
	);

	const nothingYet = !error && (counts?.total ?? jobs.length) === 0 && !query;
	const emptyText =
		query ? { title: "No jobs match this search", body: "Try a different title, department or city." }
		: EMPTY_TEXT[status] ?? { title: "No jobs yet", body: "" };

	return (
		<div>
			<PageHeader
				eyebrow="Site and engagement"
				title="Careers"
				description="Job openings on the careers page. Open jobs are listed until you close them or their closing date passes."
				actions={postButton}
			/>

			{!nothingYet && (
				<Toolbar>
					<StatusTabs
						value={status}
						options={FILTERS.map((f) => ({ value: f.value, label: f.label, count: counts?.[f.count] }))}
						onChange={(value) => update({ status: value })}
					/>
					<ToolbarRow>
						<SearchPill
							value={query}
							onSearch={(q) => update({ q })}
							placeholder="Search title, department or city"
							pending={pending}
						/>
					</ToolbarRow>
				</Toolbar>
			)}

			{error && (
				<Alert color="red" radius="lg" mb="md" icon={<IconAlertCircle size={18} />}>
					{error}
				</Alert>
			)}

			{nothingYet ?
				<EmptyList
					title="No job openings yet"
					body="Post your first opening. It appears on the careers page and in Google's job search once it's open."
					action={postButton}
				/>
			: jobs.length === 0 ?
				!error && (
					<EmptyList
						title={emptyText.title}
						body={emptyText.body}
						action={
							query || status ?
								<Button variant="default" onClick={() => update({ q: null, status: null })}>
									Show all jobs
								</Button>
							:	undefined
						}
					/>
				)
			:	<TableCard pending={pending}>
					<thead>
						<tr>
							<th>Position</th>
							<th>Status</th>
							<th>Posted</th>
							<th>Closing</th>
							<th style={{ textAlign: "right" }}>Views</th>
							<th aria-label="Actions" />
						</tr>
					</thead>
					<tbody>
						{jobs.map((job) => {
							const state = jobState(job);
							const badge = STATE_BADGE[state];
							return (
								<tr
									key={job.id}
									style={{ cursor: "pointer", opacity: busyId === job.id ? 0.5 : undefined }}
									onClick={(e) => {
										// Links, buttons and the actions menu handle their own clicks
										if ((e.target as HTMLElement).closest("a, button, [role=menu]")) return;
										router.push(`/jobs/${job.id}`);
									}}
								>
									<td>
										<TitleCell
											href={`/jobs/${job.id}`}
											title={job.title}
											leading={
												<span className={classes.avatar} aria-hidden>
													<IconBriefcase size={16} stroke={1.6} />
												</span>
											}
											subtitle={[
												job.department,
												`${EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type} · ${WORKPLACE_LABELS[job.workplace_type] ?? job.workplace_type}`,
												job.location_city,
											]
												.filter(Boolean)
												.join(" · ")}
										/>
									</td>
									<td>
										<StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
									</td>
									<td className={classes.nowrap}>{job.posted_at ? formatDate(job.posted_at) : <span className={classes.muted}>—</span>}</td>
									<td className={classes.nowrap}>
										{state === "closed" ?
											<span className={classes.muted}>Closed by hand</span>
										: job.closes_at ?
											<span style={{ color: state === "expired" ? "#8a5a00" : undefined }}>{closingLabel(job.closes_at)}</span>
										:	<span className={classes.muted}>No closing date</span>}
									</td>
									<td className={classes.nowrap} style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
										{(job.view_count ?? 0).toLocaleString()}
									</td>
									<td style={{ width: 48 }}>
										<RowActions label={job.title} actions={actionsFor(job)} />
									</td>
								</tr>
							);
						})}
					</tbody>
				</TableCard>
			}

			<DeleteConfirmationModal
				opened={Boolean(toDelete)}
				onClose={() => setToDelete(null)}
				onConfirm={remove}
				loading={deleting}
				title="Delete job"
				message={`Delete “${toDelete?.title}”? Its page on the careers site goes away too. This can't be undone. To take it down but keep it, close it instead.`}
			/>
		</div>
	);
}
