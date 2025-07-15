"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Stack,
  Loader,
  Skeleton,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconEdit, IconTrash, IconPlus, IconEye, IconSearch, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { deleteNews } from "@/app/actions/news.actions"
import { News } from "@/types"
import DeleteConfirmationModal from "./DeleteConfirmationModal"
import EmptyState from "./EmptyState"
import { FileX2Icon } from "lucide-react"

interface NewsManagementProps {
  initialNews: News[]
  currentPage?: number
  totalPages?: number
  searchQuery?: string
  sortBy?: string
  order?: string
}

export default function NewsManagement({ 
  initialNews, 
  currentPage = 1, 
  totalPages = 1, 
  searchQuery = "",
  sortBy = "createdAt",
  order = "desc"
}: NewsManagementProps) {
  const [news, setNews] = useState<News[]>(initialNews)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [paginationLoading, setPaginationLoading] = useState(false)
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: number; title: string } | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Update state when props change (for pagination)
  useEffect(() => {
    setNews(initialNews)
    setPaginationLoading(false)
    setSearchLoading(false)
  }, [initialNews])

  useEffect(() => {
			setSearchInputValue(searchQuery);
			setSelectedSortBy(sortBy || "createdAt");
			setSelectedOrder(order || "desc");
			setSearchLoading(false);
		}, [searchQuery, sortBy, order]);

  // Search and filter state
  const [searchInputValue, setSearchInputValue] = useState(searchQuery)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [selectedSortBy, setSelectedSortBy] = useState(sortBy)
  const [selectedOrder, setSelectedOrder] = useState(order)

  // Skeleton component for loading states
  const NewsTableSkeleton = () => (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Title</Table.Th>
          <Table.Th>Category</Table.Th>
          <Table.Th>Source</Table.Th>
          <Table.Th>Created By</Table.Th>
          <Table.Th>Published Date</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {Array.from({ length: 6 }).map((_, index) => (
          <Table.Tr key={index}>
            <Table.Td>
              <Skeleton height={20} width={200} />
            </Table.Td>
            <Table.Td>
              <Skeleton height={24} width={100} radius="xl" />
            </Table.Td>
            <Table.Td>
              <Skeleton height={24} width={100} radius="xl" />
            </Table.Td>
            <Table.Td>
              <Skeleton height={20} width={120} />
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
  )

  // Pagination functions
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPaginationLoading(true)
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", newPage.toString())
      router.push(`/news?${params.toString()}`)
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      const timeout = setTimeout(() => {
        setSearchLoading(true)
        const params = new URLSearchParams(searchParams.toString())
        if (query.trim()) {
          params.set("search", query.trim())
        } else {
          params.delete("search")
        }
        params.delete("page") // Reset to first page when searching
        router.push(`/news?${params.toString()}`)
      }, 500) // 500ms delay

      setSearchTimeout(timeout)
    },
    [searchParams, router, searchTimeout]
  )

  const handleSearchInput = (query: string) => {
    setSearchInputValue(query)
    debouncedSearch(query)
  }

  const handleSearchClear = () => {
    setSearchInputValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("page")
    router.push(`/news?${params.toString()}`)
  }

  const handleSortChange = (newSortBy: string | null) => {
    if (newSortBy) {
      setSelectedSortBy(newSortBy)
      const params = new URLSearchParams(searchParams.toString())
      params.set("sortBy", newSortBy)
      params.delete("page")
      router.push(`/news?${params.toString()}`)
    }
  }

  const handleOrderChange = (newOrder: string | null) => {
    if (newOrder) {
      setSelectedOrder(newOrder)
      const params = new URLSearchParams(searchParams.toString())
      params.set("order", newOrder)
      params.delete("page")
      router.push(`/news?${params.toString()}`)
    }
  }

  const handleDelete = async (id: number) => {
    const newsItem = news.find(item => item.id === id)
    if (newsItem) {
      setItemToDelete({ id, title: newsItem.title })
      openDeleteModal()
    }
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    setLoading(true)
    try {
      const result = await deleteNews(itemToDelete.id)
      if (result.success) {
        setNews((prev) => prev.filter((item) => item.id !== itemToDelete.id))
        notifications.show({
          title: "Success",
          message: "News deleted successfully",
          color: "green",
        })
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to delete news",
          color: "red",
        })
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An unexpected error occurred",
        color: "red",
      })
    } finally {
      setLoading(false)
      closeDeleteModal()
      setItemToDelete(null)
    }
  }

  const handleCreate = () => {
    router.push("/news/add")
  }

  const handleEdit = (newsItem: News) => {
    router.push(`/news/add?edit=${newsItem.id}`)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString()
  }

  return (
    <div style={{ padding: "24px" }}>
      <Group justify="space-between" mb="lg">
        <Title order={2}>News Management</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
          Add News
        </Button>
      </Group>

      {/* Search and Filter Bar */}
      <Paper withBorder p="md" mb="md">
        <Stack gap="md">
          <Group>
            <TextInput
              placeholder="Search news..."
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
              placeholder="Sort by"
              value={selectedSortBy}
              onChange={handleSortChange}
              data={[
                { value: "createdAt", label: "Created Date" },
                { value: "updatedAt", label: "Last Modified" },
                { value: "published_date", label: "Published Date" },
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

          {(searchInputValue || selectedSortBy !== "createdAt" || selectedOrder !== "desc") && (
            <Text size="sm" c="dimmed">
              Found {news.length} news article{news.length !== 1 ? "s" : ""}
              {searchInputValue && ` matching "${searchInputValue}"`}
            </Text>
          )}
        </Stack>
      </Paper>

      {news.length === 0 && (
        <EmptyState
          title="No news found"
          description="There are no news articles that match your search."
          icon={<FileX2Icon size={48} />}
        />
      )}

      {news.length > 0 && (
        <Paper withBorder>
          {searchLoading || paginationLoading ? (
            <NewsTableSkeleton />
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Source</Table.Th>
                  <Table.Th>Created By</Table.Th>
                  <Table.Th>Published Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {news.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Text fw={500}>{item.title}</Text>
                    </Table.Td>
                    <Table.Td>
                      {item.category ? (
                        <Badge variant="light" color="purple">
                          {item.category.name}
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">No category</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{item.source || "N/A"}</Badge>
                    </Table.Td>
                    <Table.Td>{item.created_by || "N/A"}</Table.Td>
                    <Table.Td>
                      {item.published_date ? formatDate(item.published_date) : "N/A"}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => router.push(`/news/${item.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="orange"
                          onClick={() => handleEdit(item)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(item.id!)}
                          disabled={loading}
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
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 1 + i)
              if (pageNum <= totalPages) {
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "filled" : "light"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              }
              return null
            })}

            {/* Show ellipsis if needed */}
            {currentPage < totalPages - 3 && (
              <Text size="sm" c="dimmed">
                ...
              </Text>
            )}

            {/* Show last page */}
            {currentPage < totalPages - 2 && (
              <Button variant="light" size="sm" onClick={() => handlePageChange(totalPages)}>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete News"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
        loading={loading}
      />
    </div>
  )
}
