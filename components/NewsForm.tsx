"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, NumberInput, Select, Switch, TagsInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEye, IconPhotoPlus, IconX } from "@tabler/icons-react";
import { createNews, updateNews } from "@/app/actions/news.actions";
import { News } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { convertToApiUrl } from "@/lib/utils";
import {
	DocumentEditor,
	EditorFrame,
	SaveState,
	SideCard,
	TitleBlock,
	Workspace,
	editorClasses as classes,
	splitList,
	textStats,
	useEditorGuards,
} from "./editor";

export interface NewsExtended extends News {
	featured?: boolean;
	read_minutes?: number;
}

interface NewsFormProps {
	newsToEdit?: NewsExtended | null;
	categories?: Array<{ value: string; label: string }>;
}

const imageUrls = (visual?: News["visual_content"] | null) =>
	(Array.isArray(visual) ? visual : [])
		.map((img: any) =>
			typeof img === "string" ? img
			: img && typeof img === "object" && "secure_url" in img ? img.secure_url
			: "",
		)
		.filter(Boolean) as string[];

export default function NewsForm({ newsToEdit, categories = [] }: NewsFormProps) {
	const router = useRouter();
	const { user } = useAuth();
	const editing = Boolean(newsToEdit);
	const fileInput = useRef<HTMLInputElement>(null);

	const [title, setTitle] = useState(newsToEdit?.title ?? "");
	const [content, setContent] = useState(newsToEdit?.content ?? "");
	const [categoryId, setCategoryId] = useState(newsToEdit?.category_id ? String(newsToEdit.category_id) : "");
	const [hashtags, setHashtags] = useState<string[]>(splitList(newsToEdit?.hashtags));
	const [keywords, setKeywords] = useState<string[]>(splitList(newsToEdit?.seo_keywords));
	const [featured, setFeatured] = useState(newsToEdit?.featured ?? false);
	const [readMinutes, setReadMinutes] = useState<number>(newsToEdit?.read_minutes ?? 0);
	const [existingImages, setExistingImages] = useState<string[]>(imageUrls(newsToEdit?.visual_content));
	const [newFiles, setNewFiles] = useState<File[]>([]);
	const previews = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
	const [saving, setSaving] = useState(false);
	const [savedAt, setSavedAt] = useState<string | Date | null>(newsToEdit?.updatedAt ?? null);
	const [titleError, setTitleError] = useState<string | null>(null);

	useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

	const stats = textStats(content);
	// Leaving read time empty uses the estimate from the text
	const effectiveMinutes = readMinutes || Math.max(1, stats.minutes);

	const snapshot = JSON.stringify({
		title,
		content,
		categoryId,
		hashtags,
		keywords,
		featured,
		readMinutes,
		existingImages,
		files: newFiles.map((f) => `${f.name}:${f.size}`),
	});
	const [baseline, setBaseline] = useState<string | null>(null);
	useEffect(() => {
		if (baseline === null) setBaseline(snapshot);
	}, [baseline, snapshot]);
	const dirty = baseline !== null && snapshot !== baseline;

	const save = async () => {
		if (saving) return;
		if (!title.trim()) {
			setTitleError("Give the article a title");
			return;
		}
		if (editing && !dirty) return;
		setTitleError(null);
		setSaving(true);
		try {
			const submitData: any = {
				title: title.trim(),
				content,
				category_id: categoryId ? parseInt(categoryId) : null,
				published_date:
					newsToEdit?.published_date ? new Date(newsToEdit.published_date) : new Date(),
				hashtags: hashtags.join(","),
				seo_keywords: keywords.join(","),
				featured,
				read_minutes: effectiveMinutes,
				source: "Website",
				created_by: user?.username || "admin",
			};

			let result;
			if (newsToEdit) {
				// The backend keeps the listed URLs and uploads the new files
				submitData.visual_content = [...existingImages, ...newFiles];
				result = await updateNews({ id: newsToEdit.id, ...submitData });
			} else {
				if (newFiles.length > 0) submitData.visual_content = newFiles;
				result = await createNews(submitData);
			}

			if (!result.success) {
				notifications.show({ title: "Couldn't save", message: result.error || "Failed to save news", color: "red" });
				return;
			}

			if (!newsToEdit) {
				notifications.show({ title: "Published", message: "The article is live on the website", color: "green" });
				setBaseline(snapshot);
				router.push(result.data?.id ? `/news/${result.data.id}` : "/news");
				return;
			}

			notifications.show({ title: "Saved", message: "Changes are live on the website", color: "green" });
			if (result.data?.visual_content) setExistingImages(imageUrls(result.data.visual_content));
			setNewFiles([]);
			setSavedAt(result.data?.updatedAt ?? new Date());
			setBaseline(null);
			router.refresh();
		} catch {
			notifications.show({ title: "Couldn't save", message: "An unexpected error occurred", color: "red" });
		} finally {
			setSaving(false);
		}
	};

	useEditorGuards({ dirty, onSave: save });

	const addFiles = (files: FileList | null) => {
		if (files?.length) setNewFiles((prev) => [...prev, ...Array.from(files)]);
		if (fileInput.current) fileInput.current.value = "";
	};

	return (
		<EditorFrame
			back={{ href: "/news", label: "News" }}
			status={<SaveState saving={saving} dirty={dirty} savedAt={editing ? savedAt : null} />}
			actions={
				<>
					{newsToEdit && (
						<Button variant="default" component={Link} href={`/news/${newsToEdit.id}`} leftSection={<IconEye size={16} />}>
							View
						</Button>
					)}
					<Button onClick={save} loading={saving} disabled={editing && !dirty}>
						{editing ? "Save" : "Publish"}
					</Button>
				</>
			}
		>
			<TitleBlock
				eyebrow={editing ? "News · Edit article" : "News · New article"}
				title={title}
				onTitle={(value) => {
					setTitle(value);
					if (value.trim()) setTitleError(null);
				}}
				titlePlaceholder="Article title"
				titleError={titleError}
			/>

			<Workspace
				main={<DocumentEditor value={content} onChange={setContent} placeholder="Write the article…" />}
				aside={
					<>
						<SideCard title="Category">
							<Select
								placeholder="Choose a category"
								data={categories}
								value={categoryId || null}
								onChange={(v) => setCategoryId(v ?? "")}
								clearable
								searchable
								nothingFoundMessage="No matching category"
							/>
						</SideCard>

						<SideCard
							title="Images"
							hint={
								existingImages.length + newFiles.length > 0 ?
									"The first image is used as the cover."
								:	"Add a cover image and any photos for the gallery."
							}
						>
							<input
								ref={fileInput}
								type="file"
								accept="image/*,video/*"
								multiple
								hidden
								onChange={(e) => addFiles(e.target.files)}
							/>
							<div className={classes.gallery}>
								{existingImages.map((src, i) => (
									<div key={src} className={classes.thumb}>
										<img src={convertToApiUrl(src)} alt={`Image ${i + 1}`} />
										{i === 0 && <span className={classes.thumbBadge}>Cover</span>}
										<button
											type="button"
											className={classes.thumbRemove}
											aria-label={`Remove image ${i + 1}`}
											onClick={() => setExistingImages((prev) => prev.filter((s) => s !== src))}
										>
											<IconX size={13} />
										</button>
									</div>
								))}
								{previews.map((src, i) => (
									<div key={src} className={classes.thumb}>
										<img src={src} alt={newFiles[i]?.name ?? "New image"} />
										<span className={classes.thumbBadge}>
											{existingImages.length === 0 && i === 0 ? "Cover · new" : "New"}
										</span>
										<button
											type="button"
											className={classes.thumbRemove}
											aria-label={`Remove ${newFiles[i]?.name ?? "image"}`}
											onClick={() => setNewFiles((prev) => prev.filter((_, j) => j !== i))}
										>
											<IconX size={13} />
										</button>
									</div>
								))}
								<button type="button" className={classes.addThumb} onClick={() => fileInput.current?.click()}>
									<IconPhotoPlus size={20} />
									Add
								</button>
							</div>
						</SideCard>

						<SideCard title="Tags" hint="Hashtags show on the article. Search keywords are only used by search engines.">
							<TagsInput
								label="Hashtags"
								placeholder={hashtags.length ? "" : "Type and press Enter"}
								value={hashtags}
								onChange={setHashtags}
								splitChars={[",", " "]}
								clearable
								mb="sm"
							/>
							<TagsInput
								label="Search keywords"
								placeholder={keywords.length ? "" : "e.g. ethiopia corporate law"}
								value={keywords}
								onChange={setKeywords}
								splitChars={[","]}
								clearable
							/>
						</SideCard>

						<SideCard title="Display">
							<Switch
								label="Featured article"
								description="Shown first on the news page"
								checked={featured}
								onChange={(e) => setFeatured(e.currentTarget.checked)}
								mb="md"
							/>
							<NumberInput
								label="Read time (minutes)"
								placeholder={`${Math.max(1, stats.minutes)} (estimated)`}
								min={0}
								max={120}
								value={readMinutes || ""}
								onChange={(v) => setReadMinutes(typeof v === "number" ? v : 0)}
								description={readMinutes ? undefined : "Leave empty to use the estimate"}
							/>
						</SideCard>
					</>
				}
			/>
		</EditorFrame>
	);
}
