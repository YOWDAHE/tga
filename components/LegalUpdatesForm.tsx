"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Select, Switch, TagsInput, TextInput, Textarea } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconEye } from "@tabler/icons-react";
import { createLegalUpdate, updateLegalUpdate } from "@/app/actions/legal-updates.actions";
import { LegalUpdate } from "@/types/legal-updates";
import { useAuth } from "@/contexts/AuthContext";
import {
	DocumentEditor,
	EditorFrame,
	SaveState,
	SideCard,
	SlugField,
	StatusMenu,
	TitleBlock,
	Workspace,
	slugify,
	splitList,
	useEditorGuards,
} from "./editor";

const CONTENT_TYPE_OPTIONS = [
	{ value: "alert", label: "Client Alert" },
	{ value: "analysis", label: "Analysis" },
	{ value: "guide", label: "Guide" },
	{ value: "update", label: "Legal Update" },
];

interface LegalUpdatesFormProps {
	legalUpdateToEdit?: LegalUpdate | null;
	categories?: Array<{ value: string; label: string }>;
}

export default function LegalUpdatesForm({ legalUpdateToEdit: item, categories = [] }: LegalUpdatesFormProps) {
	const router = useRouter();
	const { user } = useAuth();
	const editing = Boolean(item);

	const [title, setTitle] = useState(item?.title ?? "");
	const [slug, setSlug] = useState(item?.slug ?? "");
	// New updates follow the title until the slug is edited by hand
	const [slugAuto, setSlugAuto] = useState(!item || item.slug === slugify(item.title));
	const [summary, setSummary] = useState(item?.summary ?? "");
	const [content, setContent] = useState(item?.content ?? "");
	const [contentType, setContentType] = useState<string>(item?.content_type ?? "update");
	const [categoryId, setCategoryId] = useState(item?.category_id ? String(item.category_id) : "");
	const [author, setAuthor] = useState(item?.author ?? "");
	const [keywords, setKeywords] = useState<string[]>(splitList(item?.seo_keywords));
	const [metaDescription, setMetaDescription] = useState(item?.meta_description ?? "");
	const [featured, setFeatured] = useState(item?.featured ?? false);
	const [published, setPublished] = useState(item?.published ?? false);
	const [wasPublished, setWasPublished] = useState(item?.published ?? false);
	const [publishedDate, setPublishedDate] = useState<Date | null>(
		item?.published_date ? new Date(item.published_date) : new Date(),
	);
	const [notify, setNotify] = useState(item?.notify_subscribers ?? true);
	const [saving, setSaving] = useState(false);
	const [savedAt, setSavedAt] = useState<string | Date | null>(item?.updatedAt ?? null);
	const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

	const snapshot = JSON.stringify({
		title,
		slug,
		summary,
		content,
		contentType,
		categoryId,
		author,
		keywords,
		metaDescription,
		featured,
		published,
		publishedDate: publishedDate?.toISOString() ?? null,
		notify,
	});
	const [baseline, setBaseline] = useState<string | null>(null);
	useEffect(() => {
		if (baseline === null) setBaseline(snapshot);
	}, [baseline, snapshot]);
	const dirty = baseline !== null && snapshot !== baseline;

	const handleTitle = (value: string) => {
		setTitle(value);
		if (slugAuto) setSlug(slugify(value));
		if (value.trim()) setErrors((e) => ({ ...e, title: undefined }));
	};

	const save = async () => {
		if (saving) return;
		const nextErrors = {
			title: title.trim() ? undefined : "Give the update a title",
			content: content.trim() ? undefined : "Write the update before saving",
		};
		setErrors(nextErrors);
		if (nextErrors.title || nextErrors.content) {
			notifications.show({
				title: "Missing details",
				message: nextErrors.title ?? nextErrors.content,
				color: "red",
			});
			return;
		}
		if (editing && !dirty) return;

		setSaving(true);
		try {
			const submitData = {
				title: title.trim(),
				slug: slug || slugify(title),
				summary,
				content,
				content_type: contentType,
				category_id: categoryId ? parseInt(categoryId) : null,
				author,
				seo_keywords: keywords.join(", "),
				meta_description: metaDescription,
				featured,
				published,
				published_date: publishedDate,
				notify_subscribers: notify,
				created_by: user?.username || "admin",
			};

			const result =
				item ? await updateLegalUpdate({ id: item.id, ...submitData }) : await createLegalUpdate(submitData);

			if (!result.success) {
				notifications.show({ title: "Couldn't save", message: result.error || "Something went wrong", color: "red" });
				return;
			}

			const emailInfo = result.data?.emailNotification;
			const emailMsg = emailInfo ? ` · ${emailInfo.emailsSent} subscriber emails sent` : "";
			notifications.show({
				title: published ? (wasPublished ? "Saved" : "Published") : "Draft saved",
				message: `${published ? "Live on the website" : "Not visible on the website yet"}${emailMsg}`,
				color: "green",
			});

			if (!item) {
				setBaseline(snapshot);
				router.push(result.data?.id ? `/legal-updates/${result.data.id}` : "/legal-updates");
				return;
			}

			setWasPublished(published);
			setSavedAt(result.data?.updatedAt ?? new Date());
			setBaseline(snapshot);
			router.refresh();
		} finally {
			setSaving(false);
		}
	};

	useEditorGuards({ dirty, onSave: save });

	const saveLabel =
		!editing ? (published ? "Publish" : "Save draft")
		: published && !wasPublished ? "Publish"
		: "Save";

	return (
		<EditorFrame
			back={{ href: "/legal-updates", label: "Legal updates" }}
			status={<SaveState saving={saving} dirty={dirty} savedAt={editing ? savedAt : null} />}
			actions={
				<>
					<StatusMenu published={published} onChange={setPublished} />
					{item && (
						<Button
							variant="default"
							component={Link}
							href={`/legal-updates/${item.id}`}
							leftSection={<IconEye size={16} />}
						>
							View
						</Button>
					)}
					<Button onClick={save} loading={saving} disabled={editing && !dirty}>
						{saveLabel}
					</Button>
				</>
			}
		>
			<TitleBlock
				eyebrow={editing ? "Legal updates · Edit" : "Legal updates · New update"}
				title={title}
				onTitle={handleTitle}
				titlePlaceholder="Update title"
				titleError={errors.title}
				summary={summary}
				onSummary={setSummary}
				summaryPlaceholder="Add a short summary for the list page and subscriber emails…"
			/>

			<Workspace
				main={
					<>
						<DocumentEditor
							value={content}
							onChange={(html) => {
								setContent(html);
								if (html) setErrors((e) => ({ ...e, content: undefined }));
							}}
							placeholder="Write the update…"
						/>
						{errors.content && (
							<div style={{ color: "#b4233c", fontSize: 13, marginTop: -6 }}>{errors.content}</div>
						)}
					</>
				}
				aside={
					<>
						<SideCard
							title="Publishing"
							hint={published ? undefined : "Drafts aren't shown on the website or emailed to subscribers."}
						>
							{published && (
								<>
									<DateTimePicker
										label="Publish date"
										value={publishedDate}
										onChange={(v) => setPublishedDate(v ? new Date(v) : null)}
										valueFormat="MMM D, YYYY h:mm A"
										mb="md"
									/>
									{/* Subscribers are only emailed the first time an update is published */}
									{!wasPublished && (
										<Switch
											label="Email subscribers"
											description="Send this update to confirmed subscribers when it's published"
											checked={notify}
											onChange={(e) => setNotify(e.currentTarget.checked)}
											mb="md"
										/>
									)}
								</>
							)}
							<Switch
								label="Featured"
								description="Pin to the top of the public list"
								checked={featured}
								onChange={(e) => setFeatured(e.currentTarget.checked)}
							/>
						</SideCard>

						<SideCard title="Details">
							<Select
								label="Type"
								data={CONTENT_TYPE_OPTIONS}
								value={contentType}
								onChange={(v) => setContentType(v ?? "update")}
								allowDeselect={false}
								mb="sm"
							/>
							<Select
								label="Practice area"
								placeholder="Choose a category"
								data={categories}
								value={categoryId || null}
								onChange={(v) => setCategoryId(v ?? "")}
								clearable
								searchable
								nothingFoundMessage="No matching category"
								mb="sm"
							/>
							<TextInput
								label="Author"
								placeholder="Attorney or author name"
								value={author}
								onChange={(e) => setAuthor(e.currentTarget.value)}
							/>
						</SideCard>

						<SideCard title="URL">
							<SlugField
								prefix="/legal-updates/"
								value={slug}
								auto={slugAuto}
								onChange={(value) => {
									setSlug(value);
									setSlugAuto(false);
								}}
								onReset={() => {
									setSlug(slugify(title));
									setSlugAuto(true);
								}}
							/>
						</SideCard>

						<SideCard title="Search engines">
							<Textarea
								label="Meta description"
								placeholder="One or two sentences shown in search results"
								autosize
								minRows={3}
								maxLength={300}
								value={metaDescription}
								onChange={(e) => setMetaDescription(e.currentTarget.value)}
								description={`${metaDescription.length}/300`}
								inputWrapperOrder={["label", "input", "description"]}
								mb="sm"
							/>
							<TagsInput
								label="Keywords"
								placeholder={keywords.length ? "" : "Type and press Enter"}
								value={keywords}
								onChange={setKeywords}
								splitChars={[","]}
								clearable
							/>
						</SideCard>
					</>
				}
			/>
		</EditorFrame>
	);
}
