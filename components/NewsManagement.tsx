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

interface NewsItem {
  id: number
  title: string
  content: string
  visual_content?: any
  source?: string
  published_date?: Date
  created_by?: string
  createdAt: Date
}

const mockNews: NewsItem[] = [
  {
    id: 1,
    title: "Breaking News: Technology Update",
    content: "<p>This is the content of the news article...</p>",
    source: "Admin",
    published_date: new Date(),
    created_by: "John Doe",
    createdAt: new Date(),
  },
  {
    id: 2,
    title: "Important Announcement",
    content: "<p>Another news article content...</p>",
    source: "System",
    published_date: new Date(),
    created_by: "Jane Smith",
    createdAt: new Date(),
  },
]

export default function NewsManagement() {
  const [news, setNews] = useState<NewsItem[]>(mockNews)
  const [opened, { open, close }] = useDisclosure(false)
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
  const [content, setContent] = useState("")
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

  const handleSubmit = (values: typeof form.values) => {
    if (editingNews) {
      setNews((prev) =>
        prev.map((item) =>
          item.id === editingNews.id ? { ...item, ...values, content, updatedAt: new Date() } : item,
        ),
      )
      notifications.show({
        title: "Success",
        message: "News updated successfully",
        color: "green",
      })
    } else {
      const newNews: NewsItem = {
        id: Date.now(),
        ...values,
        content,
        createdAt: new Date(),
      }
      setNews((prev) => [...prev, newNews])
      notifications.show({
        title: "Success",
        message: "News created successfully",
        color: "green",
      })
    }
    handleClose()
  }

  const handleEdit = (newsItem: NewsItem) => {
    setEditingNews(newsItem)
    form.setValues({
      title: newsItem.title,
      content: newsItem.content,
      source: newsItem.source || "",
      published_date: newsItem.published_date || new Date(),
      created_by: newsItem.created_by || "",
      visual_content: null,
    })
    setContent(newsItem.content)
    open()
  }

  const handleDelete = (id: number) => {
    setNews((prev) => prev.filter((item) => item.id !== id))
    notifications.show({
      title: "Success",
      message: "News deleted successfully",
      color: "red",
    })
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
										{item.published_date?.toLocaleDateString() || "N/A"}
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
								<Button type="submit">{editingNews ? "Update" : "Create"}</Button>
							</Group>
						</Stack>
					</form>
				</Modal>
			</div>
		);
}
