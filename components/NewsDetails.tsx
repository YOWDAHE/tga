"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Title,
  Button,
  Group,
  Paper,
  Badge,
  Text,
  Stack,
  Tabs,
  Table,
  ActionIcon,
  Modal,
  Textarea,
  Select,
  Card,
  Avatar,
  Divider,
  Image,
  SimpleGrid,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import {
  IconArrowLeft,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconFlag,
  IconThumbUp,
  IconThumbDown,
  IconTrash,
  IconCalendar,
  IconUser,
  IconMessage,
} from "@tabler/icons-react"

interface NewsItem {
  id: number
  title: string
  content: string
  visual_content?: (string | { public_id: string; secure_url: string })[] | null
  source?: string
  published_date?: string
  created_by?: string
  view_count?: number
  createdAt: string
  updatedAt?: string
}

interface Comment {
  id: number
  news_id: number
  user_name: string
  content: string
  likes: number
  dislikes: number
  visible: boolean
  edited: boolean
  flaged: boolean
  createdAt: string
  updatedAt: string
}

interface NewsDetailsProps {
  news: NewsItem
}

// Mock comments data - in a real app, this would come from an API
const mockComments: Comment[] = [
  {
    id: 1,
    news_id: 1,
    user_name: "tech_enthusiast",
    content: "This is amazing! Can't wait to see how this technology develops further.",
    likes: 15,
    dislikes: 2,
    visible: true,
    edited: false,
    flaged: false,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    news_id: 1,
    user_name: "skeptical_user",
    content: "I'm not sure about this. Seems too good to be true. Need more evidence.",
    likes: 8,
    dislikes: 12,
    visible: true,
    edited: false,
    flaged: false,
    createdAt: "2024-01-15T11:15:00Z",
    updatedAt: "2024-01-15T11:15:00Z",
  },
  {
    id: 3,
    news_id: 1,
    user_name: "anonymous_user",
    content: "This is inappropriate content that should be flagged and removed immediately!",
    likes: 1,
    dislikes: 25,
    visible: false,
    edited: false,
    flaged: true,
    createdAt: "2024-01-15T12:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z",
  },
  {
    id: 4,
    news_id: 1,
    user_name: "researcher_jane",
    content:
      "As someone working in this field, I can confirm this is a significant breakthrough. The implications for quantum cryptography alone are enormous.",
    likes: 32,
    dislikes: 1,
    visible: true,
    edited: true,
    flaged: false,
    createdAt: "2024-01-15T14:20:00Z",
    updatedAt: "2024-01-15T14:25:00Z",
  },
]

export default function NewsDetails({ news }: NewsDetailsProps) {
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>(mockComments.filter((c) => c.news_id === news.id))
  const [actionModalOpened, { open: openActionModal, close: closeActionModal }] = useDisclosure(false)
  const [actioningComment, setActioningComment] = useState<Comment | null>(null)
  const [actionType, setActionType] = useState<"flag" | "unflag" | "hide" | "show" | "delete">("flag")
  const [actionReason, setActionReason] = useState("")

  // Helper function to get image URL from either string or object
  const getImageUrl = (imageData: string | { public_id: string; secure_url: string }): string => {
    if (typeof imageData === 'string') {
      return imageData;
    }
    return imageData.secure_url;
  };

  const handleCommentAction = (comment: Comment, action: "flag" | "unflag" | "hide" | "show" | "delete") => {
    setActioningComment(comment)
    setActionType(action)
    setActionReason("")
    openActionModal()
  }

  const handleSubmitAction = () => {
    if (!actioningComment) return

    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === actioningComment.id) {
          switch (actionType) {
            case "flag":
              return { ...comment, flaged: true }
            case "unflag":
              return { ...comment, flaged: false }
            case "hide":
              return { ...comment, visible: false }
            case "show":
              return { ...comment, visible: true }
            case "delete":
              return comment // Will be filtered out below
            default:
              return comment
          }
        }
        return comment
      }),
    )

    // Remove deleted comments
    if (actionType === "delete") {
      setComments((prev) => prev.filter((comment) => comment.id !== actioningComment.id))
    }

    notifications.show({
      title: "Success",
      message: `Comment ${actionType}${actionType.endsWith("e") ? "d" : "ged"} successfully`,
      color: actionType === "delete" ? "red" : "green",
    })

    closeActionModal()
    setActioningComment(null)
  }

  const getStatusBadge = (comment: Comment) => {
    if (comment.flaged) {
      return (
        <Badge color="red" variant="light" size="sm">
          Flagged
        </Badge>
      )
    }
    if (!comment.visible) {
      return (
        <Badge color="orange" variant="light" size="sm">
          Hidden
        </Badge>
      )
    }
    return (
      <Badge color="green" variant="light" size="sm">
        Visible
      </Badge>
    )
  }

  const visibleComments = comments.filter((c) => c.visible)
  const hiddenComments = comments.filter((c) => !c.visible)
  const flaggedComments = comments.filter((c) => c.flaged)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div>
      <Button leftSection={<IconArrowLeft size={16} />} onClick={() => router.back()} mb="lg">
        Back to News
      </Button>

      <Tabs defaultValue="article">
        <Tabs.List>
          <Tabs.Tab value="article" leftSection={<IconEdit size={16} />}>
            Article Details
          </Tabs.Tab>
          <Tabs.Tab value="comments" leftSection={<IconMessage size={16} />}>
            Comments ({comments.length})
          </Tabs.Tab>
        </Tabs.List>

        {/* Article Details Tab */}
        <Tabs.Panel value="article" pt="md">
          <Paper withBorder p="lg" radius="md">
            <Stack>
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                  <Title order={1} mb="md">
                    {news.title}
                  </Title>

                  <Group mb="lg">
                    <Badge variant="light" leftSection={<IconUser size={12} />}>
                      {news.created_by || "Unknown"}
                    </Badge>
                    <Badge variant="light" leftSection={<IconCalendar size={12} />}>
                      {news.published_date ? formatDate(news.published_date) : "No date"}
                    </Badge>
                    <Badge variant="light" color="blue">
                      {news.source || "System"}
                    </Badge>
                    {news.view_count && (
                      <Badge variant="light" color="green">
                        {news.view_count} views
                      </Badge>
                    )}
                  </Group>
                </div>

                <Button leftSection={<IconEdit size={16} />} onClick={() => router.push(`/news/add?edit=${news.id}`)}>
                  Edit Article
                </Button>
              </Group>

              <Divider />

              {news.visual_content && news.visual_content.length > 0 && (
                <div>
                  <Text size="sm" fw={500} mb="xs">Visual Content:</Text>
                  <SimpleGrid cols={2}>
                    {news.visual_content.map((imageData, index) => (
                      <Image 
                        key={index}
                        src={getImageUrl(imageData)} 
                        alt={`News visual content ${index + 1}`} 
                        radius="md" 
                        width='100%'
                        height='100%'
                        fit="cover"
                        fallbackSrc="/placeholder.svg?height=150&width=200"
                      />
                    ))}
                  </SimpleGrid>
                </div>
              )}

              <div
                dangerouslySetInnerHTML={{ __html: news.content }}
                style={{
                  lineHeight: 1.6,
                  fontSize: "16px",
                }}
              />

              <Divider />

              <Group>
                <Text size="sm" c="dimmed">
                  Published: {news.published_date ? formatDate(news.published_date) : "No date"}
                </Text>
                <Text size="sm" c="dimmed">
                  Created: {formatDate(news.createdAt)}
                </Text>
                {news.updatedAt && (
                  <Text size="sm" c="dimmed">
                    Updated: {formatDate(news.updatedAt)}
                  </Text>
                )}
                {news.view_count && (
                  <Text size="sm" c="dimmed">
                    Views: {news.view_count}
                  </Text>
                )}
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>

        {/* Comments Tab */}
        <Tabs.Panel value="comments" pt="md">
          <Stack>
            {/* Comments Summary */}
            <Group mb="lg">
              <Card withBorder padding="md">
                <Text size="sm" c="dimmed">
                  Total Comments
                </Text>
                <Text size="xl" fw={700}>
                  {comments.length}
                </Text>
              </Card>
              <Card withBorder padding="md">
                <Text size="sm" c="dimmed">
                  Visible
                </Text>
                <Text size="xl" fw={700} c="green">
                  {visibleComments.length}
                </Text>
              </Card>
              <Card withBorder padding="md">
                <Text size="sm" c="dimmed">
                  Hidden
                </Text>
                <Text size="xl" fw={700} c="orange">
                  {hiddenComments.length}
                </Text>
              </Card>
              <Card withBorder padding="md">
                <Text size="sm" c="dimmed">
                  Flagged
                </Text>
                <Text size="xl" fw={700} c="red">
                  {flaggedComments.length}
                </Text>
              </Card>
            </Group>

            {/* Comments Table */}
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Comment</Table.Th>
                    <Table.Th>Engagement</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {comments.map((comment) => (
                    <Table.Tr key={comment.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl">
                            {comment.user_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <div>
                            <Text fw={500} size="sm">
                              {comment.user_name}
                            </Text>
                            {comment.edited && (
                              <Text size="xs" c="dimmed">
                                (Edited)
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={3} maw={300}>
                          {comment.content}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Group gap={4}>
                            <IconThumbUp size={14} color="green" />
                            <Text size="xs">{comment.likes}</Text>
                          </Group>
                          <Group gap={4}>
                            <IconThumbDown size={14} color="red" />
                            <Text size="xs">{comment.dislikes}</Text>
                          </Group>
                        </Group>
                      </Table.Td>
                      <Table.Td>{getStatusBadge(comment)}</Table.Td>
                      <Table.Td>
                        <Text size="xs">{formatDate(comment.createdAt)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {comment.visible ? (
                            <ActionIcon
                              variant="light"
                              color="orange"
                              onClick={() => handleCommentAction(comment, "hide")}
                            >
                              <IconEyeOff size={16} />
                            </ActionIcon>
                          ) : (
                            <ActionIcon
                              variant="light"
                              color="green"
                              onClick={() => handleCommentAction(comment, "show")}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          )}

                          {comment.flaged ? (
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => handleCommentAction(comment, "unflag")}
                            >
                              <IconFlag size={16} />
                            </ActionIcon>
                          ) : (
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => handleCommentAction(comment, "flag")}
                            >
                              <IconFlag size={16} />
                            </ActionIcon>
                          )}

                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleCommentAction(comment, "delete")}
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
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Action Modal */}
      <Modal
        opened={actionModalOpened}
        onClose={closeActionModal}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Comment`}
      >
        <Stack>
          <Text size="sm">Are you sure you want to {actionType} this comment?</Text>

          {actioningComment && (
            <Paper withBorder p="md" bg="gray.0">
              <Group mb="xs">
                <Avatar size="xs" radius="xl">
                  {actioningComment.user_name.charAt(0).toUpperCase()}
                </Avatar>
                <Text fw={500} size="sm">
                  {actioningComment.user_name}
                </Text>
              </Group>
              <Text size="sm" lineClamp={3}>
                {actioningComment.content}
              </Text>
            </Paper>
          )}

          <Select
            label="Action"
            value={actionType}
            onChange={(value) => setActionType(value as typeof actionType)}
            data={[
              { value: "flag", label: "Flag Comment" },
              { value: "unflag", label: "Unflag Comment" },
              { value: "hide", label: "Hide Comment" },
              { value: "show", label: "Show Comment" },
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
            <Button variant="light" onClick={closeActionModal}>
              Cancel
            </Button>
            <Button
              color={actionType === "delete" ? "red" : actionType === "flag" ? "orange" : "green"}
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