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
  Textarea,
  Select,
  Paper,
  Badge,
  Text,
  Stack,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { Dropzone, PDF_MIME_TYPE } from "@mantine/dropzone"
import { IconEdit, IconTrash, IconPlus, IconDownload, IconFileText } from "@tabler/icons-react"

interface Document {
  id: number
  filename: string
  title: string
  category_id: number
  category_name?: string
  author?: string
  content_text?: string
  file_url: string
  createdAt: Date
}

const mockCategories = [
  { value: "1", label: "Legal Documents" },
  { value: "2", label: "Financial Reports" },
  { value: "3", label: "Technical Manuals" },
  { value: "4", label: "Policy Documents" },
]

const mockDocuments: Document[] = [
  {
    id: 1,
    filename: "annual-report-2023.pdf",
    title: "Annual Report 2023",
    category_id: 2,
    category_name: "Financial Reports",
    author: "Finance Team",
    content_text: "Annual financial report for 2023",
    file_url: "/documents/annual-report-2023.pdf",
    createdAt: new Date(),
  },
  {
    id: 2,
    filename: "privacy-policy.pdf",
    title: "Privacy Policy",
    category_id: 4,
    category_name: "Policy Documents",
    author: "Legal Team",
    content_text: "Company privacy policy document",
    file_url: "/documents/privacy-policy.pdf",
    createdAt: new Date(),
  },
]

export default function ArchivesManagement() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [opened, { open, close }] = useDisclosure(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const form = useForm({
    initialValues: {
      title: "",
      category_id: "",
      author: "",
      content_text: "",
    },
  })

  const handleSubmit = (values: typeof form.values) => {
    if (!uploadedFile && !editingDocument) {
      notifications.show({
        title: "Error",
        message: "Please upload a PDF file",
        color: "red",
      })
      return
    }

    if (editingDocument) {
      setDocuments((prev) =>
        prev.map((item) =>
          item.id === editingDocument.id
            ? {
                ...item,
                ...values,
                category_id: Number.parseInt(values.category_id),
                category_name: mockCategories.find((c) => c.value === values.category_id)?.label,
                updatedAt: new Date(),
              }
            : item,
        ),
      )
      notifications.show({
        title: "Success",
        message: "Document updated successfully",
        color: "green",
      })
    } else {
      const newDocument: Document = {
        id: Date.now(),
        filename: uploadedFile!.name,
        title: values.title,
        category_id: Number.parseInt(values.category_id),
        category_name: mockCategories.find((c) => c.value === values.category_id)?.label,
        author: values.author,
        content_text: values.content_text,
        file_url: URL.createObjectURL(uploadedFile!),
        createdAt: new Date(),
      }
      setDocuments((prev) => [...prev, newDocument])
      notifications.show({
        title: "Success",
        message: "Document uploaded successfully",
        color: "green",
      })
    }
    handleClose()
  }

  const handleEdit = (document: Document) => {
    setEditingDocument(document)
    form.setValues({
      title: document.title,
      category_id: document.category_id.toString(),
      author: document.author || "",
      content_text: document.content_text || "",
    })
    open()
  }

  const handleDelete = (id: number) => {
    setDocuments((prev) => prev.filter((item) => item.id !== id))
    notifications.show({
      title: "Success",
      message: "Document deleted successfully",
      color: "red",
    })
  }

  const handleClose = () => {
    close()
    setEditingDocument(null)
    setUploadedFile(null)
    form.reset()
  }

  const handleCreate = () => {
    setEditingDocument(null)
    setUploadedFile(null)
    form.reset()
    open()
  }

  return (
			<div style={{ padding: "24px" }}>
				<Group justify="space-between" mb="lg">
					<Title order={2}>Archives Management</Title>
					<Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
						Upload Document
					</Button>
				</Group>

				<Paper withBorder>
					<Table striped highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Title</Table.Th>
								<Table.Th>Category</Table.Th>
								<Table.Th>Author</Table.Th>
								<Table.Th>Filename</Table.Th>
								<Table.Th>Upload Date</Table.Th>
								<Table.Th>Actions</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{documents.map((item) => (
								<Table.Tr key={item.id}>
									<Table.Td>
										<Group>
											<IconFileText size={20} color="red" />
											<Text fw={500}>{item.title}</Text>
										</Group>
									</Table.Td>
									<Table.Td>
										<Badge variant="light">{item.category_name}</Badge>
									</Table.Td>
									<Table.Td>{item.author || "N/A"}</Table.Td>
									<Table.Td>
										<Text size="sm" c="dimmed">
											{item.filename}
										</Text>
									</Table.Td>
									<Table.Td>{item.createdAt.toLocaleDateString()}</Table.Td>
									<Table.Td>
										<Group gap="xs">
											<ActionIcon
												variant="light"
												color="blue"
												component="a"
												href={item.file_url}
												download
											>
												<IconDownload size={16} />
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

				{/* Upload/Edit Modal */}
				<Modal
					opened={opened}
					onClose={handleClose}
					title={editingDocument ? "Edit Document" : "Upload Document"}
					size="lg"
				>
					<form onSubmit={form.onSubmit(handleSubmit)}>
						<Stack>
							{!editingDocument && (
								<div>
									<Text size="sm" fw={500} mb="xs">
										Upload PDF File
									</Text>
									<Dropzone
										onDrop={(files) => setUploadedFile(files[0])}
										accept={PDF_MIME_TYPE}
										maxFiles={1}
									>
										<Group
											justify="center"
											gap="xl"
											mih={220}
											style={{ pointerEvents: "none" }}
										>
											<div>
												<Text size="xl" inline>
													Drag PDF file here or click to select
												</Text>
												<Text size="sm" c="dimmed" inline mt={7}>
													Only PDF files are accepted
												</Text>
											</div>
										</Group>
									</Dropzone>
									{uploadedFile && (
										<Text size="sm" mt="xs">
											Selected: {uploadedFile.name}
										</Text>
									)}
								</div>
							)}

							<TextInput
								label="Title"
								placeholder="Enter document title"
								required
								{...form.getInputProps("title")}
							/>

							<Select
								label="Category"
								placeholder="Select category"
								data={mockCategories}
								required
								{...form.getInputProps("category_id")}
							/>

							<TextInput
								label="Author"
								placeholder="Document author"
								{...form.getInputProps("author")}
							/>

							<Textarea
								label="Description"
								placeholder="Brief description of the document"
								rows={3}
								{...form.getInputProps("content_text")}
							/>

							<Group justify="flex-end">
								<Button variant="light" onClick={handleClose}>
									Cancel
								</Button>
								<Button type="submit">{editingDocument ? "Update" : "Upload"}</Button>
							</Group>
						</Stack>
					</form>
				</Modal>
			</div>
		);
}
