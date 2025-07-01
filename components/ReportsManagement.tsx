"use client"

import { useState } from "react"
import {
  Title,
  Table,
  Group,
  ActionIcon,
  Paper,
  Badge,
  Text,
  Stack,
  Modal,
  Button,
  Textarea,
  Select,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconEye, IconCheck, IconX, IconFlag } from "@tabler/icons-react"

interface FlaggedComment {
  id: number
  news_id: number
  news_title: string
  user_name: string
  content: string
  likes: number
  dislikes: number
  visible: boolean
  edited: boolean
  flaged: boolean
  createdAt: Date
}

const mockFlaggedComments: FlaggedComment[] = [
  {
    id: 1,
    news_id: 1,
    news_title: "Breaking News: Technology Update",
    user_name: "user123",
    content: "This is inappropriate content that has been flagged by users...",
    likes: 2,
    dislikes: 15,
    visible: true,
    edited: false,
    flaged: true,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: 2,
    news_id: 2,
    news_title: "Important Announcement",
    user_name: "anonymous_user",
    content: "Spam content with inappropriate language and offensive remarks...",
    likes: 0,
    dislikes: 8,
    visible: true,
    edited: false,
    flaged: true,
    createdAt: new Date("2024-01-14"),
  },
  {
    id: 3,
    news_id: 1,
    news_title: "Breaking News: Technology Update",
    user_name: "troublemaker",
    content: "Another flagged comment with potentially harmful content...",
    likes: 1,
    dislikes: 12,
    visible: false,
    edited: true,
    flaged: true,
    createdAt: new Date("2024-01-13"),
  },
]

export default function ReportsManagement() {
  const [flaggedComments, setFlaggedComments] = useState<FlaggedComment[]>(mockFlaggedComments)
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false)
  const [actionOpened, { open: openAction, close: closeAction }] = useDisclosure(false)
  const [viewingComment, setViewingComment] = useState<FlaggedComment | null>(null)
  const [actioningComment, setActioningComment] = useState<FlaggedComment | null>(null)
  const [actionType, setActionType] = useState<"approve" | "hide" | "delete">("approve")
  const [actionReason, setActionReason] = useState("")

  const handleViewComment = (comment: FlaggedComment) => {
    setViewingComment(comment)
    openView()
  }

  const handleTakeAction = (comment: FlaggedComment, action: "approve" | "hide" | "delete") => {
    setActioningComment(comment)
    setActionType(action)
    setActionReason("")
    openAction()
  }

  const handleSubmitAction = () => {
    if (!actioningComment) return

    setFlaggedComments((prev) =>
      prev.map((comment) => {
        if (comment.id === actioningComment.id) {
          switch (actionType) {
            case "approve":
              return { ...comment, flaged: false, visible: true }
            case "hide":
              return { ...comment, visible: false }
            case "delete":
              return comment // In real app, this would be removed from the list
            default:
              return comment
          }
        }
        return comment
      }),
    )

    // In case of delete, remove from list
    if (actionType === "delete") {
      setFlaggedComments((prev) => prev.filter((comment) => comment.id !== actioningComment.id))
    }

    notifications.show({
      title: "Success",
      message: `Comment ${actionType}d successfully`,
      color: actionType === "delete" ? "red" : "green",
    })

    closeAction()
    setActioningComment(null)
  }

  const getStatusBadge = (comment: FlaggedComment) => {
    if (!comment.visible) {
      return (
        <Badge color="red" variant="light">
          Hidden
        </Badge>
      )
    }
    if (comment.flaged) {
      return (
        <Badge color="orange" variant="light">
          Flagged
        </Badge>
      )
    }
    return (
      <Badge color="green" variant="light">
        Approved
      </Badge>
    )
  }

  return (
    <div style={{ padding: "24px" }}>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Reports Management</Title>
          <Text c="gray.6" size="sm" mt="xs">
            Review and moderate flagged comments
          </Text>
        </div>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Source Article</Table.Th>
              <Table.Th>User</Table.Th>
              <Table.Th>Comment Preview</Table.Th>
              <Table.Th>Engagement</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {flaggedComments.map((comment) => (
              <Table.Tr key={comment.id}>
                <Table.Td>
                  <div>
                    <Text fw={500} size="sm" lineClamp={1}>
                      {comment.news_title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Article ID: {comment.news_id}
                    </Text>
                  </div>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{comment.user_name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" lineClamp={2} maw={200}>
                    {comment.content}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Text size="xs" c="green">
                      👍 {comment.likes}
                    </Text>
                    <Text size="xs" c="red">
                      👎 {comment.dislikes}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>{getStatusBadge(comment)}</Table.Td>
                <Table.Td>
                  <Text size="sm">{comment.createdAt.toLocaleDateString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon variant="light" color="blue" onClick={() => handleViewComment(comment)}>
                      <IconEye size={16} />
                    </ActionIcon>
                    {comment.flaged && (
                      <>
                        <ActionIcon variant="light" color="green" onClick={() => handleTakeAction(comment, "approve")}>
                          <IconCheck size={16} />
                        </ActionIcon>
                        <ActionIcon variant="light" color="orange" onClick={() => handleTakeAction(comment, "hide")}>
                          <IconFlag size={16} />
                        </ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={() => handleTakeAction(comment, "delete")}>
                          <IconX size={16} />
                        </ActionIcon>
                      </>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* View Comment Modal */}
      <Modal opened={viewOpened} onClose={closeView} title="View Flagged Comment" size="lg">
        {viewingComment && (
          <Stack>
            <div>
              <Text fw={500} mb="xs">
                News Article
              </Text>
              <Text size="sm" c="dimmed">
                {viewingComment.news_title}
              </Text>
            </div>

            <div>
              <Text fw={500} mb="xs">
                User
              </Text>
              <Text size="sm">{viewingComment.user_name}</Text>
            </div>

            <div>
              <Text fw={500} mb="xs">
                Comment Content
              </Text>
              <Paper withBorder p="md" bg="gray.0">
                <Text size="sm">{viewingComment.content}</Text>
              </Paper>
            </div>

            <Group>
              <div>
                <Text fw={500} size="sm">
                  Likes: {viewingComment.likes}
                </Text>
              </div>
              <div>
                <Text fw={500} size="sm">
                  Dislikes: {viewingComment.dislikes}
                </Text>
              </div>
              <div>
                <Text fw={500} size="sm">
                  Status: {getStatusBadge(viewingComment)}
                </Text>
              </div>
            </Group>

            <Text size="xs" c="dimmed">
              Posted on {viewingComment.createdAt.toLocaleDateString()}
              {viewingComment.edited && " (Edited)"}
            </Text>
          </Stack>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        opened={actionOpened}
        onClose={closeAction}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Comment`}
      >
        <Stack>
          <Text size="sm">Are you sure you want to {actionType} this comment?</Text>

          {actioningComment && (
            <Paper withBorder p="md" bg="gray.0">
              <Text size="sm" lineClamp={3}>
                {actioningComment.content}
              </Text>
            </Paper>
          )}

          <Select
            label="Action"
            value={actionType}
            onChange={(value) => setActionType(value as "approve" | "hide" | "delete")}
            data={[
              { value: "approve", label: "Approve Comment" },
              { value: "hide", label: "Hide Comment" },
              { value: "delete", label: "Delete Comment" },
            ]}
          />

          <Textarea
            label="Reason (Optional)"
            placeholder="Enter reason for this action..."
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            rows={3}
          />

          <Group justify="flex-end">
            <Button variant="light" onClick={closeAction}>
              Cancel
            </Button>
            <Button
              color={actionType === "delete" ? "red" : actionType === "hide" ? "orange" : "green"}
              onClick={handleSubmitAction}
            >
              {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}
