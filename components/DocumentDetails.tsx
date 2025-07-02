"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Paper,
	Group,
	Text,
	Button,
	Stack,
	Title,
	Badge,
	Divider,
	Grid,
	Card,
	ActionIcon,
	Modal,
	TextInput,
	Textarea,
	Select,
	Loader,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import {
	IconDownload,
	IconEdit,
	IconTrash,
	IconFileText,
	IconArrowLeft,
	IconEye,
	IconCalendar,
	IconUser,
	IconCategory,
	IconFile,
	IconExternalLink,
} from "@tabler/icons-react";
import { updateDocument, deleteDocument } from "@/app/actions/archive.actions";
import { Document } from "@/types";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface DocumentDetailsProps {
	document: Document;
	categories: { value: string; label: string }[];
}

const DocumentDetails = ({ document, categories }: DocumentDetailsProps) => {
	const [loading, setLoading] = useState(false);
	const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
		useDisclosure(false);
	const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
		useDisclosure(false);
	const router = useRouter();

	const form = useForm({
		initialValues: {
			title: document.title,
			category_id: document.category_id.toString(),
			author: document.author || "",
			description: document.description || "",
		},
		validate: {
			title: (value) => (!value ? "Title is required" : null),
			category_id: (value) => (!value ? "Category is required" : null),
		},
	});

	const handleEdit = () => {
		form.setValues({
			title: document.title,
			category_id: document.category_id.toString(),
			author: document.author || "",
			description: document.description || "",
		});
		openEditModal();
	};

	const handleSubmit = async (values: typeof form.values) => {
		setLoading(true);

		try {
			const result = await updateDocument({
				id: document.id!,
				title: values.title,
				category_id: Number.parseInt(values.category_id),
				author: values.author,
				description: values.description,
			});

			if (result.success) {
				notifications.show({
					title: "Success",
					message: "Document updated successfully",
					color: "green",
				});
				closeEditModal();
				router.refresh();
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update document",
					color: "red",
				});
			}
		} catch (error) {
			notifications.show({
				title: "Error",
				message: "An unexpected error occurred",
				color: "red",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		openDeleteModal();
	};

	const handleConfirmDelete = async () => {
		setLoading(true);
		try {
			const result = await deleteDocument(document.id!);
			if (result.success) {
				notifications.show({
					title: "Success",
					message: "Document deleted successfully",
					color: "green",
				});
				router.push("/archives");
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to delete document",
					color: "red",
				});
			}
		} catch (error) {
			notifications.show({
				title: "Error",
				message: "An unexpected error occurred",
				color: "red",
			});
		} finally {
			setLoading(false);
			closeDeleteModal();
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const formatDate = (date: string | Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getCategoryName = (categoryId: number) => {
		return categories.find((cat) => cat.value === categoryId.toString())?.label || "Unknown";
	};

	return (
		<div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
			{/* Header */}
			<Paper withBorder p="xl" radius="md" mb="lg">
				<Group justify="space-between" align="center">
					<Group>
						<Button
							variant="light"
							leftSection={<IconArrowLeft size={16} />}
							onClick={() => router.push("/archives")}
						>
							Back to Archives
						</Button>
						<Divider orientation="vertical" />
						<Group gap="sm">
							<IconFileText size={24} color="red" />
							<Title order={2}>{document.title}</Title>
						</Group>
					</Group>
					<Group gap="xs">
						<ActionIcon
							variant="light"
							color="blue"
							component="a"
							href={document.file_url}
							download
							disabled={loading}
							title="Download Document"
						>
							<IconDownload size={16} />
						</ActionIcon>
						<ActionIcon
							variant="light"
							color="orange"
							onClick={handleEdit}
							disabled={loading}
							title="Edit Document"
						>
							<IconEdit size={16} />
						</ActionIcon>
						<ActionIcon
							variant="light"
							color="red"
							onClick={handleDelete}
							disabled={loading}
							title="Delete Document"
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Group>
				</Group>
			</Paper>

			{/* Document Information */}
			<Grid gutter="lg">
				{/* Main Details */}
				<Grid.Col span={8}>
					<Paper withBorder p="xl" radius="md">
						<Stack gap="lg">
							<Title order={3}>Document Information</Title>
							
							<Grid>
								<Grid.Col span={6}>
									<Stack gap="xs">
										<Text size="sm" c="dimmed">
											<IconUser size={14} style={{ marginRight: 4 }} />
											Author
										</Text>
										<Text fw={500}>
											{document.author || "Not specified"}
										</Text>
									</Stack>
								</Grid.Col>
								<Grid.Col span={6}>
									<Stack gap="xs">
										<Text size="sm" c="dimmed">
											<IconCategory size={14} style={{ marginRight: 4 }} />
											Category
										</Text>
										<Badge variant="light" size="lg">
											{getCategoryName(document.category_id)}
										</Badge>
									</Stack>
								</Grid.Col>
								<Grid.Col span={6}>
									<Stack gap="xs">
										<Text size="sm" c="dimmed">
											<IconFile size={14} style={{ marginRight: 4 }} />
											File Size
										</Text>
										<Text fw={500}>
											{formatFileSize(document.file_size)}
										</Text>
									</Stack>
								</Grid.Col>
								<Grid.Col span={6}>
									<Stack gap="xs">
										<Text size="sm" c="dimmed">
											<IconEye size={14} style={{ marginRight: 4 }} />
											Views
										</Text>
										<Text fw={500}>
											{document.view_count || 0}
										</Text>
									</Stack>
								</Grid.Col>
							</Grid>

							<Divider />

							{/* Description */}
							{document.description && (
								<Stack gap="xs">
									<Title order={4}>Description</Title>
									<Text>{document.description}</Text>
								</Stack>
							)}

							{/* Content Preview */}
							{document.content_text && (
								<Stack gap="xs">
									<Title order={4}>Content Preview</Title>
									<Paper withBorder p="md" bg="gray.0">
										<Text size="sm" lineClamp={6}>
											{document.content_text}
										</Text>
									</Paper>
								</Stack>
							)}
						</Stack>
					</Paper>
				</Grid.Col>

				{/* Sidebar */}
				<Grid.Col span={4}>
					<Stack gap="lg">
						{/* File Details */}
						<Paper withBorder p="xl" radius="md">
							<Stack gap="md">
								<Title order={4}>File Details</Title>
								
								<Stack gap="xs">
									<Text size="sm" c="dimmed">
										<IconFileText size={14} style={{ marginRight: 4 }} />
										Filename
									</Text>
									<Text size="sm" fw={500}>
										{document.filename}
									</Text>
								</Stack>

								<Stack gap="xs">
									<Text size="sm" c="dimmed">
										<IconCalendar size={14} style={{ marginRight: 4 }} />
										Uploaded
									</Text>
									<Text size="sm" fw={500}>
										{formatDate(document.createdAt)}
									</Text>
								</Stack>

								{document.updatedAt && document.updatedAt !== document.createdAt && (
									<Stack gap="xs">
										<Text size="sm" c="dimmed">
											<IconCalendar size={14} style={{ marginRight: 4 }} />
											Last Modified
										</Text>
										<Text size="sm" fw={500}>
											{formatDate(document.updatedAt)}
										</Text>
									</Stack>
								)}

								<Divider />

								<Button
									component="a"
									href={document.file_url}
									target="_blank"
									leftSection={<IconExternalLink size={16} />}
									fullWidth
								>
									View in Browser
								</Button>
							</Stack>
						</Paper>

						{/* Quick Actions */}
						<Paper withBorder p="xl" radius="md">
							<Stack gap="md">
								<Title order={4}>Quick Actions</Title>
								
								<Button
									variant="light"
									leftSection={<IconDownload size={16} />}
									component="a"
									href={document.file_url}
									download
									fullWidth
								>
									Download PDF
								</Button>
								
								<Button
									variant="light"
									color="orange"
									leftSection={<IconEdit size={16} />}
									onClick={handleEdit}
									fullWidth
								>
									Edit Document
								</Button>
							</Stack>
						</Paper>
					</Stack>
				</Grid.Col>
			</Grid>

			{/* Edit Modal */}
			<Modal
				opened={editModalOpened}
				onClose={closeEditModal}
				title="Edit Document"
				size="lg"
			>
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
							data={categories}
							required
							{...form.getInputProps("category_id")}
						/>

						<TextInput
							label="Author"
							placeholder="Document author"
							{...form.getInputProps("author")}
						/>

						<Textarea
							label="Description"
							placeholder="Document description"
							rows={3}
							{...form.getInputProps("description")}
						/>

						<Group justify="flex-end">
							<Button variant="light" onClick={closeEditModal}>
								Cancel
							</Button>
							<Button type="submit" loading={loading}>
								Update Document
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				opened={deleteModalOpened}
				onClose={closeDeleteModal}
				onConfirm={handleConfirmDelete}
				title="Delete Document"
				itemName={document.title}
				itemType="document"
				loading={loading}
			/>
		</div>
	);
};

export default DocumentDetails; 