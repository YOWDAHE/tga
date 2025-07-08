"use client"

import { useState, useEffect } from "react";
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
  Skeleton,
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
  IconWriting,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { colors } from "@/config/theme"
import { getDashboardData } from "@/app/actions/dashboard.actions"
import { notifications } from "@mantine/notifications"

interface DashboardStats {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
}

interface TodayOverview {
  articlesPublished: number;
  documentsUploaded: number;
  flaggedComments: number;
  pendingRemarks: number;
}

interface RecentActivity {
  id: number;
  type: "news" | "archive" | "category";
  title: string;
  description: string;
  time: string;
  user: string;
  avatar: string;
}

interface DashboardData {
  stats: DashboardStats[];
  todayOverview: TodayOverview;
  recentActivity: RecentActivity[];
}

interface DashboardProps {
  initialData?: DashboardData | null;
}

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
    title: "View Logs",
    description: "View logs of users",
    icon: IconWriting,
    color: "warning",
    href: "/users",
  },
  {
    title: "Update Homepage",
    description: "Modify homepage content and layout",
    icon: IconFileText,
    color: "secondary",
    href: "/homepage",
  },
]

export default function Dashboard({ initialData }: DashboardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (!initialData) {
      fetchDashboardData()
    }
  }, [initialData])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const result = await getDashboardData()
      if (result.success) {
        setDashboardData(result.data)
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to fetch dashboard data",
          color: "red",
        })
      }
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "An unexpected error occurred",
        color: "red",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (href: string) => {
    router.push(href)
  }

  const getStatIcon = (title: string) => {
    switch (title) {
      case "Total News":
        return IconNews
      case "Archives":
        return IconArchive
      case "Categories":
        return IconCategory
      default:
        return IconNews
    }
  }

  const getStatColor = (title: string) => {
    switch (title) {
      case "Total News":
        return "primary.6"
      case "Archives":
        return "success.6"
      case "Categories":
        return "warning.6"
      default:
        return "primary.6"
    }
  }

  const getStatBgColor = (title: string) => {
    switch (title) {
      case "Total News":
        return "primary.0"
      case "Archives":
        return "success.0"
      case "Categories":
        return "warning.0"
      default:
        return "primary.0"
    }
  }

  if (loading) {
    return (
      <Box style={{ padding: "24px" }}>
        <Skeleton height={60} mb="xl" />
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mb="xl" spacing="lg">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={120} />
          ))}
        </SimpleGrid>
        <Skeleton height={200} mb="xl" />
        <Grid>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Skeleton height={400} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="md">
              <Skeleton height={150} />
              <Skeleton height={150} />
            </Stack>
          </Grid.Col>
        </Grid>
      </Box>
    )
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
        {dashboardData?.stats.map((stat) => {
          const IconComponent = getStatIcon(stat.title)
          return (
            <Card key={stat.title} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="md">
                <ThemeIcon
                  size={50}
                  radius="md"
                  variant="light"
                  color={getStatColor(stat.title)}
                  style={{ backgroundColor: getStatBgColor(stat.title) }}
                >
                  <IconComponent size={24} />
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
          )
        })}
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
          <Card shadow="sm" padding="lg" radius="md" withBorder h="400px" style={{overflowY: 'scroll'}}>
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
              {dashboardData?.recentActivity.map((activity, index) => (
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
                    {dashboardData?.todayOverview.articlesPublished || 0}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="gray.6">
                    Documents Uploaded
                  </Text>
                  <Badge variant="light" color="success">
                    {dashboardData?.todayOverview.documentsUploaded || 0}
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
                    {dashboardData?.todayOverview.flaggedComments || 0}
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
                    {dashboardData?.todayOverview.pendingRemarks || 0}
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
