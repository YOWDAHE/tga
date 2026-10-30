"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconArrowsSort,
  IconEdit,
  IconEye,
  IconPlus,
  IconTag,
  IconTrash,
} from "@tabler/icons-react";
import { deleteLegalUpdate, deleteLegalUpdateSubscriber } from "@/app/actions/legal-updates.actions";
import { LegalUpdate, LegalUpdateSubscriber } from "@/types/legal-updates";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import {
  ActiveFilters,
  EmptyList,
  FilterPill,
  ListFooter,
  PageHeader,
  RowActions,
  SearchPill,
  StatusBadge,
  StatusTabs,
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

const CONTENT_TYPE_LABELS: Record<string, string> = {
  alert: "Client Alert",
  analysis: "Analysis",
  guide: "Guide",
  update: "Legal Update",
};

const SORTS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "published_date:desc", label: "Recently published" },
  { value: "updatedAt:desc", label: "Recently edited" },
  { value: "title:asc", label: "Title A–Z" },
];
const DEFAULT_SORT = "createdAt:desc";

type PageInfo = { page: number; totalPages: number; total: number };

interface LegalUpdatesManagementProps {
  initialUpdates: LegalUpdate[];
  initialSubscribers: LegalUpdateSubscriber[];
  error?: string | null;
  updatesPage: PageInfo;
  subscribersPage: PageInfo;
  statusCounts?: { published: number; draft: number };
  searchQuery?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  order?: string;
  activeTab?: "updates" | "subscribers";
}

export default function LegalUpdatesManagement({
  initialUpdates,
  initialSubscribers,
  error,
  updatesPage,
  subscribersPage,
  statusCounts,
  searchQuery = "",
  status = "",
  type = "",
  sortBy = "createdAt",
  order = "desc",
  activeTab = "updates",
}: LegalUpdatesManagementProps) {
  const [updates, setUpdates] = useState<LegalUpdate[]>(initialUpdates);
  const [subscribers, setSubscribers] = useState<LegalUpdateSubscriber[]>(initialSubscribers);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; title: string; type: "update" | "subscriber" } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { update, pending } = useListParams();

  useEffect(() => {
    setUpdates(initialUpdates);
    setSubscribers(initialSubscribers);
  }, [initialUpdates, initialSubscribers]);

  const onSubscribers = activeTab === "subscribers";
  const sort = sortValue(sortBy, order);
  const filtered = Boolean(searchQuery || type || status);
  const counts = statusCounts && {
    all: statusCounts.published + statusCounts.draft,
    published: statusCounts.published,
    draft: statusCounts.draft,
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      const result =
        itemToDelete.type === "update" ?
          await deleteLegalUpdate(itemToDelete.id)
        : await deleteLegalUpdateSubscriber(itemToDelete.id);

      if (result.success) {
        notifications.show({
          title: "Deleted",
          message: `${itemToDelete.type === "update" ? "Legal update" : "Subscriber"} removed`,
          color: "green",
        });
        if (itemToDelete.type === "update") setUpdates((prev) => prev.filter((u) => u.id !== itemToDelete.id));
        else setSubscribers((prev) => prev.filter((s) => s.id !== itemToDelete.id));
        closeDeleteModal();
      } else {
        notifications.show({ title: "Error", message: result.error || "Delete failed", color: "red" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const askDelete = (id: number, title: string, kind: "update" | "subscriber") => {
    setItemToDelete({ id, title, type: kind });
    openDeleteModal();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Legal updates"
        description="Client alerts, analysis and guides, emailed to subscribers when published."
        actions={
          <Button component={Link} href="/legal-updates/add" leftSection={<IconPlus size={16} />}>
            New legal update
          </Button>
        }
      />

      <Toolbar>
        <StatusTabs
          value={onSubscribers ? "subscribers" : status}
          options={[
            { value: "", label: "All", count: counts?.all },
            { value: "published", label: "Published", count: counts?.published },
            { value: "draft", label: "Drafts", count: counts?.draft },
            { value: "subscribers", label: "Subscribers", count: subscribersPage.total },
          ]}
          onChange={(value) =>
            value === "subscribers" ?
              update({ tab: "subscribers", search: null, status: null, type: null })
            : update({ tab: null, status: value, ...(onSubscribers ? { search: null } : {}) })
          }
        />
        <ToolbarRow>
          <SearchPill
            key={activeTab}
            value={searchQuery}
            onSearch={(q) => update({ search: q })}
            placeholder={onSubscribers ? "Search email or name" : "Search title, summary or author"}
            pending={pending}
          />
          {!onSubscribers && (
            <>
              <FilterPill
                icon={<IconTag size={16} />}
                label="Type"
                value={type}
                options={[
                  { value: "", label: "All types" },
                  ...Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
                ]}
                onChange={(value) => update({ type: value })}
              />
              <FilterPill
                icon={<IconArrowsSort size={16} />}
                label="Sort"
                value={sort}
                defaultValue={DEFAULT_SORT}
                options={SORTS}
                onChange={(value) => update(value === DEFAULT_SORT ? { sortBy: null, order: null } : splitSort(value))}
              />
            </>
          )}
        </ToolbarRow>
        {!onSubscribers && (
          <ActiveFilters
            chips={[
              ...(searchQuery ? [{ key: "q", label: `“${searchQuery}”`, onRemove: () => update({ search: null }) }] : []),
              ...(status ?
                [{ key: "s", label: status === "published" ? "Published" : "Drafts", onRemove: () => update({ status: null }) }]
              : []),
              ...(type ? [{ key: "t", label: CONTENT_TYPE_LABELS[type] ?? type, onRemove: () => update({ type: null }) }] : []),
            ]}
            onClear={() => update({ search: null, status: null, type: null })}
          />
        )}
      </Toolbar>

      {error && !onSubscribers && (
        <Alert color="red" radius="lg" mb="md" icon={<IconAlertCircle size={18} />}>
          {error}
        </Alert>
      )}

      {!onSubscribers &&
        (updates.length === 0 ?
          <EmptyList
            title={filtered ? "No legal updates match these filters" : "No legal updates yet"}
            body={filtered ? "Try a different search, status or type." : "Create your first client alert or guide."}
            action={
              filtered ?
                <Button variant="default" onClick={() => update({ search: null, status: null, type: null })}>
                  Clear filters
                </Button>
              : <Button component={Link} href="/legal-updates/add" leftSection={<IconPlus size={16} />}>
                  New legal update
                </Button>
            }
          />
        : <>
            <TableCard pending={pending}>
              <thead>
                <tr>
                  <th>Update</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th style={{ textAlign: "right" }}>Views</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {updates.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <TitleCell
                        href={`/legal-updates/${item.id}`}
                        title={item.title}
                        subtitle={[item.author, `edited ${timeAgo(item.updatedAt)}`].filter(Boolean).join(" · ")}
                      />
                    </td>
                    <td>
                      <Tag>{CONTENT_TYPE_LABELS[item.content_type] || item.content_type}</Tag>
                    </td>
                    <td>
                      <StatusBadge tone={item.published ? "good" : undefined}>{item.published ? "Published" : "Draft"}</StatusBadge>
                    </td>
                    <td className={classes.nowrap}>{formatDate(item.published_date)}</td>
                    <td className={classes.nowrap} style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {(item.view_count ?? 0).toLocaleString()}
                    </td>
                    <td style={{ width: 48 }}>
                      <RowActions
                        label={item.title}
                        actions={[
                          { label: "View", icon: <IconEye size={14} />, href: `/legal-updates/${item.id}` },
                          { label: "Edit", icon: <IconEdit size={14} />, href: `/legal-updates/add?edit=${item.id}` },
                          {
                            label: "Delete",
                            icon: <IconTrash size={14} />,
                            danger: true,
                            divider: true,
                            onClick: () => askDelete(item.id, item.title, "update"),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
            <ListFooter
              page={updatesPage.page}
              totalPages={updatesPage.totalPages}
              shown={updates.length}
              total={updatesPage.total || undefined}
              noun={["update", "updates"]}
              onPage={(page) => update({ page: String(page) })}
            />
          </>)}

      {onSubscribers &&
        (subscribers.length === 0 ?
          <EmptyList
            title={searchQuery ? "No subscribers match this search" : "No subscribers yet"}
            body={searchQuery ? "Try a different email or name." : "People who sign up on the public site appear here."}
          />
        : <>
            <TableCard pending={pending}>
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Status</th>
                  <th>Subscribed</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <TitleCell
                        title={sub.name || sub.email}
                        subtitle={sub.name ? sub.email : undefined}
                        leading={<span className={classes.avatar}>{(sub.name || sub.email).slice(0, 1)}</span>}
                      />
                    </td>
                    <td>
                      {!sub.is_confirmed ?
                        <StatusBadge tone="warn">Unconfirmed</StatusBadge>
                      : sub.is_active ?
                        <StatusBadge tone="good">Active</StatusBadge>
                      : <StatusBadge>Unsubscribed</StatusBadge>}
                    </td>
                    <td className={classes.nowrap}>{formatDate(sub.createdAt)}</td>
                    <td style={{ width: 48 }}>
                      <RowActions
                        label={sub.email}
                        actions={[
                          {
                            label: "Remove subscriber",
                            icon: <IconTrash size={14} />,
                            danger: true,
                            onClick: () => askDelete(sub.id, sub.email, "subscriber"),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
            <ListFooter
              page={subscribersPage.page}
              totalPages={subscribersPage.totalPages}
              shown={subscribers.length}
              total={subscribersPage.total || undefined}
              noun={["subscriber", "subscribers"]}
              onPage={(page) => update({ page: String(page) })}
            />
          </>)}

      <DeleteConfirmationModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={itemToDelete?.type === "subscriber" ? "Remove subscriber" : "Delete legal update"}
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
