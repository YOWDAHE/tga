"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Select, TagsInput, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Dropzone, PDF_MIME_TYPE, type FileRejection } from "@mantine/dropzone";
import { IconCheck, IconFileUpload, IconUpload, IconX } from "@tabler/icons-react";
import { uploadDocument } from "@/app/actions/archive.actions";
import {
	EditorFrame,
	SideCard,
	TitleBlock,
	Workspace,
	editorClasses as classes,
	useEditorGuards,
} from "./editor";

type Category = { value: string; label: string };

function formatFileSize(bytes?: number | null) {
	if (!bytes) return "0 KB";
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const UploadForm = ({ categories }: { categories: Category[] }) => {
	const router = useRouter();
	const openPicker = useRef<() => void>(null);

	const [file, setFile] = useState<File | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [author, setAuthor] = useState("");
	const [keywords, setKeywords] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<{ title?: string; category?: string; file?: string }>({});

	const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
	useEffect(() => () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
	}, [previewUrl]);

	const dirty = Boolean(file || title || description || categoryId || author || keywords.length);

	const handleDrop = (files: File[]) => {
		const next = files[0];
		if (!next) return;
		if (next.type !== "application/pdf") {
			notifications.show({ title: "Invalid file type", message: "Please upload a PDF file", color: "red", icon: <IconX size={16} /> });
			return;
		}
		setFile(next);
		setErrors((e) => ({ ...e, file: undefined }));
		// Auto-fill the title from the file name when it's empty
		if (!title.trim()) {
			setTitle(next.name.replace(/\.pdf$/i, ""));
			setErrors((e) => ({ ...e, title: undefined }));
		}
	};

	const handleReject = (rejections: FileRejection[]) => {
		const reason = rejections[0]?.errors[0]?.message;
		notifications.show({
			title: "File rejected",
			message: reason ? `Please upload a valid PDF file (${reason})` : "Please upload a valid PDF file",
			color: "red",
			icon: <IconX size={16} />,
		});
	};

	const submit = async () => {
		if (loading) return;
		const nextErrors = {
			title: title.trim() ? undefined : "Title is required",
			category: categoryId ? undefined : "Category is required",
			file: file ? undefined : "Choose a PDF to upload",
		};
		setErrors(nextErrors);
		if (!file || nextErrors.title || nextErrors.category) {
			notifications.show({
				title: "Missing details",
				message: [nextErrors.file, nextErrors.title, nextErrors.category].filter(Boolean).join(" · "),
				color: "red",
				icon: <IconX size={16} />,
			});
			return;
		}

		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("title", title.trim());
			formData.append("category_id", categoryId);
			formData.append("author", author);
			formData.append("description", description);
			formData.append("seo_keywords", keywords.join(","));

			const result = await uploadDocument(formData);

			if (result.success) {
				notifications.show({
					title: "Uploaded",
					message: "Document uploaded successfully",
					color: "green",
					icon: <IconCheck size={16} />,
				});
				setFile(null);
				setTitle("");
				setDescription("");
				setCategoryId("");
				setAuthor("");
				setKeywords([]);
				router.push("/archives");
			} else {
				notifications.show({
					title: "Upload failed",
					message: result.error || "Failed to upload document",
					color: "red",
					icon: <IconX size={16} />,
				});
			}
		} catch {
			notifications.show({ title: "Error", message: "An unexpected error occurred", color: "red", icon: <IconX size={16} /> });
		} finally {
			setLoading(false);
		}
	};

	useEditorGuards({ dirty: dirty && !loading, onSave: submit });

	return (
		<EditorFrame
			back={{ href: "/archives", label: "Archives" }}
			actions={
				<>
					<Button variant="default" component={Link} href="/archives" disabled={loading}>
						Cancel
					</Button>
					<Button onClick={submit} loading={loading} leftSection={<IconUpload size={16} />}>
						Upload
					</Button>
				</>
			}
		>
			<TitleBlock
				eyebrow="Archives · Upload document"
				title={title}
				onTitle={(value) => {
					setTitle(value);
					if (value.trim()) setErrors((e) => ({ ...e, title: undefined }));
				}}
				titlePlaceholder="Document title"
				titleError={errors.title}
				summary={description}
				onSummary={setDescription}
				summaryPlaceholder="Add a short description (optional)"
			/>

			<Workspace
				main={
					<>
						<Dropzone
							unstyled
							openRef={openPicker}
							onDrop={handleDrop}
							onReject={handleReject}
							accept={PDF_MIME_TYPE}
							maxFiles={1}
							multiple={false}
							disabled={loading}
							activateOnClick={!file}
							className={classes.dropzone}
							data-invalid={errors.file ? true : undefined}
							style={file ? { display: "none" } : undefined}
						>
							<div style={{ pointerEvents: "none" }}>
								<div className={classes.dropzoneIcon}>
									<Dropzone.Reject>
										<IconX size={26} stroke={1.6} />
									</Dropzone.Reject>
									<Dropzone.Accept>
										<IconUpload size={26} stroke={1.6} />
									</Dropzone.Accept>
									<Dropzone.Idle>
										<IconFileUpload size={26} stroke={1.6} />
									</Dropzone.Idle>
								</div>
								<div className={classes.dropzoneTitle}>
									<Dropzone.Reject>Only PDF files can be uploaded</Dropzone.Reject>
									<Dropzone.Idle>Drop a PDF here</Dropzone.Idle>
									<Dropzone.Accept>Drop to add this file</Dropzone.Accept>
								</div>
								<div className={classes.dropzoneHint}>
									{errors.file ?? "One PDF per document. The title is filled in from the file name."}
								</div>
								<span className={classes.dropzoneButton}>Choose file</span>
							</div>
						</Dropzone>

						{file && (
							<>
								<div className={classes.fileCard}>
									<span className={classes.fileIcon}>PDF</span>
									<div className={classes.fileInfo}>
										<div className={classes.fileName}>{file.name}</div>
										<div className={classes.fileMeta}>
											{formatFileSize(file.size)} · {file.type || "application/pdf"}
										</div>
									</div>
									<div className={classes.fileActions}>
										<Button variant="default" size="sm" onClick={() => openPicker.current?.()} disabled={loading}>
											Replace
										</Button>
										<Button variant="light" size="sm" color="red" onClick={() => setFile(null)} disabled={loading}>
											Remove
										</Button>
									</div>
								</div>

								{previewUrl && (
									<div className={classes.filePreview}>
										<div className={classes.filePreviewHead}>Preview</div>
										<iframe src={`${previewUrl}#navpanes=0`} title={`Preview of ${file.name}`} />
									</div>
								)}
							</>
						)}
					</>
				}
				aside={
					<>
						<SideCard title="Category">
							<Select
								placeholder="Choose a category"
								data={categories}
								value={categoryId || null}
								onChange={(v) => {
									setCategoryId(v ?? "");
									if (v) setErrors((e) => ({ ...e, category: undefined }));
								}}
								error={errors.category}
								searchable
								nothingFoundMessage="No matching category"
								aria-label="Category"
							/>
						</SideCard>

						<SideCard title="Author">
							<TextInput
								placeholder="Optional"
								value={author}
								onChange={(e) => setAuthor(e.currentTarget.value)}
								aria-label="Author"
							/>
						</SideCard>

						<SideCard title="Search keywords" hint="Used by search; not shown on the website.">
							<TagsInput
								placeholder={keywords.length ? "" : "e.g. ethiopia law, contract"}
								value={keywords}
								onChange={setKeywords}
								splitChars={[","]}
								clearable
								aria-label="Search keywords"
							/>
						</SideCard>

						<SideCard title="Before you upload">
							<p className={classes.prose}>
								Only PDF files are accepted. A title and category are required; author, description and
								keywords are optional and can be edited later.
							</p>
						</SideCard>
					</>
				}
			/>
		</EditorFrame>
	);
};

export default UploadForm;
