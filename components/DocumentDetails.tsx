"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Group, Modal, Select, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconEdit, IconExternalLink, IconFileUpload, IconTrash } from "@tabler/icons-react";
import { updateDocument, deleteDocument, replaceDocumentFile } from "@/app/actions/archive.actions";
import { Document } from "@/types";
import { convertToApiUrl } from "@/lib/utils";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { formatDate } from "./admin-ui";
import {
	Chips,
	EditorFrame,
	Facts,
	SaveState,
	SideCard,
	TitleBlock,
	Workspace,
	editorClasses as classes,
	splitList,
	useEditorGuards,
} from "./editor";

interface DocumentDetailsProps {
	document: Document;
	categories: { value: string; label: string }[];
}

function formatFileSize(bytes?: number | null) {
	if (!bytes) return "—";
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const fileExtension = (doc: Document) => {
	const name = (doc.filename || doc.file_url || "").split("?")[0];
	const ext = name.includes(".") ? name.split(".").pop() : "";
	return (ext || "").toLowerCase();
};

const valuesOf = (doc: Document) => ({
	title: doc.title ?? "",
	category_id: doc.category_id != null ? String(doc.category_id) : "",
	author: doc.author || "",
	description: doc.description || "",
});

const DocumentDetails = ({ document, categories }: DocumentDetailsProps) => {
	const router = useRouter();
	const [editing, setEditing] = useState(false);
	const [values, setValues] = useState(() => valuesOf(document));
	const [errors, setErrors] = useState<{ title?: string; category?: string }>({});
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [savedAt, setSavedAt] = useState<string | Date | null>(document.updatedAt ?? null);
	const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
	const [showAllText, setShowAllText] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);
	const [newFile, setNewFile] = useState<File | null>(null);
	const [replacing, setReplacing] = useState(false);

	const fileUrl = convertToApiUrl(document.file_url) ?? document.file_url;
	const ext = fileExtension(document);
	const previewable = ext === "pdf" || (!ext && Boolean(document.file_url));
	const categoryName =
		categories.find((c) => c.value === String(document.category_id))?.label ?? "Uncategorised";
	const keywords = splitList(document.seo_keywords);
	const contentText = document.content_text?.trim() ?? "";

	const dirty = editing && JSON.stringify(values) !== JSON.stringify(valuesOf(document));
	const set = (key: keyof typeof values) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

	const startEdit = () => {
		setValues(valuesOf(document));
		setErrors({});
		setEditing(true);
	};

	const cancelEdit = () => {
		setValues(valuesOf(document));
		setErrors({});
		setEditing(false);
	};

	const save = async () => {
		if (!editing || saving) return;
		const nextErrors = {
			title: values.title.trim() ? undefined : "Title is required",
			category: values.category_id ? undefined : "Category is required",
		};
		setErrors(nextErrors);
		if (nextErrors.title || nextErrors.category) return;
		if (!dirty) {
			setEditing(false);
			return;
		}

		setSaving(true);
		try {
			const result = await updateDocument({
				id: document.id!,
				title: values.title,
				category_id: Number.parseInt(values.category_id),
				author: values.author,
				description: values.description,
			});

			if (result.success) {
				notifications.show({ title: "Saved", message: "Document updated successfully", color: "green" });
				setSavedAt(result.data?.updatedAt ?? new Date());
				setEditing(false);
				router.refresh();
			} else {
				notifications.show({ title: "Error", message: result.error || "Failed to update document", color: "red" });
			}
		} catch {
			notifications.show({ title: "Error", message: "An unexpected error occurred", color: "red" });
		} finally {
			setSaving(false);
		}
	};

	useEditorGuards({ dirty, onSave: save });

	const handleConfirmDelete = async () => {
		setDeleting(true);
		try {
			const result = await deleteDocument(document.id!);
			if (result.success) {
				notifications.show({ title: "Deleted", message: "Document deleted successfully", color: "green" });
				router.push("/archives");
			} else {
				notifications.show({ title: "Error", message: result.error || "Failed to delete document", color: "red" });
			}
		} catch {
			notifications.show({ title: "Error", message: "An unexpected error occurred", color: "red" });
		} finally {
			setDeleting(false);
			closeDeleteModal();
		}
	};

	const confirmReplace = async () => {
		if (!newFile) return;
		setReplacing(true);
		const result = await replaceDocumentFile(document.id!, newFile);
		setReplacing(false);
		if (result.success) {
			notifications.show({
				title: "File replaced",
				message: `${newFile.name} is now the document's file; the old file was deleted`,
				color: "green",
			});
			setNewFile(null);
			setSavedAt(result.data?.updatedAt ?? new Date());
			router.refresh();
		} else {
			notifications.show({ title: "Couldn't replace the file", message: result.error, color: "red" });
		}
	};

	const busy = saving || deleting || replacing;

	const fileActions = (
		<>
			<Button
				variant="default"
				component="a"
				href={fileUrl}
				target="_blank"
				rel="noopener noreferrer"
				leftSection={<IconExternalLink size={16} />}
			>
				Open
			</Button>
			<Button variant="default" component="a" href={fileUrl} download={document.filename || true} leftSection={<IconDownload size={16} />}>
				Download
			</Button>
		</>
	);

	const preview =
		previewable ?
			<div className={classes.filePreview}>
				<div className={classes.filePreviewHead}>
					<span>Preview</span>
					<span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>{document.filename}</span>
				</div>
				<iframe src={`${fileUrl}#navpanes=0`} title={`Preview of ${document.title}`} loading="lazy" />
			</div>
		:	<div className={classes.fileCard}>
				<span className={classes.fileIcon}>{(ext || "file").slice(0, 4).toUpperCase()}</span>
				<div className={classes.fileInfo}>
					<div className={classes.fileName}>{document.filename || document.title}</div>
					<div className={classes.fileMeta}>
						{formatFileSize(document.file_size)} · Preview isn&apos;t available for this file type
					</div>
				</div>
				<div className={classes.fileActions}>{fileActions}</div>
			</div>;

	const extracted = contentText && (
		<section className={classes.section}>
			<div className={classes.sectionHeader}>
				<div className={classes.sectionTitle}>Extracted text</div>
				{contentText.length > 600 && (
					<button type="button" className={classes.linkButton} onClick={() => setShowAllText((v) => !v)}>
						{showAllText ? "Show less" : "Show all"}
					</button>
				)}
			</div>
			<div className={classes.extracted} data-clamped={(!showAllText && contentText.length > 600) || undefined}>
				{contentText}
			</div>
		</section>
	);

	return (
		<EditorFrame
			back={{ href: "/archives", label: "Archives" }}
			status={editing ? <SaveState saving={saving} dirty={dirty} /> : <SaveState savedAt={savedAt} />}
			actions={
				editing ?
					<>
						<Button variant="default" onClick={cancelEdit} disabled={saving}>
							Cancel
						</Button>
						<Button onClick={save} loading={saving}>
							Save
						</Button>
					</>
				:	<>
						<Button
							variant="subtle"
							color="red"
							onClick={openDeleteModal}
							disabled={busy}
							leftSection={<IconTrash size={16} />}
						>
							Delete
						</Button>
						<Button onClick={startEdit} disabled={busy} leftSection={<IconEdit size={16} />}>
							Edit
						</Button>
					</>
			}
		>
			{editing && (
				<TitleBlock
					eyebrow="Archives · Edit document"
					title={values.title}
					onTitle={(value) => {
						set("title")(value);
						if (value.trim()) setErrors((e) => ({ ...e, title: undefined }));
					}}
					titlePlaceholder="Document title"
					titleError={errors.title}
					summary={values.description}
					onSummary={set("description")}
					summaryPlaceholder="Add a short description (optional)"
				/>
			)}

			<Workspace
				main={
					<>
						{!editing && (
							<article className={classes.article}>
								<div className={classes.articleInner}>
									<div className={classes.eyebrow}>{categoryName}</div>
									<h1 className={classes.articleTitle}>{document.title}</h1>
									<div className={classes.articleMeta}>
										{document.author && <span>{document.author}</span>}
										<span>{formatDate(document.createdAt)}</span>
										{Boolean(document.file_size) && <span>{formatFileSize(document.file_size)}</span>}
										<span>{(document.view_count ?? 0).toLocaleString()} views</span>
									</div>
									{document.description ?
										<p className={classes.articleSummary}>{document.description}</p>
									:	<p className={classes.empty} style={{ marginTop: 20 }}>
											No description.
										</p>
									}
								</div>
							</article>
						)}
						{preview}
						{extracted}
					</>
				}
				aside={
					<>
						{editing && (
							<SideCard title="Details">
								<Select
									label="Category"
									placeholder="Choose a category"
									data={categories}
									value={values.category_id || null}
									onChange={(v) => {
										set("category_id")(v ?? "");
										if (v) setErrors((e) => ({ ...e, category: undefined }));
									}}
									error={errors.category}
									searchable
									nothingFoundMessage="No matching category"
									mb="sm"
								/>
								<TextInput
									label="Author"
									placeholder="Optional"
									value={values.author}
									onChange={(e) => set("author")(e.currentTarget.value)}
								/>
							</SideCard>
						)}

						<SideCard title="File">
							<Facts
								items={[
									{ label: "Filename", value: document.filename || "—" },
									{ label: "Type", value: ext ? ext.toUpperCase() : "—" },
									{ label: "Size", value: formatFileSize(document.file_size) },
									{ label: "Views", value: (document.view_count ?? 0).toLocaleString() },
								]}
							/>
							<div className={classes.asideButtons}>{fileActions}</div>
							<input
								ref={fileInput}
								type="file"
								accept="application/pdf,.pdf"
								hidden
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) setNewFile(file);
									e.target.value = "";
								}}
							/>
							<Button
								fullWidth
								mt="xs"
								variant="light"
								leftSection={<IconFileUpload size={16} />}
								onClick={() => fileInput.current?.click()}
								disabled={busy}
							>
								Replace file
							</Button>
						</SideCard>

						{!editing && (
							<SideCard title="Details">
								<Facts
									items={[
										{ label: "Category", value: categoryName },
										{ label: "Author", value: document.author || "—" },
										{ label: "Uploaded", value: formatDate(document.createdAt) },
										Boolean(document.updatedAt) && { label: "Last edited", value: formatDate(document.updatedAt) },
									]}
								/>
							</SideCard>
						)}

						<SideCard title="Search keywords" hint="Used by search; not shown on the website.">
							{keywords.length ? <Chips items={keywords} /> : <p className={classes.prose}>None</p>}
						</SideCard>
					</>
				}
			/>

			<Modal
				opened={Boolean(newFile)}
				onClose={() => !replacing && setNewFile(null)}
				title="Replace file"
				centered
				radius="lg"
			>
				<Text size="sm">
					Replace <b>{document.filename || "the current file"}</b> with <b>{newFile?.name}</b> (
					{formatFileSize(newFile?.size)})?
				</Text>
				<Text size="sm" c="dimmed" mt="xs">
					The current file is deleted from the server once the new one is saved. The title, description and other
					details stay the same.
				</Text>
				<Group justify="flex-end" mt="lg">
					<Button variant="default" onClick={() => setNewFile(null)} disabled={replacing}>
						Cancel
					</Button>
					<Button onClick={confirmReplace} loading={replacing} leftSection={<IconFileUpload size={16} />}>
						Replace file
					</Button>
				</Group>
			</Modal>

			<DeleteConfirmationModal
				opened={deleteModalOpened}
				onClose={closeDeleteModal}
				onConfirm={handleConfirmDelete}
				title="Delete Document"
				itemName={document.title}
				itemType="document"
				loading={deleting}
			/>
		</EditorFrame>
	);
};

export default DocumentDetails;
