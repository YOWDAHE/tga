"use client"

import { useState } from "react"
import { Title, Button, Table, Group, ActionIcon, Modal, TextInput, Textarea, Paper, Text, Stack, Loader } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react"
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/category.actions"

interface Category {
  id: number
  name: string
  description?: string
  createdAt: string | Date
  updatedAt: string | Date
}

type Props = {
  categories: Category[]
}

export default function CategoriesManagement({ categories: initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(
    initialCategories.map((cat) => ({
      ...cat,
      createdAt: typeof cat.createdAt === "string" ? new Date(cat.createdAt) : cat.createdAt,
      updatedAt: typeof cat.updatedAt === "string" ? new Date(cat.updatedAt) : cat.updatedAt,
    }))
  )
  const [opened, { open, close }] = useDisclosure(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true)
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
      setIsLoading(false)
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
    const result = await deleteCategory(id)
    if (result.success) {
      setCategories((prev) => prev.filter((item) => item.id !== id))
      notifications.show({ title: "Success", message: "Category deleted successfully", color: "red" })
    } else {
      notifications.show({ title: "Error", message: result.error, color: "red" })
    }
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

  const formatDate = (date: string | Date) => {
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString()
    }
    return date.toLocaleDateString()
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full m-20">
        <Title order={2}>No Categories Available</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreate} mt="md">
          Add Category
        </Button>
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
              <Button variant="light" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} leftSection={isLoading ? <Loader size="xs" /> : null}>
                {isLoading ? "Updating..." : editingCategory ? "Update" : "Create"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  )
}
