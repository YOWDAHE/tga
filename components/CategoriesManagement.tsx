"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Group, Modal, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/category.actions";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import {
	ActiveFilters,
	EmptyList,
	ListFooter,
	PageHeader,
	RowActions,
	SearchPill,
	TableCard,
	TitleCell,
	Toolbar,
	ToolbarRow,
	formatDate,
	listClasses as classes,
	useListParams,
} from "./admin-ui";

interface Category {
	id: number;
	name: string;
	description?: string;
	newsCount?: number;
	documentsCount?: number;
	createdAt: string | Date;
	updatedAt: string | Date;
}

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalCount: number;
	limit: number;
}

type Props = {
	categories: Category[];
	pagination: PaginationInfo | null;
	currentPage: number;
	searchQuery: string;
	error?: string | null;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function CategoriesManagement({
	categories: initialCategories,
	pagination,
	currentPage,
	searchQuery,
	error,
}: Props) {
	const { update, pending } = useListParams();
	const [categories, setCategories] = useState<Category[]>(initialCategories);
	const [opened, { open, close }] = useDisclosure(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
	const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

	useEffect(() => setCategories(initialCategories), [initialCategories]);

	const form = useForm({
		initialValues: { name: "", description: "" },
		validate: { name: (v) => (v.trim() ? null : "Name is required") },
	});

	const handleSubmit = async (values: typeof form.values) => {
		setIsSubmitting(true);
		try {
			const result =
				editingCategory ? await updateCategory({ id: editingCategory.id, ...values }) : await createCategory(values);
			if (!result.success) {
				notifications.show({ title: "Error", message: result.error, color: "red" });
				return;
			}
			if (editingCategory) {
				setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? { ...c, ...result.data } : c)));
				notifications.show({ title: "Saved", message: "Category updated", color: "green" });
			} else {
				setCategories((prev) => [...prev, { newsCount: 0, documentsCount: 0, ...result.data }]);
				notifications.show({ title: "Saved", message: "Category created", color: "green" });
			}
			handleClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdit = (category: Category) => {
		setEditingCategory(category);
		form.setValues({ name: category.name, description: category.description || "" });
		open();
	};

	const handleCreate = () => {
		setEditingCategory(null);
		form.reset();
		open();
	};

	const handleClose = () => {
		close();
		setEditingCategory(null);
		form.reset();
	};

	const handleConfirmDelete = async () => {
		if (!categoryToDelete) return;
		setIsSubmitting(true);
		try {
			const result = await deleteCategory(categoryToDelete.id);
			if (result.success) {
				setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
				notifications.show({ title: "Deleted", message: `“${categoryToDelete.name}” was deleted`, color: "green" });
			} else {
				notifications.show({ title: "Error", message: result.error, color: "red" });
			}
		} finally {
			setIsSubmitting(false);
			closeDeleteModal();
			setCategoryToDelete(null);
		}
	};

	const usage = (c: Category) => (c.newsCount ?? 0) + (c.documentsCount ?? 0);

	return (
		<div>
			<PageHeader
				eyebrow="Library"
				title="Categories"
				description="Topics used to group news articles and archive documents."
				actions={
					<Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
						New category
					</Button>
				}
			/>

			<Toolbar>
				<ToolbarRow>
					<SearchPill
						value={searchQuery}
						onSearch={(q) => update({ search: q })}
						placeholder="Search categories"
						pending={pending}
					/>
				</ToolbarRow>
				<ActiveFilters
					chips={searchQuery ? [{ key: "q", label: `“${searchQuery}”`, onRemove: () => update({ search: null }) }] : []}
					onClear={() => update({ search: null })}
				/>
			</Toolbar>

			{error && (
				<Alert color="red" radius="lg" mb="md" icon={<IconAlertCircle size={18} />}>
					{error}
				</Alert>
			)}

			{categories.length === 0 ?
				<EmptyList
					title={searchQuery ? "No categories match this search" : "No categories yet"}
					body={searchQuery ? "Try a different name." : "Create a category to start grouping content."}
					action={
						searchQuery ?
							<Button variant="default" onClick={() => update({ search: null })}>
								Clear search
							</Button>
						:	<Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
								New category
							</Button>
					}
				/>
			:	<>
					<TableCard pending={pending}>
						<thead>
							<tr>
								<th>Category</th>
								<th>Used by</th>
								<th>Created</th>
								<th>Updated</th>
								<th aria-label="Actions" />
							</tr>
						</thead>
						<tbody>
							{categories.map((item) => (
								<tr key={item.id}>
									<td>
										<TitleCell title={item.name} subtitle={item.description || "No description"} />
									</td>
									<td className={classes.nowrap}>
										{usage(item) === 0 ?
											<span className={classes.muted}>Not used yet</span>
										:	<>
												{plural(item.newsCount ?? 0, "article")}
												<span className={classes.muted}> · </span>
												{plural(item.documentsCount ?? 0, "document")}
											</>
										}
									</td>
									<td className={classes.nowrap}>{formatDate(item.createdAt)}</td>
									<td className={classes.nowrap}>{formatDate(item.updatedAt)}</td>
									<td style={{ width: 48 }}>
										<RowActions
											label={item.name}
											actions={[
												{ label: "Edit", icon: <IconEdit size={14} />, onClick: () => handleEdit(item) },
												{
													label: "Delete",
													icon: <IconTrash size={14} />,
													danger: true,
													divider: true,
													onClick: () => {
														setCategoryToDelete(item);
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
						totalPages={pagination?.totalPages ?? 1}
						shown={categories.length}
						total={pagination?.totalCount}
						noun={["category", "categories"]}
						onPage={(page) => update({ page: String(page) })}
					/>
				</>
			}

			<Modal opened={opened} onClose={handleClose} title={editingCategory ? "Edit category" : "New category"} centered>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack>
						<TextInput label="Name" placeholder="e.g. Corporate & Commercial" required {...form.getInputProps("name")} />
						<Textarea
							label="Description"
							placeholder="What belongs in this category"
							rows={4}
							{...form.getInputProps("description")}
						/>
						<Group justify="flex-end">
							<Button variant="default" onClick={handleClose} disabled={isSubmitting}>
								Cancel
							</Button>
							<Button type="submit" loading={isSubmitting}>
								{editingCategory ? "Save" : "Create"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<DeleteConfirmationModal
				opened={deleteModalOpened}
				onClose={closeDeleteModal}
				onConfirm={handleConfirmDelete}
				title="Delete category"
				message={
					categoryToDelete && usage(categoryToDelete) > 0 ?
						`“${categoryToDelete.name}” is used by ${plural(categoryToDelete.newsCount ?? 0, "article")} and ${plural(categoryToDelete.documentsCount ?? 0, "document")}. Delete it anyway?`
					:	undefined
				}
				itemName={categoryToDelete?.name}
				itemType="category"
				loading={isSubmitting}
			/>
		</div>
	);
}
