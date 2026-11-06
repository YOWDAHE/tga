"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import {
	ActionIcon,
	Avatar,
	Burger,
	Group,
	Menu,
	NavLink,
	Text,
	Tooltip,
	UnstyledButton,
	rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	IconNews,
	IconArchive,
	IconBriefcase,
	IconCategory,
	IconHome,
	IconLayoutDashboard,
	IconMessage,
	IconUsers,
	IconPhone,
	IconUser,
	IconLogout,
	IconScale,
	IconChevronRight,
	IconSelector,
	IconLayoutSidebarLeftCollapse,
	IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { UserPermission } from "@/types/permissions";
import classes from "./AdminLayout.module.css";

interface NavigationItem {
	label: string;
	icon: React.ComponentType<any>;
	href: string;
	permission?: UserPermission;
}

interface NavigationSection {
	label: string;
	items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
	{
		label: "Main menu",
		items: [
			{ label: "Overview", icon: IconLayoutDashboard, href: "/" },
			{
				label: "News Management",
				icon: IconNews,
				href: "/news",
				permission: "NEWS_CRUD",
			},
			{
				label: "Legal Updates",
				icon: IconScale,
				href: "/legal-updates",
				permission: "LEGAL_UPDATES_CRUD",
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
		],
	},
	{
		label: "Site and engagement",
		items: [
			{
				label: "Website pages",
				icon: IconHome,
				href: "/homepage",
				permission: "HOMEPAGE_CRUD",
			},
			{
				label: "Contact Info",
				icon: IconPhone,
				href: "/contact",
				permission: "HOMEPAGE_CRUD",
			},
			{
				label: "Careers",
				icon: IconBriefcase,
				href: "/jobs",
				permission: "JOBS_CRUD",
			},
			{
				label: "Remarks",
				icon: IconMessage,
				href: "/remarks",
				permission: "REMARKS_CRUD",
			},
		],
	},
	{
		label: "Administration",
		items: [
			{ label: "Users", icon: IconUsers, href: "/users", permission: "USER_CRUD" },
		],
	},
];

// Pinned above the account block, like a settings entry
const footerItems: NavigationItem[] = [
	{ label: "My Profile", icon: IconUser, href: "/profile" },
];

const allNavigationItems = [
	...navigationSections.flatMap((section) => section.items),
	...footerItems,
];

// Labels for sub-routes shown as the last breadcrumb segment
const subRouteLabels: Record<string, string> = {
	add: "Editor",
	other: "Other News",
	uploads: "Uploads",
};

const normalizePath = (path: string) =>
	path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

const isItemActive = (pathname: string, href: string) =>
	href === "/" ? pathname === "/" : (
		pathname === href || pathname.startsWith(`${href}/`)
	);

interface AdminLayoutProps {
	children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
		useDisclosure();
	const [collapsed, { toggle: toggleCollapsed }] = useDisclosure(true);
	const pathname = normalizePath(usePathname() || "/");
	const router = useRouter();
	const { user, logout, isAuthenticated, hasPermission } = useAuth();

	const handleLogout = async () => {
		await logout();
		// Replace so Back doesn't return to the page, and drop cached page data
		router.replace("/login");
		router.refresh();
	};

	const navigate = (href: string) => {
		router.push(href);
		closeMobile();
	};

	const canSee = (item: NavigationItem) =>
		!item.permission || hasPermission(item.permission);

	if (pathname === "/login" || !isAuthenticated) {
		return <>{children}</>;
	}

	const activeItem = allNavigationItems.find((item) =>
		isItemActive(pathname, item.href),
	);
	const subSegment =
		activeItem && activeItem.href !== "/" ?
			pathname.slice(activeItem.href.length + 1).split("/")[0]
		:	"";
	const subLabel =
		subSegment ? (subRouteLabels[subSegment] ?? "Details") : undefined;
	const ActiveIcon = activeItem?.icon;

	// The icon-only rail is a desktop state; the mobile drawer always shows labels
	const rail = collapsed && !mobileOpened;

	const renderLink = (item: NavigationItem) => {
		const link = (
			<NavLink
				key={item.href}
				active={isItemActive(pathname, item.href)}
				label={rail ? undefined : item.label}
				aria-label={item.label}
				leftSection={<item.icon size={20} stroke={1.5} />}
				onClick={() => navigate(item.href)}
				className={classes.navLink}
			/>
		);
		return rail ?
				<Tooltip key={item.href} label={item.label} position="right" withArrow>
					{link}
				</Tooltip>
			:	link;
	};

	return (
		<div className={classes.root}>
			<div
				className={classes.frame}
				data-collapsed={rail || undefined}
				data-mobile-open={mobileOpened || undefined}
			>
				<div className={classes.backdrop} onClick={closeMobile} aria-hidden />
				<aside className={classes.sidebar}>
				<Group justify="space-between" className={classes.brand} wrap="nowrap">
					<img src="/office/Logo/tga-global-logo.svg" alt="TGA Global Law Firm" className={classes.logo} />
					<ActionIcon
						variant="subtle"
						color="gray"
						size="lg"
						onClick={mobileOpened ? closeMobile : toggleCollapsed}
						aria-label={
							mobileOpened ? "Close navigation"
							: rail ? "Expand sidebar"
							: "Collapse sidebar"
						}
					>
						{rail ?
							<IconLayoutSidebarLeftExpand size={20} stroke={1.6} />
						:	<IconLayoutSidebarLeftCollapse size={20} stroke={1.6} />}
					</ActionIcon>
				</Group>

				<nav className={classes.nav}>
					{navigationSections.map((section) => {
						const items = section.items.filter(canSee);
						if (items.length === 0) return null;
						return (
							<div key={section.label} className={classes.section}>
								<Text className={classes.sectionLabel}>{section.label}</Text>
								{items.map(renderLink)}
							</div>
						);
					})}
				</nav>

				<div className={classes.footer}>{footerItems.filter(canSee).map(renderLink)}</div>

				<div className={classes.account}>
					<Text className={classes.sectionLabel}>Account</Text>
					<Menu position="top-start" width={220}>
						<Menu.Target>
							<UnstyledButton className={classes.userButton}>
								<Group gap="sm" wrap="nowrap">
									<Avatar size={40} radius="xl" color="dark">
										{user?.username?.charAt(0).toUpperCase() || "U"}
									</Avatar>
									<div className={classes.userText}>
										<Text size="sm" fw={600} truncate>
											{user?.username || "User"}
										</Text>
										<Text size="xs" c="dimmed" truncate>
											{user?.role_name || user?.email || "User"}
										</Text>
									</div>
									<IconSelector size={16} className={classes.userChevron} />
								</Group>
							</UnstyledButton>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Label>{user?.email || "Account"}</Menu.Label>
							<Menu.Item
								leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}
								onClick={() => navigate("/profile")}
							>
								My Profile
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
				</div>
				</aside>

				<main className={classes.main}>
				<div className={classes.surface}>
					<header className={classes.topbar}>
						<Burger
							opened={mobileOpened}
							onClick={toggleMobile}
							className={classes.burger}
							size="sm"
							aria-label="Toggle navigation"
						/>
						<div className={classes.breadcrumb}>
							<span className={classes.crumbMuted}>TGA Global Law Group</span>
							<IconChevronRight size={14} className={classes.crumbMuted} />
							{ActiveIcon && <ActiveIcon size={16} stroke={1.8} />}
							{subLabel ?
								<>
									<UnstyledButton
										className={classes.crumbLink}
										onClick={() => activeItem && navigate(activeItem.href)}
									>
										{activeItem?.label}
									</UnstyledButton>
									<IconChevronRight size={14} className={classes.crumbMuted} />
									<span className={classes.crumbCurrent}>{subLabel}</span>
								</>
							:	<span className={classes.crumbCurrent}>
									{activeItem?.label ?? "Admin"}
								</span>
							}
						</div>
					</header>
					<div className={classes.content}>{children}</div>
				</div>
				</main>
			</div>
		</div>
	);
}
