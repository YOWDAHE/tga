"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Paper,
	Group,
	Text,
	Button,
	Modal,
	TextInput,
	Textarea,
	Select,
	Stack,
	Title,
	Loader,
	Alert,
	FileInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";
import {
	IconUpload,
	IconFileText,
	IconCheck,
	IconX,
	IconAlertCircle,
} from "@tabler/icons-react";
import { uploadDocument } from "@/app/actions/archive.actions";

interface UploadFormData {
	title: string;
	category_id: string;
	author: string;
	description: string;
	seo_keywords: string;
}

const UploadForm = ({ categories }: { categories: any[] }) => {
	const [loading, setLoading] = useState(false);
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [
		previewModalOpened,
		{ open: openPreviewModal, close: closePreviewModal },
	] = useDisclosure(false);
	const router = useRouter();

	const form = useForm<UploadFormData>({
		initialValues: {
			title: "",
			category_id: "",
			author: "",
			description: "",
			seo_keywords: "",
		},
		validate: {
			title: (value) => (!value ? "Title is required" : null),
			category_id: (value) => (!value ? "Category is required" : null),
		},
	});

	// Categories are already in the correct format from the server action
	const initialCategories = categories;

	const handleFileDrop = (files: File[]) => {
		if (files.length > 0) {
			const file = files[0];
			if (file.type === "application/pdf") {
				setUploadedFile(file);
				// Auto-fill title if empty
				if (!form.values.title) {
					form.setFieldValue("title", file.name.replace(".pdf", ""));
				}
				notifications.show({
					title: "File uploaded",
					message: `${file.name} has been selected for upload`,
					color: "green",
					icon: <IconCheck size={16} />,
				});
			} else {
				notifications.show({
					title: "Invalid file type",
					message: "Please upload a PDF file",
					color: "red",
					icon: <IconX size={16} />,
				});
			}
		}
	};

    const handleFileReject = (files: any[]) => {
        console.log(files);
		notifications.show({
			title: "File rejected",
			message: "Please upload a valid PDF file",
			color: "red",
			icon: <IconX size={16} />,
		});
	};

	const handleSubmit = async (values: UploadFormData) => {
		if (!uploadedFile) {
			notifications.show({
				title: "No file selected",
				message: "Please upload a PDF file",
				color: "red",
				icon: <IconX size={16} />,
			});
			return;
		}

		setLoading(true);

		try {
			// Create FormData for file upload
			const formData = new FormData();
			formData.append("file", uploadedFile);
			formData.append("title", values.title);
			formData.append("category_id", values.category_id);
			formData.append("author", values.author);
			formData.append("description", values.description);
			formData.append("seo_keywords", values.seo_keywords);

			const result = await uploadDocument(formData);

			if (result.success) {
				notifications.show({
					title: "Success",
					message: "Document uploaded successfully",
					color: "green",
					icon: <IconCheck size={16} />,
				});

				// Reset form and redirect
				form.reset();
				setUploadedFile(null);
				router.push("/archives");
			} else {
				notifications.show({
					title: "Upload failed",
					message: result.error || "Failed to upload document",
					color: "red",
					icon: <IconX size={16} />,
				});
			}
		} catch (error) {
			notifications.show({
				title: "Error",
				message: "An unexpected error occurred",
				color: "red",
				icon: <IconX size={16} />,
			});
		} finally {
			setLoading(false);
		}
	};

	const handlePreview = () => {
		if (uploadedFile) {
			openPreviewModal();
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	return (
		<div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
			<Paper withBorder p="xl" radius="md">
				<Stack gap="lg">
					{/* Header */}
					<Group justify="space-between" align="center">
						<div>
							<Title order={2}>Upload Document</Title>
							<Text c="dimmed" size="sm">
								Upload a PDF document to the archives
							</Text>
						</div>
						<Button variant="light" onClick={() => router.push("/archives")}>
							Back to Archives
						</Button>
					</Group>

					{/* File Upload Section */}
					<Paper withBorder p="md">
						<Text fw={500} mb="md">
							Select PDF File
						</Text>

						{uploadedFile ?
							<Paper withBorder p="md" bg="gray.0">
								<Group justify="space-between" align="center">
									<Group gap="sm">
										<IconFileText size={24} color="red" />
										<div>
											<Text fw={500}>{uploadedFile.name}</Text>
											<Text size="sm" c="dimmed">
												{formatFileSize(uploadedFile.size)}
											</Text>
										</div>
									</Group>
									<Group gap="xs">
										<Button variant="light" size="sm" onClick={handlePreview}>
											Preview
										</Button>
										<Button
											variant="light"
											color="red"
											size="sm"
											onClick={() => setUploadedFile(null)}
										>
											Remove
										</Button>
									</Group>
								</Group>
							</Paper>
						:	<Dropzone
								onDrop={handleFileDrop}
                                onReject={handleFileReject}
								accept={PDF_MIME_TYPE}
								maxFiles={1}
							>
								<Group
									justify="center"
									gap="xl"
									mih={220}
									style={{ pointerEvents: "none" }}
								>
									<Dropzone.Accept>
										<IconUpload
											size={50}
											stroke={1.5}
											color="var(--mantine-color-blue-6)"
										/>
									</Dropzone.Accept>
									<Dropzone.Reject>
										<IconX size={50} stroke={1.5} color="var(--mantine-color-red-6)" />
									</Dropzone.Reject>
									<Dropzone.Idle>
										<IconUpload size={50} stroke={1.5} />
									</Dropzone.Idle>

									<div>
										<Text size="xl" inline>
											Drag PDF file here or click to select
										</Text>
										<Text size="sm" c="dimmed" inline mt={7}>
											Only PDF files are accepted
										</Text>
									</div>
								</Group>
							</Dropzone>
						}
					</Paper>

					{/* Form Section */}
					<form onSubmit={form.onSubmit(handleSubmit)}>
						<Stack gap="md">
							<TextInput
								label="Document Title"
								placeholder="Enter document title"
								required
								{...form.getInputProps("title")}
							/>

							<Select
								label="Category"
								placeholder="Select category"
								data={initialCategories}
								required
								{...form.getInputProps("category_id")}
							/>

							<TextInput
								label="Author"
								placeholder="Document author (optional)"
								{...form.getInputProps("author")}
							/>

							<Textarea
								label="Description"
								placeholder="Brief description of the document (optional)"
								rows={3}
								{...form.getInputProps("description")}
							/>

							<TextInput
								label="SEO Keywords"
								placeholder="Enter SEO keywords, separated by commas (e.g. legal document,ethiopia law,contract template) - These won't be displayed on the frontend but used for search engine optimization"
								{...form.getInputProps("seo_keywords")}
							/>

							{/* Submit Button */}
							<Group justify="flex-end" mt="md">
								<Button
									variant="light"
									onClick={() => router.push("/archives")}
									disabled={loading}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									loading={loading}
									disabled={!uploadedFile}
									leftSection={<IconUpload size={16} />}
								>
									Upload Document
								</Button>
							</Group>
						</Stack>
					</form>

					{/* Info Alert */}
					<Alert
						icon={<IconAlertCircle size={16} />}
						title="Upload Guidelines"
						color="blue"
						variant="light"
					>
						<Text size="sm">
							• Only PDF files are accepted
							<br />
							• Document title and category are required
							<br />• Author and description are optional
						</Text>
					</Alert>
				</Stack>
			</Paper>

			{/* Preview Modal */}
			<Modal
				opened={previewModalOpened}
				onClose={closePreviewModal}
				title="File Preview"
				size="lg"
			>
				{uploadedFile && (
					<Stack>
						<Group>
							<IconFileText size={24} color="red" />
							<div>
								<Text fw={500}>{uploadedFile.name}</Text>
								<Text size="sm" c="dimmed">
									{formatFileSize(uploadedFile.size)}
								</Text>
							</div>
						</Group>
						<Text size="sm">
							File preview is not available for PDF files. Please ensure this is the
							correct document before uploading.
						</Text>
					</Stack>
				)}
			</Modal>
		</div>
	);
};

export default UploadForm;
