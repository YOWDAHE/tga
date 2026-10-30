"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Group, Modal, Select, Stack, TextInput, Textarea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import {
	IconAlertCircle,
	IconArrowsSort,
	IconCategory,
	IconDownload,
	IconEdit,
	IconEye,
	IconFileText,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { updateDocument, deleteDocument } from "@/app/actions/archive.actions";
import { Document } from "@/types";
import { convertToApiUrl } from "@/lib/utils";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import {
	ActiveFilters,
	EmptyList,
	FilterPill,
	ListFooter,
	PageHeader,
	Person,
	RowActions,
	SearchPill,
	TableCard,
	Tag,
	TitleCell,
	Toolbar,
	ToolbarRow,
	formatDate,
	listClasses as classes,
	sortValue,
	splitSort,
	useListParams,
} from "./admin-ui";

const SORTS = [
	{ value: "createdAt:desc", label: "Newest first" },
	{ value: "createdAt:asc", label: "Oldest first" },
	{ value: "updatedAt:desc", label: "Recently edited" },
	{ value: "title:asc", label: "Title A–Z" },
];
const DEFAULT_SORT = "createdAt:desc";

function formatSize(bytes?: number) {
	if (!bytes) return null;
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type Props = {
	documents: Document[];
	error?: string | null;
	currentPage: number;
	totalPages: number;
	totalItems?: number;
	searchQuery: string;
	category?: string;
	sortBy?: string;
	order?: string;
	initialCategories: { value: string; label: string }[];
};

function DocumentsManagement({
	documents: initialDocuments,
	error,
	currentPage,
	totalPages,
	totalItems = 0,
	searchQuery,
	category = "",
	sortBy = "createdAt",
	order = "desc",
	initialCategories,
}: Props) {
	const router = useRouter();
	const { update, pending } = useListParams();
	const [documents, setDocuments] = useState<Document[]>(initialDocuments);
	const [loading, setLoading] = useState(false);
	const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
	const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);
	const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
	const [editingDocument, setEditingDocument] = useState<Document | null>(null);

	useEffect(() => setDocuments(initialDocuments), [initialDocuments]);

	const categoryName = (id?: number | null) => initialCategories.find((c) => c.value === String(id))?.label;
	const sort = sortValue(sortBy, order);
	const filtered = Boolean(searchQuery || category);

	const form = useForm({
		initialValues: {
			title: "",
			category_id: "",
			author: "",
			description: "",
			seo_keywords: "",
		},
	});

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

	const handleClose = () => {
		closeModal();
		setEditingDocument(null);
		form.reset();
	};

	const handleSubmit = async (values: typeof form.values) => {
		if (!editingDocument) return;
		setLoading(true);
		try {
			const result = await updateDocument({
				id: editingDocument.id!,
				title: values.title,
				category_id: Number.parseInt(values.category_id),
				author: values.author,
				description: values.description,
				seo_keywords: values.seo_keywords,
			});
			if (result.success) {
				notifications.show({ title: "Saved", message: "Document updated", color: "green" });
				router.refresh();
				handleClose();
			} else {
				notifications.show({ title: "Error", message: result.error || "Failed to update document", color: "red" });
			}
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!itemToDelete) return;
		setLoading(true);
		try {
			const result = await deleteDocument(itemToDelete.id);
			if (result.success) {
				setDocuments((prev) => prev.filter((d) => d.id !== itemToDelete.id));
				notifications.show({ title: "Deleted", message: `“${itemToDelete.name}” was deleted`, color: "green" });
				router.refresh();
			} else {
				notifications.show({ title: "Error", message: result.error || "Failed to delete document", color: "red" });
			}
		} finally {
			setLoading(false);
			closeDeleteModal();
			setItemToDelete(null);
		}
	};

	return (
		<div>
			<PageHeader
				eyebrow="Library"
				title="Archives"
				description="Legal documents and PDFs available in the public archive."
				actions={
					<Button component={Link} href="/archives/uploads" leftSection={<IconPlus size={16} />}>
						Upload document
					</Button>
				}
			/>

			<Toolbar>
				<ToolbarRow>
					<SearchPill
						value={searchQuery}
						onSearch={(q) => update({ search: q })}
						placeholder="Search title, file name or author"
						pending={pending}
					/>
					<FilterPill
						icon={<IconCategory size={16} />}
						label="Category"
						value={category}
						options={[{ value: "", label: "All categories" }, ...initialCategories]}
						onChange={(value) => update({ category: value })}
					/>
					<FilterPill
						icon={<IconArrowsSort size={16} />}
						label="Sort"
						value={sort}
						defaultValue={DEFAULT_SORT}
						options={SORTS}
						onChange={(value) => update(value === DEFAULT_SORT ? { sortBy: null, order: null } : splitSort(value))}
					/>
				</ToolbarRow>
				<ActiveFilters
					chips={[
						...(searchQuery ? [{ key: "q", label: `“${searchQuery}”`, onRemove: () => update({ search: null }) }] : []),
						...(category ?
							[{ key: "c", label: categoryName(Number(category)) ?? "Category", onRemove: () => update({ category: null }) }]
						:	[]),
					]}
					onClear={() => update({ search: null, category: null })}
				/>
			</Toolbar>

			{error && (
				<Alert color="red" radius="lg" mb="md" icon={<IconAlertCircle size={18} />}>
					{error}
				</Alert>
			)}

			{documents.length === 0 ?
				<EmptyList
					title={filtered ? "No documents match these filters" : "No documents yet"}
					body={filtered ? "Try a different search or category." : "Uploaded PDFs appear in the public archive."}
					action={
						filtered ?
							<Button variant="default" onClick={() => update({ search: null, category: null })}>
								Clear filters
							</Button>
						:	<Button component={Link} href="/archives/uploads" leftSection={<IconPlus size={16} />}>
								Upload the first document
							</Button>
					}
				/>
			:	<>
					<TableCard pending={pending}>
						<thead>
							<tr>
								<th>Document</th>
								<th>Category</th>
								<th>Author</th>
								<th>Uploaded</th>
								<th style={{ textAlign: "right" }}>Views</th>
								<th aria-label="Actions" />
							</tr>
						</thead>
						<tbody>
							{documents.map((item) => (
								<tr key={item.id}>
									<td>
										<TitleCell
											href={`/archives/${item.id}`}
											title={item.title}
											subtitle={[item.filename, formatSize(item.file_size)].filter(Boolean).join(" · ")}
											leading={
												<span className={classes.fileIcon}>
													<IconFileText size={18} />
												</span>
											}
										/>
									</td>
									<td>
										{categoryName(item.category_id) ?
											<Tag>{categoryName(item.category_id)}</Tag>
										:	<span className={classes.muted}>—</span>}
									</td>
									<td>
										<Person name={item.author} />
									</td>
									<td className={classes.nowrap}>{formatDate(item.createdAt)}</td>
									<td className={classes.nowrap} style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
										{(item.view_count ?? 0).toLocaleString()}
									</td>
									<td style={{ width: 48 }}>
										<RowActions
											label={item.title}
											actions={[
												{ label: "View details", icon: <IconEye size={14} />, href: `/archives/${item.id}` },
												{ label: "Download PDF", icon: <IconDownload size={14} />, href: convertToApiUrl(item.file_url) ?? item.file_url, external: true },
												{ label: "Edit details", icon: <IconEdit size={14} />, onClick: () => handleEdit(item) },
												{
													label: "Delete",
													icon: <IconTrash size={14} />,
													danger: true,
													divider: true,
													onClick: () => {
														setItemToDelete({ id: item.id!, name: item.title });
														openDeleteModal();
													},
												},
											]}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</TableCard>
					<ListFooter
						page={currentPage}
						totalPages={totalPages}
						shown={documents.length}
						total={totalItems || undefined}
						noun={["document", "documents"]}
						onPage={(page) => update({ page: String(page) })}
					/>
				</>
			}

			<Modal opened={modalOpened} onClose={handleClose} title="Edit document" size="lg">
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack>
						<TextInput label="Title" placeholder="Enter document title" required {...form.getInputProps("title")} />
						<Select
							label="Category"
							placeholder="Select category"
							data={initialCategories}
							required
							{...form.getInputProps("category_id")}
						/>
						<TextInput label="Author" placeholder="Document author" {...form.getInputProps("author")} />
						<Textarea
							label="Description"
							placeholder="Brief description of the document"
							rows={3}
							{...form.getInputProps("description")}
						/>
						<TextInput
							label="SEO keywords"
							description="Comma separated. Used by search engines, not shown on the site."
							placeholder="legal document, ethiopia law, contract template"
							{...form.getInputProps("seo_keywords")}
						/>
						<Group justify="flex-end">
							<Button variant="default" onClick={handleClose}>
								Cancel
							</Button>
							<Button type="submit" loading={loading}>
								Save
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<DeleteConfirmationModal
				opened={deleteModalOpened}
				onClose={closeDeleteModal}
				onConfirm={handleConfirmDelete}
				title="Delete document"
				itemName={itemToDelete?.name}
				itemType="document"
				loading={loading}
			/>
		</div>
	);
}

export default DocumentsManagement;
