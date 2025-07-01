"use client"

import {
  Grid,
  Paper,
  Text,
  Title,
  Group,
  ThemeIcon,
  SimpleGrid,
  Button,
  Card,
  Stack,
  Box,
  Badge,
  Avatar,
  Timeline,
  ActionIcon,
  Divider,
} from "@mantine/core"
import {
  IconNews,
  IconArchive,
  IconCategory,
  IconTrendingUp,
  IconCalendar,
  IconArrowRight,
  IconFileText,
  IconBell,
  IconFlag,
  IconMessage,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { colors } from "@/config/theme"

const stats = [
  {
    title: "Total News",
    value: "24",
    icon: IconNews,
    color: "primary.6",
    bgColor: "primary.0",
    change: "+12%",
    changeType: "positive",
  },
  {
    title: "Archives",
    value: "156",
    icon: IconArchive,
    color: "success.6",
    bgColor: "success.0",
    change: "+8%",
    changeType: "positive",
  },
  {
    title: "Categories",
    value: "8",
    icon: IconCategory,
    color: "warning.6",
    bgColor: "warning.0",
    change: "+2",
    changeType: "neutral",
  },
]

const recentActivity = [
  {
    id: 1,
    type: "news",
    title: "New article published",
    description: "Technology Update article was published",
    time: "2 hours ago",
    user: "John Doe",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 2,
    type: "archive",
    title: "Document uploaded",
    description: "Annual Report 2024.pdf was uploaded",
    time: "4 hours ago",
    user: "Jane Smith",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 3,
    type: "category",
    title: "Category created",
    description: "New category 'Research Papers' was created",
    time: "1 day ago",
    user: "Admin",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

const quickActions = [
  {
    title: "Create News Article",
    description: "Write and publish a new news article",
    icon: IconNews,
    color: "primary",
    href: "/news",
  },
  {
    title: "Upload Document",
    description: "Add new document to archives",
    icon: IconArchive,
    color: "success",
    href: "/archives",
  },
  {
    title: "Manage Categories",
    description: "Create or edit content categories",
    icon: IconCategory,
    color: "warning",
    href: "/categories",
  },
  {
    title: "Update Homepage",
    description: "Modify homepage content and layout",
    icon: IconFileText,
    color: "secondary",
    href: "/homepage",
  },
]

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()

  const handleQuickAction = (href: string) => {
    router.push(href)
  }

  return (
			<Box style={{ padding: "24px" }}>
				{/* Header */}
				<Group justify="space-between" mb="xl">
					<div>
						<Title order={1} size="h2" fw={600} c="gray.8">
							Welcome back, {user?.username || "User"}! 👋
						</Title>
						<Text c="gray.6" size="lg" mt="xs">
							Here's what's happening with your content today
						</Text>
					</div>
					<Group>
						<ActionIcon variant="light" size="lg" radius="md">
							<IconBell size={20} />
						</ActionIcon>
					</Group>
				</Group>

				{/* Stats Cards */}
				<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mb="xl" spacing="lg">
					{stats.map((stat) => (
						<Card key={stat.title} shadow="sm" padding="lg" radius="md" withBorder>
							<Group justify="space-between" mb="md">
								<ThemeIcon
									size={50}
									radius="md"
									variant="light"
									color={stat.color}
									style={{ backgroundColor: stat.bgColor }}
								>
									<stat.icon size={24} />
								</ThemeIcon>
								<Badge
									variant="light"
									color={stat.changeType === "positive" ? "success" : "gray"}
									leftSection={
										stat.changeType === "positive" ? <IconTrendingUp size={12} /> : null
									}
								>
									{stat.change}
								</Badge>
							</Group>

							<Text size="xl" fw={700} c="gray.8">
								{stat.value}
							</Text>
							<Text size="sm" c="gray.6" mt={4}>
								{stat.title}
							</Text>
						</Card>
					))}
				</SimpleGrid>

				{/* Quick Actions */}
				<Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
					<Group justify="space-between" mb="md">
						<Title order={3} size="h4" fw={600}>
							Quick Actions
						</Title>
						<Text size="sm" c="gray.6">
							Common tasks and shortcuts
						</Text>
					</Group>

					<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
						{quickActions.map((action) => (
							<Paper
								key={action.title}
								p="md"
								radius="md"
								withBorder
								style={{
									cursor: "pointer",
									transition: "all 0.2s ease",
									"&:hover": {
										transform: "translateY(-2px)",
										boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
									},
								}}
								onClick={() => handleQuickAction(action.href)}
							>
								<Stack align="center" gap="sm">
									<ThemeIcon size={40} radius="md" variant="light" color={action.color}>
										<action.icon size={20} />
									</ThemeIcon>
									<div style={{ textAlign: "center" }}>
										<Text fw={500} size="sm">
											{action.title}
										</Text>
										<Text size="xs" c="gray.6" mt={4}>
											{action.description}
										</Text>
									</div>
								</Stack>
							</Paper>
						))}
					</SimpleGrid>
				</Card>

				{/* Main Content Grid */}
				<Grid>
					{/* Recent Activity */}
					<Grid.Col span={{ base: 12, lg: 8 }}>
						<Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
							<Group justify="space-between" mb="md">
								<Title order={3} size="h4" fw={600}>
									Recent Activity
								</Title>
								<Button
									variant="light"
									size="xs"
									rightSection={<IconArrowRight size={14} />}
								>
									View All
								</Button>
							</Group>

							<Timeline active={-1} bulletSize={24} lineWidth={2}>
								{recentActivity.map((activity, index) => (
									<Timeline.Item
										key={activity.id}
										bullet={
											<ThemeIcon
												size={24}
												radius="xl"
												variant="light"
												color={
													activity.type === "news" ? "primary"
													: activity.type === "archive" ?
														"success"
													:	"warning"
												}
											>
												{activity.type === "news" ?
													<IconNews size={12} />
												: activity.type === "archive" ?
													<IconArchive size={12} />
												:	<IconCategory size={12} />}
											</ThemeIcon>
										}
										title={
											<Group gap="xs">
												<Text fw={500} size="sm">
													{activity.title}
												</Text>
												<Badge size="xs" variant="dot" color="gray">
													{activity.time}
												</Badge>
											</Group>
										}
									>
										<Text size="sm" c="gray.6" mb="xs">
											{activity.description}
										</Text>
										<Group gap="xs">
											<Avatar src={activity.avatar} size="xs" />
											<Text size="xs" c="gray.5">
												by {activity.user}
											</Text>
										</Group>
									</Timeline.Item>
								))}
							</Timeline>
						</Card>
					</Grid.Col>

					{/* Quick Stats & Info */}
					<Grid.Col span={{ base: 12, lg: 4 }}>
						<Stack gap="md" h="100%">
							{/* Today's Overview */}
							<Card shadow="sm" padding="lg" radius="md" withBorder>
								<Group justify="space-between" mb="md">
									<Title order={4} size="h5" fw={600}>
										Today's Overview
									</Title>
									<IconCalendar size={18} color={colors.gray[500]} />
								</Group>

								<Stack gap="sm">
									<Group justify="space-between">
										<Text size="sm" c="gray.6">
											Articles Published
										</Text>
										<Badge variant="light" color="primary">
											3
										</Badge>
									</Group>
									<Group justify="space-between">
										<Text size="sm" c="gray.6">
											Documents Uploaded
										</Text>
										<Badge variant="light" color="success">
											7
										</Badge>
									</Group>
									<Group justify="space-between">
										<Text size="sm" c="gray.6">
											Flagged Comments
										</Text>
										<Badge
											variant="light"
											color="error"
											onClick={() => router.push("/reports")}
											style={{ cursor: "pointer" }}
										>
											5
										</Badge>
									</Group>
									<Group justify="space-between">
										<Text size="sm" c="gray.6">
											Pending Remarks
										</Text>
										<Badge
											variant="light"
											color="warning"
											onClick={() => router.push("/remarks")}
											style={{ cursor: "pointer" }}
										>
											12
										</Badge>
									</Group>
								</Stack>
							</Card>

							{/* Quick Links */}
							<Card shadow="sm" padding="lg" radius="md" withBorder>
								<Title order={4} size="h5" fw={600} mb="md">
									Quick Links
              </Title>
              
								<Stack gap="xs">
									<Button
										variant="light"
										leftSection={<IconFlag size={16} />}
										fullWidth
										onClick={() => router.push("/reports")}
									>
										View Reports
									</Button>
									<Button
										variant="light"
										leftSection={<IconMessage size={16} />}
										fullWidth
										onClick={() => router.push("/remarks")}
									>
										Manage Remarks
									</Button>
								</Stack>
							</Card>
						</Stack>
					</Grid.Col>
				</Grid>
			</Box>
		);
}
