"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
	Autocomplete,
	Button,
	Checkbox,
	Group,
	NumberInput,
	SegmentedControl,
	Select,
	SimpleGrid,
	Stack,
	TagsInput,
	Text,
	TextInput,
	Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangleFilled, IconCircleCheckFilled, IconExternalLink, IconTemplate } from "@tabler/icons-react";
import { createJob, updateJob } from "@/app/actions/jobs.actions";
import { RichField } from "@/components/page-builder/fields";
import { EditorFrame, SaveState, SideCard, Workspace, splitList, useEditorGuards } from "@/components/editor";
import { StatusBadge } from "@/components/admin-ui";
import {
	EMPLOYMENT_LABELS,
	EMPLOYMENT_TYPES,
	PERIOD_LABELS,
	SALARY_PERIODS,
	STATE_BADGE,
	WORKPLACE_LABELS,
	WORKPLACE_TYPES,
	htmlText,
	isPast,
	jobState,
	publicJobUrl,
	type EmploymentType,
	type Job,
	type JobInput,
	type JobStatus,
	type SalaryPeriod,
	type WorkplaceType,
} from "./types";
import classes from "./jobs.module.css";

const SUMMARY_MAX = 600;
const META_RECOMMENDED = 160;
const DESCRIPTION_GOOD = 300;

const DESCRIPTION_TEMPLATE = [
	"<h3>About the role</h3>",
	"<p>Describe the position in two or three sentences: who the person will work with, what kind of matters or clients they will handle, and why the role matters to the firm.</p>",
	"<h3>Responsibilities</h3>",
	"<ul><li><p>Advise clients on …</p></li><li><p>Draft and review …</p></li><li><p>Represent clients before …</p></li><li><p>Work with partners and associates on …</p></li></ul>",
	"<h3>Requirements</h3>",
	"<ul><li><p>LLB degree; licensed to practise in Ethiopia</p></li><li><p>… years of relevant experience</p></li><li><p>Excellent written and spoken English and Amharic</p></li><li><p>…</p></li></ul>",
	"<h3>What we offer</h3>",
	"<ul><li><p>Competitive salary and benefits</p></li><li><p>Work on significant matters for local and international clients</p></li><li><p>Mentoring and professional development</p></li></ul>",
].join("");

type Form = {
	title: string;
	department: string;
	openings: number | string;
	experience: string;
	education: string;
	employment_type: EmploymentType;
	workplace_type: WorkplaceType;
	location_city: string;
	location_region: string;
	location_country: string;
	summary: string;
	description: string;
	salary_min: number | string;
	salary_max: number | string;
	salary_currency: string;
	salary_period: SalaryPeriod;
	apply_email: string;
	apply_url: string;
	apply_instructions: string;
	status: JobStatus;
	/** YYYY-MM-DD; the job closes at the end of that day */
	closes_on: string | null;
	meta_description: string;
	seo_keywords: string[];
};

function toForm(job?: Job | null): Form {
	return {
		title: job?.title ?? "",
		department: job?.department ?? "",
		openings: job?.openings ?? 1,
		experience: job?.experience ?? "",
		education: job?.education ?? "",
		employment_type: job?.employment_type ?? "FULL_TIME",
		workplace_type: job?.workplace_type ?? "ON_SITE",
		location_city: job?.location_city ?? "Addis Ababa",
		location_region: job ? (job.location_region ?? "") : "Addis Ababa",
		location_country: job?.location_country ?? "ET",
		summary: job?.summary ?? "",
		description: job?.description ?? "",
		salary_min: job?.salary_min ?? "",
		salary_max: job?.salary_max ?? "",
		salary_currency: job?.salary_currency ?? "ETB",
		salary_period: job?.salary_period ?? "MONTH",
		apply_email: job?.apply_email ?? "",
		apply_url: job?.apply_url ?? "",
		apply_instructions: job?.apply_instructions ?? "",
		status: job?.status ?? "draft",
		closes_on: job?.closes_at ? dayjs(job.closes_at).format("YYYY-MM-DD") : null,
		meta_description: job?.meta_description ?? "",
		seo_keywords: splitList(job?.seo_keywords),
	};
}

const orNull = (v: string) => v.trim() || null;
const numOrNull = (v: number | string) => (v === "" || v === null || v === undefined ? null : Number(v));

function toInput(form: Form, status: JobStatus): JobInput {
	return {
		title: form.title.trim(),
		department: orNull(form.department),
		openings: Number(form.openings) || 1,
		experience: orNull(form.experience),
		education: orNull(form.education),
		employment_type: form.employment_type,
		workplace_type: form.workplace_type,
		location_city: form.location_city.trim() || "Addis Ababa",
		location_region: orNull(form.location_region),
		location_country: form.location_country.trim().toUpperCase() || "ET",
		summary: orNull(form.summary),
		description: form.description,
		salary_min: numOrNull(form.salary_min),
		salary_max: numOrNull(form.salary_max),
		salary_currency: form.salary_currency,
		salary_period: form.salary_period,
		apply_email: orNull(form.apply_email),
		apply_url: orNull(form.apply_url),
		apply_instructions: orNull(form.apply_instructions),
		status,
		// The end of the chosen day in the editor's time zone
		closes_at: form.closes_on ? dayjs(form.closes_on).endOf("day").toISOString() : null,
		meta_description: orNull(form.meta_description),
		seo_keywords: form.seo_keywords.length ? form.seo_keywords.join(", ") : null,
	};
}

const COUNTRY_NAMES: Record<string, string> = { ET: "Ethiopia" };

function CheckLine({ ok, recommended, children }: { ok: boolean; recommended?: boolean; children: ReactNode }) {
	return (
		<li className={classes.checkLine} data-ok={ok || undefined}>
			{ok ?
				<IconCircleCheckFilled size={18} className={classes.checkOk} />
			:	<IconAlertTriangleFilled size={18} className={classes.checkWarn} />}
			<span>
				{children}
				{recommended && !ok && <span className={classes.checkNote}> · recommended</span>}
			</span>
		</li>
	);
}

interface JobEditorProps {
	job?: Job | null;
	departments?: string[];
}

export default function JobEditor({ job: initialJob, departments = [] }: JobEditorProps) {
	const router = useRouter();
	const [job, setJob] = useState<Job | null>(initialJob ?? null);
	const editing = Boolean(job);
	const [form, setForm] = useState<Form>(() => toForm(initialJob));
	const [repost, setRepost] = useState(false);
	const [descriptionKey, setDescriptionKey] = useState(0);
	const [saving, setSaving] = useState<null | "draft" | "publish" | "save">(null);
	const [titleError, setTitleError] = useState<string | undefined>();

	const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
	const text =
		(key: keyof Form) => (e: { currentTarget: { value: string } }) =>
			set(key, e.currentTarget.value as never);

	const snapshot = JSON.stringify({ form, repost });
	const [baseline, setBaseline] = useState(snapshot);
	const dirty = snapshot !== baseline;

	const save = async (mode: "draft" | "publish" | "save") => {
		if (saving) return;
		if (!form.title.trim()) {
			setTitleError("Give the position a title");
			notifications.show({ title: "Missing details", message: "Give the position a title", color: "red" });
			return;
		}
		if (mode === "save" && !dirty) return;
		const status: JobStatus = mode === "publish" ? "open" : mode === "draft" ? "draft" : form.status;
		setSaving(mode);
		try {
			const input = toInput(form, status);
			const res = job ? await updateJob(job.id, { ...input, ...(repost ? { repost: true } : {}) }) : await createJob(input);
			if (!res.success) {
				notifications.show({ title: "Couldn't save", message: res.error, color: "red", autoClose: 8000 });
				return;
			}
			const saved = res.data;
			const state = jobState(saved);
			notifications.show({
				title:
					!job ?
						status === "open" ? "Job published" : "Draft saved"
					:	"Changes saved",
				message:
					state === "live" ? "It's live on the careers page."
					: state === "draft" ? "Not visible on the website yet."
					: state === "expired" ? "Its closing date has passed, so it's not listed on the careers page."
					: "Its page says the position is closed.",
				color: "green",
			});
			const nextForm = { ...form, status: saved.status };
			setForm(nextForm);
			setRepost(false);
			setBaseline(JSON.stringify({ form: nextForm, repost: false }));
			if (!job) {
				router.push(`/jobs/${saved.id}`);
				return;
			}
			setJob(saved);
			router.refresh();
		} finally {
			setSaving(null);
		}
	};

	useEditorGuards({ dirty, onSave: () => save(editing ? "save" : "draft") });

	// Keep the title error in step with the field
	useEffect(() => {
		if (form.title.trim()) setTitleError(undefined);
	}, [form.title]);

	const descriptionText = htmlText(form.description);
	const hasSalary = form.salary_min !== "" || form.salary_max !== "";
	const checks = [
		{ ok: Boolean(form.title.trim()), label: "Job title" },
		{
			ok: descriptionText.length >= DESCRIPTION_GOOD,
			label: `Description of ${DESCRIPTION_GOOD}+ characters (${descriptionText.length} now)`,
		},
		{ ok: Boolean(form.summary.trim()), label: "Summary" },
		{ ok: Boolean(form.location_city.trim() && form.location_country.trim()), label: "Location" },
		{ ok: Boolean(form.employment_type), label: "Employment type" },
		{ ok: Boolean(form.apply_email.trim() || form.apply_url.trim()), label: "Application email or link" },
		{ ok: Boolean(form.closes_on), label: "Closing date", recommended: true },
		{ ok: hasSalary, label: "Salary", recommended: true },
	];
	const passed = checks.filter((c) => c.ok).length;

	const country = form.location_country.trim().toUpperCase();
	const previewTitle = `${form.title.trim() || "Job title"} – ${form.location_city.trim() || "Addis Ababa"}, ${
		COUNTRY_NAMES[country] ?? country
	} | Careers at TGA Global Law Firm`;
	const previewDescription = (
		form.meta_description.trim() ||
		form.summary.trim() ||
		descriptionText ||
		"Add a summary or meta description to control the text search engines show."
	).slice(0, META_RECOMMENDED);

	const savedState = job ? jobState(job) : null;
	const closingPassed = Boolean(form.closes_on) && isPast(dayjs(form.closes_on).endOf("day").toDate());
	const canRepost = editing && Boolean(job?.posted_at) && form.status === "open";

	return (
		<EditorFrame
			back={{ href: "/jobs", label: "Careers" }}
			status={<SaveState saving={Boolean(saving)} dirty={dirty} savedAt={job?.updatedAt ?? null} />}
			actions={
				<>
					{savedState && <StatusBadge tone={STATE_BADGE[savedState].tone}>{STATE_BADGE[savedState].label}</StatusBadge>}
					{job && savedState !== "draft" && (
						<Button
							variant="default"
							component="a"
							href={publicJobUrl(job.slug)}
							target="_blank"
							rel="noreferrer"
							leftSection={<IconExternalLink size={16} />}
						>
							View on site
						</Button>
					)}
					{editing ?
						<Button onClick={() => save("save")} loading={saving === "save"} disabled={!dirty}>
							Save changes
						</Button>
					:	<>
							<Button variant="default" onClick={() => save("draft")} loading={saving === "draft"} disabled={Boolean(saving)}>
								Save draft
							</Button>
							<Button onClick={() => save("publish")} loading={saving === "publish"} disabled={Boolean(saving)}>
								Publish
							</Button>
						</>
					}
				</>
			}
		>
			<div className={classes.heading}>
				<div className={classes.eyebrow}>{editing ? "Careers · Edit job" : "Careers · New job"}</div>
				<h1 className={classes.headingTitle}>{form.title.trim() || (editing ? "Untitled job" : "Post a job")}</h1>
			</div>

			<Workspace
				main={
					<>
						<SideCard title="Position">
							<Stack gap="sm">
								<TextInput
									label="Job title"
									description="Use the title job seekers search for, e.g. “Associate Lawyer – Corporate & Commercial”"
									placeholder="Associate Lawyer – Corporate & Commercial"
									value={form.title}
									onChange={text("title")}
									maxLength={200}
									error={titleError}
									withAsterisk
								/>
								<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
									<Autocomplete
										label="Department / practice area"
										placeholder="e.g. Corporate & Commercial"
										data={departments}
										value={form.department}
										onChange={(v) => set("department", v)}
										maxLength={120}
									/>
									<NumberInput
										label="Openings"
										description="How many people you're hiring"
										min={1}
										allowDecimal={false}
										allowNegative={false}
										value={form.openings}
										onChange={(v) => set("openings", v)}
									/>
									<TextInput
										label="Experience"
										placeholder="e.g. 3–5 years post-qualification"
										value={form.experience}
										onChange={text("experience")}
										maxLength={160}
									/>
									<TextInput
										label="Education"
										placeholder="e.g. LLB, licensed to practise in Ethiopia"
										value={form.education}
										onChange={text("education")}
										maxLength={240}
									/>
								</SimpleGrid>
							</Stack>
						</SideCard>

						<SideCard title="Type & location">
							<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
								<Select
									label="Employment type"
									data={EMPLOYMENT_TYPES.map((value) => ({ value, label: EMPLOYMENT_LABELS[value] }))}
									value={form.employment_type}
									onChange={(v) => v && set("employment_type", v as EmploymentType)}
									allowDeselect={false}
								/>
								<Select
									label="Workplace"
									data={WORKPLACE_TYPES.map((value) => ({ value, label: WORKPLACE_LABELS[value] }))}
									value={form.workplace_type}
									onChange={(v) => v && set("workplace_type", v as WorkplaceType)}
									allowDeselect={false}
								/>
								<TextInput label="City" value={form.location_city} onChange={text("location_city")} maxLength={120} />
								<TextInput label="Region" value={form.location_region} onChange={text("location_region")} maxLength={120} />
								<TextInput
									label="Country code"
									description="Two letters, e.g. ET"
									value={form.location_country}
									onChange={(e) => set("location_country", e.currentTarget.value.toUpperCase().replace(/[^A-Z]/g, ""))}
									maxLength={2}
								/>
							</SimpleGrid>
						</SideCard>

						<SideCard title="Description">
							<Stack gap="md">
								<Textarea
									label="Summary"
									description="One or two sentences, shown in listings and search results"
									placeholder="We're looking for an associate to join our corporate team, advising local and international clients on…"
									autosize
									minRows={2}
									maxLength={SUMMARY_MAX}
									value={form.summary}
									onChange={text("summary")}
								/>
								<Text size="xs" c="dimmed" ta="right" mt={-12}>
									{form.summary.length}/{SUMMARY_MAX}
								</Text>
								<div>
									<RichField
										key={descriptionKey}
										label="Full description"
										description="What the job involves, who you're looking for and what you offer. Use headings and lists so it's easy to scan."
										value={form.description}
										onChange={(html) => set("description", html)}
										lists
										minHeight={260}
										required
									/>
									<Group justify="space-between" mt={6} gap="xs">
										<Text size="xs" c={descriptionText.length >= DESCRIPTION_GOOD ? "dimmed" : "orange.8"}>
											{descriptionText.length} characters
											{descriptionText.length < DESCRIPTION_GOOD && ` · aim for at least ${DESCRIPTION_GOOD}`}
										</Text>
										{!descriptionText && (
											<Button
												variant="light"
												size="xs"
												leftSection={<IconTemplate size={14} />}
												onClick={() => {
													set("description", DESCRIPTION_TEMPLATE);
													setDescriptionKey((k) => k + 1);
												}}
											>
												Use a template
											</Button>
										)}
									</Group>
								</div>
							</Stack>
						</SideCard>

						<SideCard
							title="Pay (optional)"
							hint="Listings that show pay get more clicks, and Google shows it in job search."
						>
							<SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
								<NumberInput
									label="From"
									placeholder="Min"
									min={0}
									allowNegative={false}
									allowDecimal={false}
									thousandSeparator=","
									value={form.salary_min}
									onChange={(v) => set("salary_min", v)}
								/>
								<NumberInput
									label="To"
									placeholder="Max"
									min={0}
									allowNegative={false}
									allowDecimal={false}
									thousandSeparator=","
									value={form.salary_max}
									onChange={(v) => set("salary_max", v)}
								/>
								<Select
									label="Currency"
									data={["ETB", "USD"]}
									value={form.salary_currency}
									onChange={(v) => v && set("salary_currency", v)}
									allowDeselect={false}
								/>
								<Select
									label="Period"
									data={SALARY_PERIODS.map((value) => ({ value, label: PERIOD_LABELS[value] }))}
									value={form.salary_period}
									onChange={(v) => v && set("salary_period", v as SalaryPeriod)}
									allowDeselect={false}
								/>
							</SimpleGrid>
						</SideCard>

						<SideCard title="How to apply" hint="An application email or link is needed before the job can be opened.">
							<Stack gap="sm">
								<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
									<TextInput
										label="Application email"
										type="email"
										placeholder="careers@tgagloballawfirm.com"
										value={form.apply_email}
										onChange={text("apply_email")}
										maxLength={255}
									/>
									<TextInput
										label="Application link"
										placeholder="https://…"
										value={form.apply_url}
										onChange={text("apply_url")}
										maxLength={500}
									/>
								</SimpleGrid>
								<Textarea
									label="Instructions"
									description="What to send and how, e.g. CV, cover letter and writing sample, with the job title in the subject line"
									autosize
									minRows={2}
									maxLength={2000}
									value={form.apply_instructions}
									onChange={text("apply_instructions")}
								/>
							</Stack>
						</SideCard>

						<SideCard title="Publishing">
							<Stack gap="sm">
								{editing ?
									<div>
										<Text size="sm" fw={500} mb={6}>
											Status
										</Text>
										<SegmentedControl
											data={[
												{ value: "draft", label: "Draft" },
												{ value: "open", label: "Open" },
												{ value: "closed", label: "Closed" },
											]}
											value={form.status}
											onChange={(v) => set("status", v as JobStatus)}
										/>
										<Text size="xs" c="dimmed" mt={6}>
											{form.status === "draft" ?
												"Drafts aren't shown on the website."
											: form.status === "open" ?
												closingPassed ?
													"The closing date has passed, so the job will show as expired. Pick a later date to list it."
												:	"Listed on the careers page until it's closed or the closing date passes."
											:	"Closed jobs keep their page, which says the position is closed."}
										</Text>
									</div>
								:	<Text size="sm" c="dimmed">
										“Save draft” keeps it off the website; “Publish” opens the position on the careers page.
									</Text>
								}
								<DateInput
									label="Closing date"
									description="Applications close at the end of this day. Leave empty to keep it open until you close it."
									placeholder="No closing date"
									value={form.closes_on}
									onChange={(v) => set("closes_on", v)}
									valueFormat="MMM D, YYYY"
									minDate={editing ? undefined : dayjs().format("YYYY-MM-DD")}
									clearable
									maw={320}
								/>
								{canRepost && (
									<Checkbox
										label="Show as newly posted"
										description="Moves the posted date to today and puts the job back at the top of the list."
										checked={repost}
										onChange={(e) => setRepost(e.currentTarget.checked)}
									/>
								)}
							</Stack>
						</SideCard>

						<SideCard title="Search engines">
							<Stack gap="sm">
								<Textarea
									label="Meta description"
									description="Optional; the summary is used when empty"
									placeholder={form.summary || "One or two sentences shown in search results"}
									autosize
									minRows={2}
									maxLength={300}
									value={form.meta_description}
									onChange={text("meta_description")}
								/>
								<Text
									size="xs"
									c={form.meta_description.length > META_RECOMMENDED ? "orange.8" : "dimmed"}
									ta="right"
									mt={-8}
								>
									{form.meta_description.length}/{META_RECOMMENDED} recommended
								</Text>
								<TagsInput
									label="Keywords"
									description="Separate with commas"
									placeholder={form.seo_keywords.length ? "" : "e.g. lawyer jobs Addis Ababa, associate"}
									value={form.seo_keywords}
									onChange={(v) => set("seo_keywords", v)}
									splitChars={[","]}
									clearable
								/>
								<div>
									<Text size="sm" fw={500} mb={6}>
										Search result preview
									</Text>
									<div className={classes.serp}>
										<div className={classes.serpUrl}>tgagloballawfirm.com › careers › {job?.slug ?? "…"}</div>
										<div className={classes.serpTitle}>{previewTitle}</div>
										<div className={classes.serpText}>{previewDescription}</div>
									</div>
								</div>
							</Stack>
						</SideCard>
					</>
				}
				aside={
					<SideCard
						title="Google for Jobs checklist"
						hint="Complete listings can appear in Google's job search. Warnings don't stop you from publishing."
					>
						<div className={classes.checkScore}>
							{passed} of {checks.length} done
						</div>
						<ul className={classes.checklist}>
							{checks.map((c, i) => (
								<CheckLine key={i} ok={c.ok} recommended={c.recommended}>
									{c.label}
								</CheckLine>
							))}
						</ul>
					</SideCard>
				}
			/>
		</EditorFrame>
	);
}
