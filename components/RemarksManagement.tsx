"use client"

import { useState } from "react"
import { Title, Table, Group, ActionIcon, Paper, Badge, Text, Stack, Modal, Button, Textarea } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconEye, IconMessage, IconCheck } from "@tabler/icons-react"

interface Remark {
  id: number
  name: string
  email: string
  content: string
  response: string
  createdAt: Date
  updatedAt: Date
}

const mockRemarks: Remark[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@email.com",
    content: "I have a question about your services. Can you provide more information about pricing?",
    response: "",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@email.com",
    content: "I'm experiencing issues with the document download feature. It keeps failing.",
    response:
      "Thank you for reporting this issue. Our technical team is looking into it and will have a fix deployed soon.",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@email.com",
    content: "Great website! I love the new design and functionality. Keep up the good work!",
    response: "",
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.wilson@email.com",
    content: "I would like to suggest adding a dark mode feature to the website. It would be very helpful.",
    response:
      "Thank you for the suggestion! We're actually working on a dark mode feature and it should be available in the next update.",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
]

export default function RemarksManagement() {
  const [remarks, setRemarks] = useState<Remark[]>(mockRemarks)
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false)
  const [replyOpened, { open: openReply, close: closeReply }] = useDisclosure(false)
  const [viewingRemark, setViewingRemark] = useState<Remark | null>(null)
  const [replyingRemark, setReplyingRemark] = useState<Remark | null>(null)

  const replyForm = useForm({
    initialValues: {
      response: "",
    },
  })

  const handleViewRemark = (remark: Remark) => {
    setViewingRemark(remark)
    openView()
  }

  const handleReplyRemark = (remark: Remark) => {
    setReplyingRemark(remark)
    replyForm.setValues({
      response: remark.response || "",
    })
    openReply()
  }

  const handleSubmitReply = (values: typeof replyForm.values) => {
    if (!replyingRemark) return

    setRemarks((prev) =>
      prev.map((remark) =>
        remark.id === replyingRemark.id
          ? {
              ...remark,
              response: values.response,
              updatedAt: new Date(),
            }
          : remark,
      ),
    )

    notifications.show({
      title: "Success",
      message: "Reply sent successfully",
      color: "green",
    })

    closeReply()
    setReplyingRemark(null)
    replyForm.reset()
  }

  const getStatusBadge = (remark: Remark) => {
    if (remark.response.trim()) {
      return (
        <Badge color="green" variant="light">
          Replied
        </Badge>
      )
    }
    return (
      <Badge color="orange" variant="light">
        Pending
      </Badge>
    )
  }

  const handleCloseReply = () => {
    closeReply()
    setReplyingRemark(null)
    replyForm.reset()
  }

  return (
    <div style={{ padding: "24px" }}>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Remarks Management</Title>
          <Text c="gray.6" size="sm" mt="xs">
            View and respond to user remarks and feedback
          </Text>
        </div>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Message Preview</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {remarks.map((remark) => (
              <Table.Tr key={remark.id}>
                <Table.Td>
                  <Text fw={500} size="sm">
                    {remark.name}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {remark.email}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" lineClamp={2} maw={300}>
                    {remark.content}
                  </Text>
                </Table.Td>
                <Table.Td>{getStatusBadge(remark)}</Table.Td>
                <Table.Td>
                  <Text size="sm">{remark.createdAt.toLocaleDateString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon variant="light" color="blue" onClick={() => handleViewRemark(remark)}>
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="green" onClick={() => handleReplyRemark(remark)}>
                      <IconMessage size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* View Remark Modal */}
      <Modal opened={viewOpened} onClose={closeView} title="View Remark" size="lg">
        {viewingRemark && (
          <Stack>
            <Group>
              <div>
                <Text fw={500} mb="xs">
                  From
                </Text>
                <Text size="sm">{viewingRemark.name}</Text>
                <Text size="xs" c="dimmed">
                  {viewingRemark.email}
                </Text>
              </div>
              <div style={{ marginLeft: "auto" }}>{getStatusBadge(viewingRemark)}</div>
            </Group>

            <div>
              <Text fw={500} mb="xs">
                Message
              </Text>
              <Paper withBorder p="md" bg="gray.0">
                <Text size="sm">{viewingRemark.content}</Text>
              </Paper>
            </div>

            {viewingRemark.response && (
              <div>
                <Text fw={500} mb="xs">
                  Your Response
                </Text>
                <Paper withBorder p="md" bg="blue.0">
                  <Text size="sm">{viewingRemark.response}</Text>
                </Paper>
              </div>
            )}

            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Received on {viewingRemark.createdAt.toLocaleDateString()}
                {viewingRemark.response && ` • Replied on ${viewingRemark.updatedAt.toLocaleDateString()}`}
              </Text>
              <Button
                size="sm"
                leftSection={<IconMessage size={16} />}
                onClick={() => {
                  closeView()
                  handleReplyRemark(viewingRemark)
                }}
              >
                {viewingRemark.response ? "Update Reply" : "Reply"}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal opened={replyOpened} onClose={handleCloseReply} title="Reply to Remark" size="lg">
        {replyingRemark && (
          <form onSubmit={replyForm.onSubmit(handleSubmitReply)}>
            <Stack>
              <div>
                <Text fw={500} mb="xs">
                  Original Message
                </Text>
                <Paper withBorder p="md" bg="gray.0">
                  <Group justify="space-between" mb="xs">
                    <div>
                      <Text fw={500} size="sm">
                        {replyingRemark.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {replyingRemark.email}
                      </Text>
                    </div>
                    <Text size="xs" c="dimmed">
                      {replyingRemark.createdAt.toLocaleDateString()}
                    </Text>
                  </Group>
                  <Text size="sm">{replyingRemark.content}</Text>
                </Paper>
              </div>

              <div>
                <Text fw={500} mb="xs">
                  Your Response
                </Text>
                <Textarea
                  placeholder="Type your response here..."
                  rows={6}
                  required
                  {...replyForm.getInputProps("response")}
                />
              </div>

              <Group justify="flex-end">
                <Button variant="light" onClick={handleCloseReply}>
                  Cancel
                </Button>
                <Button type="submit" leftSection={<IconCheck size={16} />}>
                  Send Reply
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
    </div>
  )
}
