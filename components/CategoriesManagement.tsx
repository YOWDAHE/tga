"use client"

import { useState, useEffect } from "react"
import { Title, Button, Table, Group, ActionIcon, Modal, TextInput, Textarea, Paper, Text, Stack, Loader, Pagination, TextInput as MantineTextInput, Alert, Skeleton } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconEdit, IconTrash, IconPlus, IconSearch, IconAlertCircle, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/category.actions"
import DeleteConfirmationModal from "./DeleteConfirmationModal"
import { useRouter, useSearchParams } from "next/navigation"

interface Category {
  id: number
  name: string
  description?: string
  createdAt: string | Date
  updatedAt: string | Date
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
}

type Props = {
  categories: Category[]
  pagination: PaginationInfo | null
  currentPage: number
  searchQuery: string
  error?: string | null
}

// Skeleton component for loading state
const CategoriesTableSkeleton = () => (
  <Table>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Name</Table.Th>
        <Table.Th>Description</Table.Th>
        <Table.Th>Created Date</Table.Th>
        <Table.Th>Last Updated</Table.Th>
        <Table.Th>Actions</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {Array.from({ length: 10 }).map((_, index) => (
        <Table.Tr key={index}>
          <Table.Td>
            <Skeleton height={20} width={120} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} width={200} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} width={100} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} width={100} />
          </Table.Td>
          <Table.Td>
            <Group gap="xs">
              <Skeleton height={32} width={32} radius="sm" />
              <Skeleton height={32} width={32} radius="sm" />
            </Group>
          </Table.Td>
        </Table.Tr>
      ))}
    </Table.Tbody>
  </Table>
);

export default function CategoriesManagement({ categories: initialCategories, pagination: initialPagination, currentPage, searchQuery: initialSearchQuery, error }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>(
    initialCategories.map((cat) => ({
      ...cat,
      createdAt: typeof cat.createdAt === "string" ? new Date(cat.createdAt) : cat.createdAt,
      updatedAt: typeof cat.updatedAt === "string" ? new Date(cat.updatedAt) : cat.updatedAt,
    }))
  )
  const [pagination, setPagination] = useState<PaginationInfo | null>(initialPagination)
  const [searchInputValue, setSearchInputValue] = useState(initialSearchQuery)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [opened, { open, close }] = useDisclosure(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null)

  // Update local state when props change
  useEffect(() => {
    setCategories(
      initialCategories.map((cat) => ({
        ...cat,
        createdAt: typeof cat.createdAt === "string" ? new Date(cat.createdAt) : cat.createdAt,
        updatedAt: typeof cat.updatedAt === "string" ? new Date(cat.updatedAt) : cat.updatedAt,
      }))
    );
    setPagination(initialPagination);
    setIsLoading(false); // Stop loading when new data arrives
  }, [initialCategories, initialPagination]);

  // Update search input value when URL changes
  useEffect(() => {
    setSearchInputValue(initialSearchQuery);
  }, [initialSearchQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true)
    try {
      if (editingCategory) {
        // Update
        const result = await updateCategory({ id: editingCategory.id, ...values })
        if (result.success) {
          setCategories((prev) =>
            prev.map((item) =>
              item.id === editingCategory.id
                ? { ...item, ...result.data, updatedAt: new Date(result.data.updatedAt) }
                : item
            )
          )
          notifications.show({ title: "Success", message: "Category updated successfully", color: "green" })
        } else {
          notifications.show({ title: "Error", message: result.error, color: "red" })
        }
      } else {
        // Create
        const result = await createCategory(values)
        if (result.success) {
          setCategories((prev) => [
            ...prev,
            { ...result.data, createdAt: new Date(result.data.createdAt), updatedAt: new Date(result.data.updatedAt) },
          ])
          notifications.show({ title: "Success", message: "Category created successfully", color: "green" })
        } else {
          notifications.show({ title: "Error", message: result.error, color: "red" })
        }
      }
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    form.setValues({
      name: category.name,
      description: category.description || "",
    })
    open()
  }

  const handleDelete = async (id: number) => {
    const category = categories.find(cat => cat.id === id)
    if (category) {
      setCategoryToDelete({ id, name: category.name })
      openDeleteModal()
    }
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    const result = await deleteCategory(categoryToDelete.id)
    if (result.success) {
      setCategories((prev) => prev.filter((item) => item.id !== categoryToDelete.id))
      notifications.show({ title: "Success", message: "Category deleted successfully", color: "red" })
    } else {
      notifications.show({ title: "Error", message: result.error, color: "red" })
    }
    closeDeleteModal()
    setCategoryToDelete(null)
  }

  const handleClose = () => {
    close()
    setEditingCategory(null)
    form.reset()
  }

  const handleCreate = () => {
    setEditingCategory(null)
    form.reset()
    open()
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      setIsLoading(true); // Start loading when page changes
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', page.toString())
      router.push(`/categories?${params.toString()}`)
    }
  }

  // Debounced search function
  const debouncedSearch = (query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      setIsLoading(true); // Start loading when search triggers
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) {
        params.set('search', query.trim())
      } else {
        params.delete('search')
      }
      params.delete('page') // Reset to first page when searching
      router.push(`/categories?${params.toString()}`)
    }, 500) // 500ms delay

    setSearchTimeout(timeout)
  }

  const handleSearchInput = (query: string) => {
    setSearchInputValue(query)
    debouncedSearch(query)
  }

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      setIsLoading(true); // Start loading when search triggers
      const params = new URLSearchParams(searchParams.toString())
      if (searchInputValue.trim()) {
        params.set('search', searchInputValue.trim())
      } else {
        params.delete('search')
      }
      params.delete('page') // Reset to first page when searching
      router.push(`/categories?${params.toString()}`)
    }
  }

  const formatDate = (date: string | Date) => {
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString()
    }
    return date.toLocaleDateString()
  }

  // Show loading skeleton
  if (isLoading) {
    return (
      <div style={{ padding: "24px" }}>
        <Group justify="space-between" mb="lg">
          <Title order={2}>Categories Management</Title>
          <Button leftSection={<IconPlus size={16} />} disabled>
            Add Category
          </Button>
        </Group>

        {/* Search Bar Skeleton */}
        <Paper withBorder p="md" mb="lg">
          <Group>
            <Skeleton height={36} width="100%" />
          </Group>
        </Paper>

        <Paper withBorder>
          <CategoriesTableSkeleton />
        </Paper>

        {/* Pagination Skeleton */}
        <Group justify="center" mt="lg">
          <Skeleton height={36} width={200} />
          <Skeleton height={20} width={150} />
        </Group>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: "24px" }}>
        <Group justify="space-between" mb="lg">
          <Title order={2}>Categories Management</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
            Add Category
          </Button>
        </Group>

        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="lg">
          {error}
        </Alert>

        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Created Date</Table.Th>
                <Table.Th>Last Updated</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" c="dimmed" py="xl">
                    No categories available
                  </Text>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>
      </div>
    )
  }

  // Show empty state
  if (!categories || categories.length === 0) {
    return (
      <div style={{ padding: "24px" }}>
        <Group justify="space-between" mb="lg">
          <Title order={2}>Categories Management</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
            Add Category
          </Button>
        </Group>

        {/* Search Bar */}
        <Paper withBorder p="md" mb="lg">
          <Group>
            <MantineTextInput
              placeholder="Search categories..."
              value={searchInputValue}
              onChange={(event) => handleSearchInput(event.currentTarget.value)}
              onKeyPress={handleSearchKeyPress}
              leftSection={<IconSearch size={16} />}
              style={{ flex: 1 }}
            />
          </Group>
        </Paper>

        <div className="flex flex-col items-center justify-center h-full m-20">
          <Title order={2}>No Categories Available</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate} mt="md">
            Add Category
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px" }}>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Categories Management</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
          Add Category
        </Button>
      </Group>

      {/* Search Bar */}
      <Paper withBorder p="md" mb="lg">
        <Group>
          <MantineTextInput
            placeholder="Search categories..."
            value={searchInputValue}
            onChange={(event) => handleSearchInput(event.currentTarget.value)}
            onKeyPress={handleSearchKeyPress}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1 }}
          />
        </Group>
      </Paper>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Created Date</Table.Th>
              <Table.Th>Last Updated</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {categories.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Text fw={500}>{item.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {item.description || "No description"}
                  </Text>
                </Table.Td>
                <Table.Td>{formatDate(item.createdAt)}</Table.Td>
                <Table.Td>{formatDate(item.updatedAt)}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
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
                      onClick={() => handleDelete(item.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Group justify="end" mt="lg">
          <Button
            variant="light"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1 || isLoading}
            leftSection={isLoading ? <Loader size="xs" /> : <IconChevronLeft size={16} />}
          >
            Previous
          </Button>

          <Group gap="xs">
            {/* Show first page */}
            {pagination.currentPage > 3 && (
              <Button
                variant="light"
                size="sm"
                onClick={() => handlePageChange(1)}
              >
                1
              </Button>
            )}

            {/* Show ellipsis if needed */}
            {pagination.currentPage > 4 && (
              <Text size="sm" c="dimmed">
                ...
              </Text>
            )}

            {/* Show pages around current page */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page >= Math.max(1, pagination.currentPage - 1) &&
                  page <= Math.min(pagination.totalPages, pagination.currentPage + 1)
              )
              .map((page) => (
                <Button
                  key={page}
                  variant={page === pagination.currentPage ? "filled" : "light"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}

            {/* Show ellipsis if needed */}
            {pagination.currentPage < pagination.totalPages - 3 && (
              <Text size="sm" c="dimmed">
                ...
              </Text>
            )}

            {/* Show last page */}
            {pagination.currentPage < pagination.totalPages - 2 && (
              <Button
                variant="light"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
              >
                {pagination.totalPages}
              </Button>
            )}
          </Group>

          <Button
            variant="light"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages || isLoading}
            rightSection={isLoading ? <Loader size="xs" /> : <IconChevronRight size={16} />}
          >
            Next
          </Button>
        </Group>
      )}

      {/* Page Info */}
      {pagination && (
        <Text size="sm" c="dimmed" ta="center" mt="md">
          Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} categories
        </Text>
      )}

      {/* Create/Edit Modal */}
      <Modal
        opened={opened}
        onClose={handleClose}
        title={editingCategory ? "Edit Category" : "Create Category"}
        size="md"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Category Name"
              placeholder="Enter category name"
              required
              {...form.getInputProps("name")}
            />

            <Textarea
              label="Description"
              placeholder="Enter category description"
              rows={4}
              {...form.getInputProps("description")}
            />

            <Group justify="flex-end">
              <Button variant="light" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} leftSection={isSubmitting ? <Loader size="xs" /> : null}>
                {isSubmitting ? "Updating..." : editingCategory ? "Update" : "Create"}
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
        title="Delete Category"
        itemName={categoryToDelete?.name}
        itemType="category"
        loading={isSubmitting}
      />
    </div>
  )
}
