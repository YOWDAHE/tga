"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
	IconAlertCircle,
	IconArrowsSort,
	IconCategory,
	IconEdit,
	IconEye,
	IconLink,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { deleteNews } from "@/app/actions/news.actions";
import { News } from "@/types";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import LinkedInConnection from "./LinkedInConnection";
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
	timeAgo,
	useListParams,
} from "./admin-ui";

const SORTS = [
	{ value: "createdAt:desc", label: "Newest first" },
	{ value: "createdAt:asc", label: "Oldest first" },
	{ value: "published_date:desc", label: "Recently published" },
	{ value: "updatedAt:desc", label: "Recently edited" },
	{ value: "title:asc", label: "Title A–Z" },
];
const DEFAULT_SORT = "createdAt:desc";

interface NewsManagementProps {
	initialNews: News[];
	error?: string | null;
	currentPage?: number;
	totalPages?: number;
	totalItems?: number;
	searchQuery?: string;
	category?: string;
	sortBy?: string;
	order?: string;
	categories?: { value: string; label: string }[];
}

export default function NewsManagement({
	initialNews,
	error,
	currentPage = 1,
	totalPages = 1,
	totalItems = 0,
	searchQuery = "",
	category = "",
	sortBy = "createdAt",
	order = "desc",
	categories = [],
}: NewsManagementProps) {
	const [news, setNews] = useState<News[]>(initialNews);
	const [deleting, setDeleting] = useState(false);
	const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
	const [itemToDelete, setItemToDelete] = useState<{ id: number; title: string } | null>(null);
	const { update, pending } = useListParams();

	useEffect(() => setNews(initialNews), [initialNews]);

	const sort = sortValue(sortBy, order);
	const categoryLabel = categories.find((c) => c.value === category)?.label;
	const filtered = Boolean(searchQuery || category);

	const handleConfirmDelete = async () => {
		if (!itemToDelete) return;
		setDeleting(true);
		try {
			const result = await deleteNews(itemToDelete.id);
			if (result.success) {
				setNews((prev) => prev.filter((item) => item.id !== itemToDelete.id));
				notifications.show({ title: "Deleted", message: `“${itemToDelete.title}” was deleted`, color: "green" });
			} else {
				notifications.show({ title: "Error", message: result.error || "Failed to delete news", color: "red" });
			}
		} finally {
			setDeleting(false);
			closeDeleteModal();
			setItemToDelete(null);
		}
	};

	return (
		<div>
			<PageHeader
				eyebrow="Content"
				title="News"
				description="Articles published to the public news feed."
				actions={
					<>
						<LinkedInConnection />
						<Button component={Link} href="/news/other" variant="default" leftSection={<IconLink size={16} />}>
							Other news
						</Button>
						<Button component={Link} href="/news/add" leftSection={<IconPlus size={16} />}>
							New article
						</Button>
					</>
				}
			/>

			<Toolbar>
				<ToolbarRow>
					<SearchPill
						value={searchQuery}
						onSearch={(q) => update({ search: q })}
						placeholder="Search title, source or author"
						pending={pending}
					/>
					<FilterPill
						icon={<IconCategory size={16} />}
						label="Category"
						value={category}
						options={[{ value: "", label: "All categories" }, ...categories]}
						onChange={(value) => update({ category: value })}
					/>
					<FilterPill
						icon={<IconArrowsSort size={16} />}
						label="Sort"
						value={sort}
						defaultValue={DEFAULT_SORT}
						options={SORTS}
						onChange={(value) => {
							const next = splitSort(value);
							update(value === DEFAULT_SORT ? { sortBy: null, order: null } : next);
						}}
					/>
				</ToolbarRow>
				<ActiveFilters
					chips={[
						...(searchQuery ? [{ key: "q", label: `“${searchQuery}”`, onRemove: () => update({ search: null }) }] : []),
						...(category ? [{ key: "c", label: categoryLabel ?? "Category", onRemove: () => update({ category: null }) }] : []),
					]}
					onClear={() => update({ search: null, category: null })}
				/>
			</Toolbar>

			{error && (
				<Alert color="red" radius="lg" mb="md" icon={<IconAlertCircle size={18} />}>
					{error}
				</Alert>
			)}

			{news.length === 0 ?
				<EmptyList
					title={filtered ? "No articles match these filters" : "No articles yet"}
					body={filtered ? "Try a different search or category." : "Articles you add appear on the public news page."}
					action={
						filtered ?
							<Button variant="default" onClick={() => update({ search: null, category: null })}>
								Clear filters
							</Button>
						:	<Button component={Link} href="/news/add" leftSection={<IconPlus size={16} />}>
								Write the first article
							</Button>
					}
				/>
			:	<>
					<TableCard pending={pending}>
						<thead>
							<tr>
								<th>Article</th>
								<th>Category</th>
								<th>Author</th>
								<th>Published</th>
								<th style={{ textAlign: "right" }}>Views</th>
								<th aria-label="Actions" />
							</tr>
						</thead>
						<tbody>
							{news.map((item) => (
								<tr key={item.id}>
									<td>
										<TitleCell
											href={`/news/${item.id}`}
											title={item.title}
											subtitle={[item.source, item.createdAt && `added ${timeAgo(item.createdAt)}`].filter(Boolean).join(" · ")}
										/>
									</td>
									<td>{item.category ? <Tag>{item.category.name}</Tag> : <span className={classes.muted}>—</span>}</td>
									<td>
										<Person name={item.created_by} />
									</td>
									<td className={classes.nowrap}>{formatDate(item.published_date)}</td>
									<td className={classes.nowrap} style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
										{(item.view_count ?? 0).toLocaleString()}
									</td>
									<td style={{ width: 48 }}>
										<RowActions
											label={item.title}
											actions={[
												{ label: "View", icon: <IconEye size={14} />, href: `/news/${item.id}` },
												{ label: "Edit", icon: <IconEdit size={14} />, href: `/news/add?edit=${item.id}` },
												{
													label: "Delete",
													icon: <IconTrash size={14} />,
													danger: true,
													divider: true,
													onClick: () => {
														setItemToDelete({ id: item.id!, title: item.title });
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
						shown={news.length}
						total={totalItems || undefined}
						noun={["article", "articles"]}
						onPage={(page) => update({ page: String(page) })}
					/>
				</>
			}

			<DeleteConfirmationModal
				opened={deleteModalOpened}
				onClose={closeDeleteModal}
				onConfirm={handleConfirmDelete}
				title="Delete article"
				message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
				loading={deleting}
			/>
		</div>
	);
}
