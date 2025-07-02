"use client"

import { useState } from "react"
import {
  Title,
  Button,
  Table,
  Group,
  ActionIcon,
  Modal,
  TextInput,
  Paper,
  Badge,
  Text,
  Stack,
  FileInput,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { DateTimePicker } from "@mantine/dates"
import { IconEdit, IconTrash, IconPlus, IconEye, IconUpload } from "@tabler/icons-react"
import SimpleRichTextEditor from "./SimpleRichTextEditor"
import { useRouter } from "next/navigation"
import { createNews, updateNews, deleteNews } from "@/app/actions/news.actions"
import { News } from "@/types"

interface NewsManagementProps {
  initialNews: News[]
  currentPage?: number
  totalPages?: number
  searchQuery?: string
}

export default function NewsManagement({ initialNews, currentPage = 1, totalPages = 1, searchQuery = "" }: NewsManagementProps) {
  const [news, setNews] = useState<News[]>(initialNews)
  const [opened, { open, close }] = useDisclosure(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm({
    initialValues: {
      title: "",
      content: "",
      source: "",
      published_date: new Date(),
      created_by: "",
      visual_content: null as File | null,
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    try {
      let result
      if (editingNews) {
        result = await updateNews({
          id: editingNews.id!,
          ...values,
          content,
        })
      } else {
        result = await createNews({
          ...values,
          content,
        })
      }
      if (result.success) {
        notifications.show({
          title: "Success",
          message: editingNews ? "News updated successfully" : "News created successfully",
          color: "green",
        })
        // Refetch or update local state
        if (editingNews) {
          setNews((prev) => prev.map((item) => item.id === editingNews.id ? result.data : item))
        } else {
          setNews((prev) => [result.data, ...prev])
        }
        handleClose()
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to save news",
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
    }
  }

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem)
    form.setValues({
      title: newsItem.title,
      content: newsItem.content,
      source: newsItem.source || "",
      published_date: newsItem.published_date ? new Date(newsItem.published_date) : new Date(),
      created_by: newsItem.created_by || "",
      visual_content: null,
    })
    setContent(newsItem.content)
    open()
  }

  const handleDelete = async (id: number) => {
    setLoading(true)
    try {
      const result = await deleteNews(id)
      if (result.success) {
        setNews((prev) => prev.filter((item) => item.id !== id))
        notifications.show({
          title: "Success",
          message: "News deleted successfully",
          color: "red",
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
    }
  }

  const handleClose = () => {
    close()
    setEditingNews(null)
    form.reset()
    setContent("")
  }

  const handleCreate = () => {
    setEditingNews(null)
    form.reset()
    setContent("")
    open()
  }

  return (
    <div style={{ padding: "24px" }}>
      <Group justify="space-between" mb="lg">
        <Title order={2}>News Management</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
          Add News
        </Button>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
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
                  <Badge variant="light">{item.source || "N/A"}</Badge>
                </Table.Td>
                <Table.Td>{item.created_by || "N/A"}</Table.Td>
                <Table.Td>
                  {item.published_date ? new Date(item.published_date).toLocaleDateString() : "N/A"}
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
      </Paper>

      {/* Create/Edit Modal */}
      <Modal
        opened={opened}
        onClose={handleClose}
        title={editingNews ? "Edit News" : "Create News"}
        size="xl"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="Enter news title"
              required
              {...form.getInputProps("title")}
            />

            <Group grow>
              <TextInput
                label="Source"
                placeholder="News source"
                {...form.getInputProps("source")}
              />
              <TextInput
                label="Created By"
                placeholder="Author name"
                {...form.getInputProps("created_by")}
              />
            </Group>

            <DateTimePicker
              label="Published Date"
              placeholder="Select date and time"
              {...form.getInputProps("published_date")}
            />

            <FileInput
              label="Visual Content"
              placeholder="Upload image or video"
              accept="image/*,video/*"
              leftSection={<IconUpload size={16} />}
              {...form.getInputProps("visual_content")}
            />

            <SimpleRichTextEditor
              label="Content"
              value={content}
              onChange={setContent}
              placeholder="Enter news content..."
              rows={10}
            />

            <Group justify="flex-end">
              <Button variant="light" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>{editingNews ? "Update" : "Create"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  )
}
