"use client";

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
	useMantineTheme,
	rem,
} from "@mantine/core";
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
	IconUsers,
	IconEye,
	IconHeart,
	IconShare,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/config/theme";
import { getDashboardData } from "@/app/actions/dashboard.actions";
import { notifications } from "@mantine/notifications";

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
		gradient: { from: "primary.6", to: "primary.4", deg: 135 },
		href: "/news",
	},
	{
		title: "Upload Document",
		description: "Add new document to archives",
		icon: IconArchive,
		gradient: { from: "success.6", to: "success.4", deg: 135 },
		href: "/archives",
	},
	{
		title: "Manage Users",
		description: "View and manage user accounts",
		icon: IconUsers,
		gradient: { from: "secondary.6", to: "secondary.4", deg: 135 },
		href: "/users",
	},
	{
		title: "Update Homepage",
		description: "Modify homepage content and layout",
		icon: IconFileText,
		gradient: { from: "warning.6", to: "warning.4", deg: 135 },
		href: "/homepage",
	},
];

export default function Dashboard({ initialData }: DashboardProps) {
	const router = useRouter();
	const { user } = useAuth();
	const theme = useMantineTheme();
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(
		initialData || null
	);
	const [loading, setLoading] = useState(!initialData);

	useEffect(() => {
		if (!initialData) {
			fetchDashboardData();
		}
	}, [initialData]);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			const result = await getDashboardData();
			if (result.success) {
				setDashboardData(result.data);
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to fetch dashboard data",
					color: "red",
				});
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleQuickAction = (href: string) => {
		router.push(href);
	};

	const getStatIcon = (title: string) => {
		switch (title) {
			case "Total News":
				return IconNews;
			case "Archives":
				return IconArchive;
			case "Categories":
				return IconCategory;
			default:
				return IconNews;
		}
	};

	const getStatColor = (title: string) => {
		switch (title) {
			case "Total News":
				return "primary.6";
			case "Archives":
				return "success.6";
			case "Categories":
				return "warning.6";
			default:
				return "primary.6";
		}
	};

	const getStatBgColor = (title: string) => {
		switch (title) {
			case "Total News":
				return "primary.0";
			case "Archives":
				return "success.0";
			case "Categories":
				return "warning.0";
			default:
				return "primary.0";
		}
	};

	const getStatGradient = (title: string) => {
		switch (title) {
			case "Total News":
				return { from: theme.colors.primary[6], to: theme.colors.primary[4] };
			case "Archives":
				return { from: theme.colors.success[6], to: theme.colors.success[4] };
			case "Categories":
				return { from: theme.colors.warning[6], to: theme.colors.warning[4] };
			default:
				return { from: theme.colors.primary[6], to: theme.colors.primary[4] };
		}
	};

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
		);
	}

	return (
		<Box style={{ padding: "24px" }}>
			{/* Header */}
			<Box
				style={{
					// background: `linear-gradient(135deg, ${theme.colors.primary[0]} 0%, ${theme.colors.primary[1]} 100%)`,
					// borderRadius: theme.radius.lg,
					paddingTop: theme.spacing.xl,
					paddingBottom: theme.spacing.xl,
					marginBottom: theme.spacing.xl,
					// border: `1px solid ${theme.colors.primary[2]}`,
					position: "relative",
					overflow: "hidden",
				}}
			>
				{/* Background decorative elements */}
				{/* <Box
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.colors.primary[3]} 0%, ${theme.colors.primary[4]} 100%)`,
            opacity: 0.1,
            filter: 'blur(40px)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.colors.primary[4]} 0%, ${theme.colors.primary[5]} 100%)`,
            opacity: 0.1,
            filter: 'blur(30px)',
          }}
        /> */}

				<Group justify="space-between" style={{ position: "relative", zIndex: 1 }}>
					<div>
						<Title order={1} size={rem(32)} fw={700} c={theme.colors.primary[8]}>
							Welcome back, {user?.username || "User"}! 👋
						</Title>
						<Text c={theme.colors.primary[7]} size="lg" mt="xs" fw={500}>
							Here's what's happening with your content today
						</Text>
					</div>
				</Group>
			</Box>

			{/* Stats Cards */}
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mb="xl" spacing="lg">
				{dashboardData?.stats.map((stat) => {
					const IconComponent = getStatIcon(stat.title);
					return (
						<Card
							key={stat.title}
							shadow="sm"
							padding="xl"
							radius="lg"
							withBorder
							style={{
								background: "white",
								border: `1px solid ${theme.colors.gray[2]}`,
								transition: "all 0.3s ease",
								"&:hover": {
									transform: "translateY(-2px)",
									boxShadow: theme.shadows.md,
								},
							}}
						>
							<Group justify="space-between">
								<Group>
									<Text size='lg' fw={700} c={theme.colors.gray[8]}>
										{stat.value}
									</Text>
									<Text c={theme.colors.gray[6]} fw={500}>
										{stat.title}
									</Text>
								</Group>
								<ThemeIcon
									size={50}
									radius="lg"
									variant="light"
									color={getStatColor(stat.title)}
									style={{
										backgroundColor: getStatBgColor(stat.title),
										border: `1px solid ${theme.colors.gray[2]}`,
									}}
								>
									<IconComponent size={24} />
								</ThemeIcon>
							</Group>
						</Card>
					);
				})}
			</SimpleGrid>

			{/* Quick Actions */}
			<Card
				shadow="sm"
				padding="xl"
				radius="lg"
				withBorder
				mb="xl"
				style={{
					background: "white",
					border: `1px solid ${theme.colors.gray[2]}`,
				}}
			>
				<Group justify="space-between" mb="lg">
					<div>
						<Title order={3} size={rem(24)} fw={700} c={theme.colors.gray[8]}>
							Quick Actions
						</Title>
						<Text size="sm" c={theme.colors.gray[6]} mt={4}>
							Common tasks and shortcuts
						</Text>
					</div>
					<ThemeIcon
						size={45}
						radius="lg"
						variant="light"
						color="primary"
						style={{
							backgroundColor: theme.colors.primary[1],
							border: `1px solid ${theme.colors.gray[2]}`,
						}}
					>
						<IconArrowRight size={20} />
					</ThemeIcon>
				</Group>

				<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
					{quickActions.map((action) => (
						<Paper
							key={action.title}
							p="xl"
							radius="lg"
							withBorder
							style={{
								cursor: "pointer",
								transition: "all 0.3s ease",
								background: "white",
								border: `1px solid ${theme.colors.gray[2]}`,
								boxShadow: theme.shadows.sm,
								"&:hover": {
									transform: "translateY(-2px)",
									boxShadow: theme.shadows.md,
									borderColor: theme.colors.primary[4],
								},
							}}
							onClick={() => handleQuickAction(action.href)}
						>
							<Stack align="center" gap="md">
								<ThemeIcon
									size={50}
									radius="lg"
									variant="light"
									color={action.gradient.from.split(".")[0]}
									style={{
										backgroundColor: theme.colors[action.gradient.from.split(".")[0]][1],
										border: `1px solid ${theme.colors.gray[2]}`,
									}}
								>
									<action.icon size={24} />
								</ThemeIcon>
								<div style={{ textAlign: "center" }}>
									<Text fw={600} size="sm" c={theme.colors.gray[8]}>
										{action.title}
									</Text>
									<Text size="xs" c={theme.colors.gray[6]} mt={4}>
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
					<Card
						shadow="sm"
						padding="xl"
						radius="lg"
						withBorder
						h="400px"
						style={{
							overflowY: "scroll",
							background: "white",
							border: `1px solid ${theme.colors.gray[2]}`,
						}}
					>
						<Group justify="space-between" mb="lg">
							<div>
								<Title order={3} size={rem(24)} fw={700} c={theme.colors.gray[8]}>
									Recent Activity
								</Title>
								<Text size="sm" c={theme.colors.gray[6]} mt={4}>
									Latest updates and changes
								</Text>
							</div>
							<Button
								variant="light"
								size="sm"
								radius="md"
								rightSection={<IconArrowRight size={14} />}
								style={{
									backgroundColor: theme.colors.primary[1],
									border: `1px solid ${theme.colors.primary[3]}`,
									color: theme.colors.primary[7],
								}}
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
					<Stack gap="lg" h="100%">
						{/* Today's Overview */}
						<Card
							shadow="sm"
							padding="xl"
							radius="lg"
							withBorder
							style={{
								background: "white",
								border: `1px solid ${theme.colors.gray[2]}`,
							}}
						>
							<Group justify="space-between" mb="lg">
								<div>
									<Title order={4} size={rem(20)} fw={700} c={theme.colors.gray[8]}>
										Today's Overview
									</Title>
									<Text size="sm" c={theme.colors.gray[6]} mt={4}>
										Daily statistics summary
									</Text>
								</div>
								<ThemeIcon
									size={45}
									radius="lg"
									variant="light"
									color="success"
									style={{
										backgroundColor: theme.colors.success[1],
										border: `1px solid ${theme.colors.gray[2]}`,
									}}
								>
									<IconCalendar size={20} />
								</ThemeIcon>
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
						<Card
							shadow="sm"
							padding="xl"
							radius="lg"
							withBorder
							style={{
								background: "white",
								border: `1px solid ${theme.colors.gray[2]}`,
							}}
						>
							<Title
								order={4}
								size={rem(20)}
								fw={700}
								mb="lg"
								c={theme.colors.gray[8]}
							>
								Quick Links
							</Title>

							<Stack gap="md">
								<Button
									variant="light"
									leftSection={<IconFlag size={16} />}
									fullWidth
									size="md"
									radius="md"
									onClick={() => router.push("/reports")}
									style={{
										backgroundColor: theme.colors.secondary[1],
										border: `1px solid ${theme.colors.secondary[3]}`,
										color: theme.colors.secondary[7],
										transition: "all 0.3s ease",
										"&:hover": {
											backgroundColor: theme.colors.secondary[2],
											transform: "translateY(-1px)",
										},
									}}
								>
									View Reports
								</Button>
								<Button
									variant="light"
									leftSection={<IconMessage size={16} />}
									fullWidth
									size="md"
									radius="md"
									onClick={() => router.push("/remarks")}
									style={{
										backgroundColor: theme.colors.secondary[1],
										border: `1px solid ${theme.colors.secondary[3]}`,
										color: theme.colors.secondary[7],
										transition: "all 0.3s ease",
										"&:hover": {
											backgroundColor: theme.colors.secondary[2],
											transform: "translateY(-1px)",
										},
									}}
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
