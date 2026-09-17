"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Title,
  Button,
  Table,
  Group,
  ActionIcon,
  Paper,
  Badge,
  Text,
  TextInput,
  Select,
  Loader,
  Skeleton,
  Tabs,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconEye,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { deleteLegalUpdate, deleteLegalUpdateSubscriber } from "@/app/actions/legal-updates.actions";
import { LegalUpdate, LegalUpdateSubscriber } from "@/types/legal-updates";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import EmptyState from "./EmptyState";
import { FileX2Icon } from "lucide-react";
import Link from "next/link";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  alert: "Client Alert",
  analysis: "Analysis",
  guide: "Guide",
  update: "Legal Update",
};

interface LegalUpdatesManagementProps {
  initialUpdates: LegalUpdate[];
  initialSubscribers: LegalUpdateSubscriber[];
  currentPage?: number;
  totalPages?: number;
  subscriberPage?: number;
  subscriberTotalPages?: number;
  searchQuery?: string;
  sortBy?: string;
  order?: string;
  activeTab?: string;
}

export default function LegalUpdatesManagement({
  initialUpdates,
  initialSubscribers,
  currentPage = 1,
  totalPages = 1,
  subscriberPage = 1,
  subscriberTotalPages = 1,
  searchQuery = "",
  sortBy = "createdAt",
  order = "desc",
  activeTab = "updates",
}: LegalUpdatesManagementProps) {
  const [updates, setUpdates] = useState<LegalUpdate[]>(initialUpdates);
  const [subscribers, setSubscribers] = useState<LegalUpdateSubscriber[]>(initialSubscribers);
  const [searchLoading, setSearchLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; title: string; type: "update" | "subscriber" } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState(searchQuery);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedSortBy, setSelectedSortBy] = useState(sortBy);
  const [selectedOrder, setSelectedOrder] = useState(order);
  const [tab, setTab] = useState(activeTab);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setUpdates(initialUpdates);
    setSubscribers(initialSubscribers);
    setPaginationLoading(false);
    setSearchLoading(false);
  }, [initialUpdates, initialSubscribers]);

  useEffect(() => {
    setSearchInputValue(searchQuery);
    setSelectedSortBy(sortBy);
    setSelectedOrder(order);
    setTab(activeTab);
  }, [searchQuery, sortBy, order, activeTab]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    return `/legal-updates?${params.toString()}`;
  };

  const handleSearch = (value: string) => {
    setSearchInputValue(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchLoading(true);
    const timeout = setTimeout(() => {
      router.push(buildUrl({ search: value || undefined, page: "1", tab }));
    }, 500);
    setSearchTimeout(timeout);
  };

  const UpdatesTableSkeleton = () => (
    <Table striped highlightOnHover verticalSpacing="md">
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ minWidth: 220 }}>Title</Table.Th>
          <Table.Th style={{ width: 140 }}>Type</Table.Th>
          <Table.Th style={{ width: 110 }}>Status</Table.Th>
          <Table.Th style={{ width: 130 }}>Published</Table.Th>
          <Table.Th style={{ width: 130 }}>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {Array.from({ length: 6 }).map((_, index) => (
          <Table.Tr key={index}>
            <Table.Td><Skeleton height={20} width={200} /></Table.Td>
            <Table.Td><Skeleton height={24} width={80} radius="xl" /></Table.Td>
            <Table.Td><Skeleton height={24} width={60} radius="xl" /></Table.Td>
            <Table.Td><Skeleton height={20} width={100} /></Table.Td>
            <Table.Td>
              <Group gap="xs">
                <Skeleton height={28} width={28} circle />
                <Skeleton height={28} width={28} circle />
                <Skeleton height={28} width={28} circle />
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      const result = itemToDelete.type === "update"
        ? await deleteLegalUpdate(itemToDelete.id)
        : await deleteLegalUpdateSubscriber(itemToDelete.id);

      if (result.success) {
        notifications.show({
          title: "Deleted",
          message: `${itemToDelete.type === "update" ? "Legal update" : "Subscriber"} removed successfully`,
          color: "green",
        });
        if (itemToDelete.type === "update") {
          setUpdates((prev) => prev.filter((u) => u.id !== itemToDelete.id));
        } else {
          setSubscribers((prev) => prev.filter((s) => s.id !== itemToDelete.id));
        }
        closeDeleteModal();
      } else {
        notifications.show({ title: "Error", message: result.error || "Delete failed", color: "red" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ padding: "4px" }}>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Legal Updates</Title>
        <Link href="/legal-updates/add">
          <Button leftSection={<IconPlus size={16} />}>Add Legal Update</Button>
        </Link>
      </Group>

      <Tabs value={tab} onChange={(value) => {
        const newTab = value || "updates";
        setTab(newTab);
        router.push(buildUrl({ tab: newTab, page: "1" }));
      }}>
        <Tabs.List>
          <Tabs.Tab value="updates">Updates</Tabs.Tab>
          <Tabs.Tab value="subscribers">Subscribers</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="updates" pt="md">
          <Paper withBorder p="md" mb="md">
            <Group>
              <TextInput
                placeholder="Search legal updates..."
                leftSection={searchLoading ? <Loader size="xs" /> : <IconSearch size={16} />}
                value={searchInputValue}
                onChange={(e) => handleSearch(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Select
                value={selectedSortBy}
                onChange={(value) => {
                  setSelectedSortBy(value || "createdAt");
                  router.push(buildUrl({ sortBy: value || "createdAt", tab: "updates" }));
                }}
                data={[
                  { value: "createdAt", label: "Created Date" },
                  { value: "published_date", label: "Published Date" },
                  { value: "title", label: "Title" },
                ]}
                style={{ minWidth: 160 }}
              />
              <Select
                value={selectedOrder}
                onChange={(value) => {
                  setSelectedOrder(value || "desc");
                  router.push(buildUrl({ order: value || "desc", tab: "updates" }));
                }}
                data={[
                  { value: "desc", label: "Descending" },
                  { value: "asc", label: "Ascending" },
                ]}
                style={{ minWidth: 140 }}
              />
            </Group>
          </Paper>

          {!searchLoading && !paginationLoading && updates.length === 0 ? (
            <EmptyState
              title="No legal updates found"
              description="Create your first legal update to get started."
              icon={<FileX2Icon size={48} />}
              action={
                <Link href="/legal-updates/add">
                  <Button leftSection={<IconPlus size={16} />}>Add Legal Update</Button>
                </Link>
              }
            />
          ) : (
            <Paper withBorder>
              {searchLoading || paginationLoading ? (
                <UpdatesTableSkeleton />
              ) : (
                <Table striped highlightOnHover verticalSpacing="md">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ minWidth: 220 }}>Title</Table.Th>
                      <Table.Th style={{ width: 140 }}>Type</Table.Th>
                      <Table.Th style={{ width: 110 }}>Status</Table.Th>
                      <Table.Th style={{ width: 130 }}>Published</Table.Th>
                      <Table.Th style={{ width: 130 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {updates.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <Text fw={500} truncate maw={280}>{item.title}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{CONTENT_TYPE_LABELS[item.content_type] || item.content_type}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={item.published ? "green" : "gray"}>
                            {item.published ? "Published" : "Draft"}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {item.published_date
                              ? new Date(item.published_date).toLocaleDateString()
                              : "—"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <ActionIcon variant="light" component={Link} href={`/legal-updates/${item.id}`}>
                              <IconEye size={16} />
                            </ActionIcon>
                            <ActionIcon variant="light" component={Link} href={`/legal-updates/add?edit=${item.id}`}>
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => {
                                setItemToDelete({ id: item.id, title: item.title, type: "update" });
                                openDeleteModal();
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          )}

          {totalPages > 1 && (
            <Group justify="end" mt="md">
                <Button
                  variant="light"
                  leftSection={paginationLoading ? <Loader size="xs" /> : <IconChevronLeft size={16} />}
                  disabled={currentPage <= 1 || paginationLoading}
                  onClick={() => {
                    setPaginationLoading(true);
                    router.push(buildUrl({ page: String(currentPage - 1), tab: "updates" }));
                  }}
                >
                  Previous
                </Button>
                <Text size="sm">Page {currentPage} of {totalPages}</Text>
                <Button
                  variant="light"
                  rightSection={paginationLoading ? <Loader size="xs" /> : <IconChevronRight size={16} />}
                  disabled={currentPage >= totalPages || paginationLoading}
                  onClick={() => {
                    setPaginationLoading(true);
                    router.push(buildUrl({ page: String(currentPage + 1), tab: "updates" }));
                  }}
                >
                  Next
                </Button>
              </Group>
            )}
        </Tabs.Panel>

        <Tabs.Panel value="subscribers" pt="md">
          {subscribers.length === 0 ? (
            <EmptyState
              title="No subscribers yet"
              description="Subscribers will appear here once users sign up on the public site."
              icon={<FileX2Icon size={48} />}
            />
          ) : (
            <Paper withBorder>
              <Table striped highlightOnHover verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ minWidth: 220 }}>Email</Table.Th>
                    <Table.Th style={{ width: 160 }}>Name</Table.Th>
                    <Table.Th style={{ width: 120 }}>Confirmed</Table.Th>
                    <Table.Th style={{ width: 110 }}>Active</Table.Th>
                    <Table.Th style={{ width: 130 }}>Subscribed</Table.Th>
                    <Table.Th style={{ width: 80 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {subscribers.map((sub) => (
                    <Table.Tr key={sub.id}>
                      <Table.Td>
                        <Text truncate maw={260}>{sub.email}</Text>
                      </Table.Td>
                      <Table.Td>{sub.name || "—"}</Table.Td>
                      <Table.Td>
                        <Badge color={sub.is_confirmed ? "green" : "yellow"}>
                          {sub.is_confirmed ? "Yes" : "Pending"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={sub.is_active ? "green" : "gray"}>
                          {sub.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{new Date(sub.createdAt).toLocaleDateString()}</Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => {
                            setItemToDelete({ id: sub.id, title: sub.email, type: "subscriber" });
                            openDeleteModal();
                          }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

          {subscriberTotalPages > 1 && (
            <Group justify="end" mt="md">
                <Button
                  variant="light"
                  disabled={subscriberPage <= 1}
                  onClick={() => router.push(buildUrl({ subscriberPage: String(subscriberPage - 1), tab: "subscribers" }))}
                >
                  Previous
                </Button>
                <Text size="sm">Page {subscriberPage} of {subscriberTotalPages}</Text>
                <Button
                  variant="light"
                  disabled={subscriberPage >= subscriberTotalPages}
                  onClick={() => router.push(buildUrl({ subscriberPage: String(subscriberPage + 1), tab: "subscribers" }))}
                >
                  Next
                </Button>
              </Group>
            )}
        </Tabs.Panel>
      </Tabs>

      <DeleteConfirmationModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={`Delete ${itemToDelete?.type === "subscriber" ? "Subscriber" : "Legal Update"}`}
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
