"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/public/Logo/logo.svg";

import Image from "next/image";
import {
	AppShell,
	Burger,
	Group,
	Title,
	NavLink,
	Text,
	rem,
	Menu,
	Avatar,
	Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import {
	IconNews,
	IconArchive,
	IconCategory,
	IconHome,
	IconDashboard,
	IconFlag,
	IconMessage,
	IconUsers,
	IconPhone,
	IconUser,
	IconSettings,
	IconLogout,
	IconChevronDown,
} from "@tabler/icons-react";
import { UserPermission } from "@/types/permissions";

interface NavigationItem {
	label: string;
	icon: React.ComponentType<any>;
	href: string;
	permission?: UserPermission;
}

const navigationItems: NavigationItem[] = [
	{ label: "Dashboard", icon: IconDashboard, href: "/" },
	{
		label: "News Management",
		icon: IconNews,
		href: "/news",
		permission: "NEWS_CRUD",
	},
	{
		label: "Archives",
		icon: IconArchive,
		href: "/archives",
		permission: "ARCHIVES_CRUD",
	},
	{
		label: "Categories",
		icon: IconCategory,
		href: "/categories",
		permission: "CATEGORY_CRUD",
	},
	{
		label: "Homepage",
		icon: IconHome,
		href: "/homepage",
		permission: "HOMEPAGE_CRUD",
	},
	{ label: "Users", icon: IconUsers, href: "/users", permission: "USER_CRUD" },
	{
		label: "Contact Info",
		icon: IconPhone,
		href: "/contact",
		permission: "HOMEPAGE_CRUD",
	},
	{
		label: "Remarks",
		icon: IconMessage,
		href: "/remarks",
		permission: "REMARKS_CRUD",
	},
];

interface AdminLayoutProps {
	children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const [opened, { toggle }] = useDisclosure();
	const pathname = usePathname();
	const router = useRouter();
	const { user, logout, isAuthenticated, hasPermission } = useAuth();

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	// Filter navigation items based on user permissions
	const filteredNavigationItems = navigationItems.filter((item) => {
		if (!item.permission) return true;
		return hasPermission(item.permission);
	});

	if (pathname === "/login" || !isAuthenticated) {
		return <>{children}</>;
	}

	return (
		<AppShell
			header={{ height: 70 }}
			navbar={{
				width: 280,
				breakpoint: "sm",
				collapsed: { mobile: !opened },
			}}
			padding={0}
			styles={{
				header: {
					borderBottom: "1px solid #e9ecef",
					backgroundColor: "white",
				},
				navbar: {
					backgroundColor: "#fafafa",
					borderRight: "1px solid #e9ecef",
				},
			}}
		>
			<AppShell.Header>
				<Group h="100%" px="xl" justify="space-between">
					<Group>
						<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
						<img
							src="/office/logo.svg"
							alt="TGA Logo"
							width={100}
							height={70}
							style={{ objectFit: "contain" }}
						/>
						{/* <div style={{ width: 100, height: 70 }}>
							<Logo alt="TGA Logo" width="100%" height="auto" />
						</div> */}
						<div>
							<Title order={2} size="h3" fw={600} c="primary.7">
								TGA Global Law Group
							</Title>
							<Text size="sm" c="gray.6">
								{user?.email || "Admin Portal"}
							</Text>
						</div>
					</Group>

					<Menu shadow="md" width={200} position="bottom-end">
						<Menu.Target>
							<Group gap="sm" style={{ cursor: "pointer" }} p="xs">
								<Avatar size="sm" radius="xl" color="blue">
									{user?.username?.charAt(0).toUpperCase() || "U"}
								</Avatar>
								<div style={{ textAlign: "left" }}>
									<Text size="sm" fw={500}>
										{user?.username || "User"}
									</Text>
									<Text size="xs" c="dimmed">
										{user?.role_name || "User"}
									</Text>
								</div>
								<IconChevronDown size={14} />
							</Group>
						</Menu.Target>

						<Menu.Dropdown>
							<Menu.Label>Account</Menu.Label>
							<Menu.Item
								leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
								onClick={() => router.push("/profile")}
							>
								My Profile
							</Menu.Item>
							<Menu.Item
								leftSection={
									<IconSettings style={{ width: rem(14), height: rem(14) }} />
								}
								onClick={() => router.push("/settings")}
							>
								Settings
							</Menu.Item>

							<Menu.Divider />

							<Menu.Item
								color="red"
								leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
								onClick={handleLogout}
							>
								Logout
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Group>
			</AppShell.Header>

			<AppShell.Navbar p="lg" style={{ display: "flex", flexDirection: "column" }}>
				<div style={{ flex: 1 }}>
					<Text size="xs" tt="uppercase" fw={700} c="gray.6" mb="lg">
						Navigation
					</Text>
					{filteredNavigationItems.map((item) => (
						<NavLink
							key={item.href}
							active={pathname === item.href}
							label={item.label}
							leftSection={<item.icon style={{ width: rem(18), height: rem(18) }} />}
							onClick={() => router.push(item.href)}
							mb="xs"
							styles={{
								root: {
									borderRadius: "8px",
									fontWeight: 500,
									cursor: "pointer",
								},
								label: {
									fontSize: "14px",
								},
							}}
						/>
					))}
				</div>

				<div
					style={{
						marginTop: "auto",
						paddingTop: "1rem",
						borderTop: "1px solid #e9ecef",
					}}
				>
					<NavLink
						active={pathname === "/profile"}
						label="My Profile"
						leftSection={<IconUser style={{ width: rem(18), height: rem(18) }} />}
						onClick={() => router.push("/profile")}
						mb="xs"
						styles={{
							root: {
								borderRadius: "8px",
								fontWeight: 500,
								cursor: "pointer",
							},
							label: {
								fontSize: "14px",
							},
						}}
					/>

					<Button
						variant="light"
						color="red"
						fullWidth
						leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} />}
						onClick={handleLogout}
						size="sm"
					>
						Logout
					</Button>
				</div>
			</AppShell.Navbar>

			<AppShell.Main
				style={{
					backgroundColor: "#f8f9fa",
					minHeight: "100vh",
				}}
			>
				{children}
			</AppShell.Main>
		</AppShell>
	);
}
