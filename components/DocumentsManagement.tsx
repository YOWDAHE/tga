"use client";
import React from "react";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Table,
	Paper,
	Group,
	Text,
	ActionIcon,
	Badge,
	Button,
	Modal,
	TextInput,
	Textarea,
	Select,
	Stack,
	Title,
	Loader,
	Skeleton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone";

import {
	IconEdit,
	IconTrash,
	IconPlus,
	IconDownload,
	IconFileText,
	IconChevronLeft,
	IconChevronRight,
	IconSearch,
	IconEye,
} from "@tabler/icons-react";
import { updateDocument, deleteDocument } from "@/app/actions/archive.actions";
import { Document } from "@/types";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import EmptyState from "./EmptyState";
import { FileX2Icon } from "lucide-react";

type Props = {
	documents: Document[];
	currentPage: number;
	totalPages: number;
	searchQuery: string;
	category?: string;
	sortBy?: string;
	order?: string;
	initialCategories: { value: string; label: string }[];
};

function DocumentsManagement({
	documents: initialDocuments,
	currentPage,
	totalPages,
	searchQuery,
	category,
	sortBy,
	order,
	initialCategories,
}: Props) {
	const [documents, setDocuments] = useState<Document[]>(
		initialDocuments.map((doc) => ({
			...doc,
			createdAt:
				typeof doc.createdAt === "string" ? new Date(doc.createdAt) : doc.createdAt,
			updatedAt:
				typeof doc.updatedAt === "string" ? new Date(doc.updatedAt) : doc.updatedAt,
		}))
	);

	// Update state when props change (for pagination)
	useEffect(() => {
		setDocuments(
			initialDocuments.map((doc) => ({
				...doc,
				createdAt:
					typeof doc.createdAt === "string" ?
						new Date(doc.createdAt)
					:	doc.createdAt,
				updatedAt:
					typeof doc.updatedAt === "string" ?
						new Date(doc.updatedAt)
					:	doc.updatedAt,
			}))
		);
		setPaginationLoading(false);
	}, [initialDocuments]);

	const [loading, setLoading] = useState(false);
	const [searchLoading, setSearchLoading] = useState(false);
	const [paginationLoading, setPaginationLoading] = useState(false);
	const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
		useDisclosure(false);
	const [itemToDelete, setItemToDelete] = useState<{
		id: number;
		name: string;
	} | null>(null);

	// Router for pagination
	const router = useRouter();
	const searchParams = useSearchParams();

	// Skeleton component for loading states
	const DocumentsTableSkeleton = () => (
		<Table>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Title</Table.Th>
					<Table.Th>Category</Table.Th>
					<Table.Th>Author</Table.Th>
					<Table.Th>Filename</Table.Th>
					<Table.Th>Upload Date</Table.Th>
					<Table.Th>Actions</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{Array.from({ length: 6 }).map((_, index) => (
					<Table.Tr key={index}>
						<Table.Td>
							<Group gap="sm">
								<Skeleton height={20} width={20} circle />
								<Skeleton height={20} width={150} />
							</Group>
						</Table.Td>
						<Table.Td>
							<Skeleton height={24} width={100} radius="xl" />
						</Table.Td>
						<Table.Td>
							<Skeleton height={20} width={120} />
						</Table.Td>
						<Table.Td>
							<Skeleton height={20} width={180} />
						</Table.Td>
						<Table.Td>
							<Skeleton height={20} width={100} />
						</Table.Td>
						<Table.Td>
							<Group gap="xs">
								<Skeleton height={32} width={32} radius="sm" />
								<Skeleton height={32} width={32} radius="sm" />
								<Skeleton height={32} width={32} radius="sm" />
							</Group>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);

	// Pagination functions
	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setPaginationLoading(true);
			const params = new URLSearchParams(searchParams.toString());
			params.set("page", newPage.toString());
			router.push(`/archives?${params.toString()}`);
		}
	};

	// Search and filter functions
	const [searchInputValue, setSearchInputValue] = useState(searchQuery);
	const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
		null
	);
	const [selectedCategory, setSelectedCategory] = useState(category || "");
	const [selectedSortBy, setSelectedSortBy] = useState(sortBy || "createdAt");
	const [selectedOrder, setSelectedOrder] = useState(order || "desc");

	// Debounced search function
	const debouncedSearch = useCallback(
		(query: string) => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}

			const timeout = setTimeout(() => {
				setSearchLoading(true);
				const params = new URLSearchParams(searchParams.toString());
				if (query.trim()) {
					params.set("search", query.trim());
				} else {
					params.delete("search");
				}
				params.delete("page"); // Reset to first page when searching
				router.push(`/archives?${params.toString()}`);
			}, 500); // 500ms delay

			setSearchTimeout(timeout);
		},
		[searchParams, router, searchTimeout]
	);

	const handleSearchInput = (query: string) => {
		setSearchInputValue(query);
		debouncedSearch(query);
	};

	const handleSearchClear = () => {
		setSearchInputValue("");
		debouncedSearch("");
	};

	const handleCategoryChange = (newCategory: string | null) => {
		const categoryValue = newCategory || "";
		setSelectedCategory(categoryValue);
		const params = new URLSearchParams(searchParams.toString());
		if (categoryValue) {
			params.set("category", categoryValue);
		} else {
			params.delete("category");
		}
		params.delete("page"); // Reset to first page when filtering
		router.push(`/archives?${params.toString()}`);
	};

	const handleSortChange = (newSortBy: string | null) => {
		const sortValue = newSortBy || "createdAt";
		setSelectedSortBy(sortValue);
		const params = new URLSearchParams(searchParams.toString());
		params.set("sortBy", sortValue);
		params.delete("page"); // Reset to first page when sorting
		router.push(`/archives?${params.toString()}`);
	};

	const handleOrderChange = (newOrder: string | null) => {
		const orderValue = newOrder || "desc";
		setSelectedOrder(orderValue);
		const params = new URLSearchParams(searchParams.toString());
		params.set("order", orderValue);
		params.delete("page"); // Reset to first page when sorting
		router.push(`/archives?${params.toString()}`);
	};

	// Update search input value when URL changes
	useEffect(() => {
		setSearchInputValue(searchQuery);
		setSelectedCategory(category || "");
		setSelectedSortBy(sortBy || "createdAt");
		setSelectedOrder(order || "desc");
		setSearchLoading(false);
	}, [searchQuery, category, sortBy, order]);

	// Cleanup timeouts on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	// Modal states
	const [modalOpened, { open: openModal, close: closeModal }] =
		useDisclosure(false);
	const [editingDocument, setEditingDocument] = useState<Document | null>(null);
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);

	const form = useForm({
		initialValues: {
			title: "",
			category_id: "",
			author: "",
			description: "",
			seo_keywords: "",
		},
	});

	const handleSubmit = async (values: typeof form.values) => {
		if (!uploadedFile && !editingDocument) {
			notifications.show({
				title: "Error",
				message: "Please upload a PDF file",
				color: "red",
			});
			return;
		}

		setLoading(true);

		try {
			if (editingDocument) {
				const result = await updateDocument({
					id: editingDocument.id!,
					title: values.title,
					category_id: Number.parseInt(values.category_id),
					author: values.author,
					description: values.description,
					seo_keywords: values.seo_keywords,
				});

				if (result.success) {
					notifications.show({
						title: "Success",
						message: "Document updated successfully",
						color: "green",
					});
					// Refresh the page to get updated data
					router.refresh();
				} else {
					notifications.show({
						title: "Error",
						message: result.error || "Failed to update document",
						color: "red",
					});
				}
			} else {
				// For now, we'll skip file upload in this implementation
				// You would need to implement file upload to Cloudinary here
				notifications.show({
					title: "Info",
					message: "File upload functionality needs to be implemented",
					color: "blue",
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
			handleClose();
		}
	};

	const handleEdit = (document: Document) => {
		setEditingDocument(document);
		form.setValues({
			title: document.title,
			category_id: document.category_id.toString(),
			author: document.author || "",
			description: document.description || "",
			seo_keywords: document.seo_keywords || "",
		});
		openModal();
	};

	const handleDelete = async (id: number) => {
		const document = documents.find((doc) => doc.id === id);
		if (document) {
			setItemToDelete({ id, name: document.title });
			openDeleteModal();
		}
	};

	const handleConfirmDelete = async () => {
		if (!itemToDelete) return;

		setLoading(true);
		try {
			const result = await deleteDocument(itemToDelete.id);
			if (result.success) {
				notifications.show({
					title: "Success",
					message: "Document deleted successfully",
					color: "green",
				});
				// Refresh the page to get updated data
				router.refresh();
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
			setItemToDelete(null);
		}
	};

	const handleClose = () => {
		closeModal();
		setEditingDocument(null);
		setUploadedFile(null);
		form.reset();
	};

	const handleCreate = () => {
		router.push("/archives/uploads");
	};

	const formatDate = (date: string | Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div style={{ padding: "24px" }}>
			<Group justify="space-between" mb="lg">
				<Title order={2}>Archives Management</Title>
				<Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
					Upload Document
				</Button>
			</Group>

			{/* Search and Filter Bar */}
			<Paper withBorder p="md" mb="md">
				<Stack gap="md">
					<Group>
						<TextInput
							placeholder="Search documents..."
							value={searchInputValue}
							onChange={(e) => handleSearchInput(e.currentTarget.value)}
							style={{ flex: 1 }}
							leftSection={
								searchLoading ? <Loader size="xs" /> : <IconSearch size={16} />
							}
						/>
						{searchInputValue && (
							<Button variant="light" onClick={handleSearchClear}>
								Clear
							</Button>
						)}

						<Select
							placeholder="Filter by category"
							value={selectedCategory}
							onChange={handleCategoryChange}
							data={[{ value: "", label: "All Categories" }, ...initialCategories]}
							style={{ minWidth: 200 }}
						/>

						<Select
							placeholder="Sort by"
							value={selectedSortBy}
							onChange={handleSortChange}
							data={[
								{ value: "createdAt", label: "Upload Date" },
								{ value: "updatedAt", label: "Last Modified" },
								{ value: "title", label: "Title" },
							]}
							style={{ minWidth: 150 }}
						/>

						<Select
							placeholder="Order"
							value={selectedOrder}
							onChange={handleOrderChange}
							data={[
								{ value: "desc", label: "Descending" },
								{ value: "asc", label: "Ascending" },
							]}
							style={{ minWidth: 120 }}
						/>
					</Group>

					{(searchInputValue || selectedCategory) && (
						<Text size="sm" c="dimmed">
							Found {documents.length} document{documents.length !== 1 ? "s" : ""}
							{searchInputValue && ` matching "${searchInputValue}"`}
							{selectedCategory &&
								` in ${initialCategories.find((c) => c.value === selectedCategory)?.label || "selected category"}`}
						</Text>
					)}
				</Stack>
			</Paper>

			{documents.length === 0 && (
				<EmptyState
					title="No documents found"
					description="There are no documents that match your search."
					icon={<FileX2Icon size={48} />}
				/>
			)}

			{documents.length > 0 && (
				<Paper withBorder>
					{searchLoading || paginationLoading ?
						<DocumentsTableSkeleton />
					:	<Table striped highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Title</Table.Th>
									<Table.Th>Category</Table.Th>
									<Table.Th>Author</Table.Th>
									<Table.Th>Filename</Table.Th>
									<Table.Th>Upload Date</Table.Th>
									<Table.Th>Actions</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{documents.map((item) => (
									<Table.Tr key={item.id}>
										<Table.Td>
											<Group gap="sm">
												<IconFileText size={20} color="red" />
												<Text fw={500} truncate w={200}>{item.title}</Text>
											</Group>
										</Table.Td>
										<Table.Td>
											<Badge variant="light">
												{initialCategories.find(
													(c) => c.value === item.category_id.toString()
												)?.label || "Unknown"}
											</Badge>
										</Table.Td>
										<Table.Td>{item.author || "N/A"}</Table.Td>
										<Table.Td>
											<Text size="sm" c="dimmed">
												{item.filename}
											</Text>
										</Table.Td>
										<Table.Td>{formatDate(item.createdAt)}</Table.Td>
										<Table.Td>
											<Group gap="xs">
												<ActionIcon
													variant="light"
													color="green"
													component="a"
													href={`/office/archives/${item.id}`}
													disabled={loading}
													title="View Details"
												>
													<IconEye size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="blue"
													component="a"
													href={item.file_url}
													download
													disabled={loading}
													title="Download"
												>
													<IconDownload size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="orange"
													onClick={() => handleEdit(item)}
													disabled={loading}
													title="Edit"
												>
													<IconEdit size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="red"
													onClick={() => handleDelete(item.id!)}
													disabled={loading}
													title="Delete"
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Group>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					}
				</Paper>
			)}

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<Group justify="end" mt="md">
					<Button
						variant="light"
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage <= 1 || paginationLoading}
						leftSection={
							paginationLoading ? <Loader size="xs" /> : <IconChevronLeft size={16} />
						}
					>
						Previous
					</Button>

					<Group gap="xs">
						{/* Show first page */}
						{currentPage > 3 && (
							<Button variant="light" size="sm" onClick={() => handlePageChange(1)}>
								1
							</Button>
						)}

						{/* Show ellipsis if needed */}
						{currentPage > 4 && (
							<Text size="sm" c="dimmed">
								...
							</Text>
						)}

						{/* Show pages around current page */}
						{Array.from({ length: totalPages }, (_, i) => i + 1)
							.filter(
								(page) =>
									page >= Math.max(1, currentPage - 1) &&
									page <= Math.min(totalPages, currentPage + 1)
							)
							.map((page) => (
								<Button
									key={page}
									variant={page === currentPage ? "filled" : "light"}
									size="sm"
									onClick={() => handlePageChange(page)}
								>
									{page}
								</Button>
							))}

						{/* Show ellipsis if needed */}
						{currentPage < totalPages - 3 && (
							<Text size="sm" c="dimmed">
								...
							</Text>
						)}

						{/* Show last page */}
						{currentPage < totalPages - 2 && (
							<Button
								variant="light"
								size="sm"
								onClick={() => handlePageChange(totalPages)}
							>
								{totalPages}
							</Button>
						)}
					</Group>

					<Button
						variant="light"
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage >= totalPages || paginationLoading}
						rightSection={
							paginationLoading ? <Loader size="xs" /> : <IconChevronRight size={16} />
						}
					>
						Next
					</Button>
				</Group>
			)}

			{/* Upload/Edit Modal */}
			<Modal
				opened={modalOpened}
				onClose={handleClose}
				title={editingDocument ? "Edit Document" : "Upload Document"}
				size="lg"
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack>
						{!editingDocument && (
							<div>
								<Text size="sm" fw={500} mb="xs">
									Upload PDF File
								</Text>
								<Dropzone
									onDrop={(files) => setUploadedFile(files[0])}
									accept={PDF_MIME_TYPE}
									maxFiles={1}
								>
									<Group
										justify="center"
										gap="xl"
										mih={220}
										style={{ pointerEvents: "none" }}
									>
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
								{uploadedFile && (
									<Text size="sm" mt="xs">
										Selected: {uploadedFile.name}
									</Text>
								)}
							</div>
						)}

						<TextInput
							label="Title"
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
							placeholder="Document author"
							{...form.getInputProps("author")}
						/>

						<Textarea
							label="Description"
							placeholder="Brief description of the document"
							rows={3}
							{...form.getInputProps("description")}
						/>

						<TextInput
							label="SEO Keywords"
							placeholder="Enter SEO keywords, separated by commas (e.g. legal document,ethiopia law,contract template) - These won't be displayed on the frontend but used for search engine optimization"
							{...form.getInputProps("seo_keywords")}
						/>

						<Group justify="flex-end">
							<Button variant="light" onClick={handleClose}>
								Cancel
							</Button>
							<Button type="submit" loading={loading}>
								{editingDocument ? "Update" : "Upload"}
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
				itemName={itemToDelete?.name}
				itemType="document"
				loading={loading}
			/>
		</div>
	);
}

export default DocumentsManagement;
