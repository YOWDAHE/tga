"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ActionIcon, Loader, Menu } from "@mantine/core";
import {
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconDots,
	IconSearch,
	IconX,
} from "@tabler/icons-react";
import classes from "./admin-ui.module.css";

export { classes as listClasses };
export { useListParams } from "./useListParams";

/* ---------- page header ---------- */

export function PageHeader({
	eyebrow,
	title,
	description,
	actions,
}: {
	eyebrow?: string;
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
}) {
	return (
		<div className={classes.header}>
			<div style={{ minWidth: 0 }}>
				{eyebrow && <div className={classes.eyebrow}>{eyebrow}</div>}
				<h1 className={classes.title}>{title}</h1>
				{description && <p className={classes.description}>{description}</p>}
			</div>
			{actions && <div className={classes.actions}>{actions}</div>}
		</div>
	);
}

/* ---------- toolbar ---------- */

export function Toolbar({ children }: { children: ReactNode }) {
	return <div className={classes.toolbar}>{children}</div>;
}

export function ToolbarRow({ children }: { children: ReactNode }) {
	return <div className={classes.toolbarRow}>{children}</div>;
}

/** Pill search box; reports the query after a short pause */
export function SearchPill({
	value,
	onSearch,
	placeholder,
	pending,
}: {
	value: string;
	onSearch: (query: string) => void;
	placeholder: string;
	pending?: boolean;
}) {
	const [draft, setDraft] = useState(value);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Follow the URL when it changes elsewhere (chips, back button)
	useEffect(() => setDraft(value), [value]);
	useEffect(() => () => {
		if (timer.current) clearTimeout(timer.current);
	}, []);

	const change = (next: string) => {
		setDraft(next);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => onSearch(next.trim()), 350);
	};

	return (
		<label className={classes.search}>
			<span className={classes.searchIcon}>
				{pending && draft ? <Loader size={14} color="gray" /> : <IconSearch size={16} />}
			</span>
			<input
				className={classes.searchInput}
				value={draft}
				onChange={(e) => change(e.currentTarget.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						if (timer.current) clearTimeout(timer.current);
						onSearch(draft.trim());
					}
				}}
				placeholder={placeholder}
				aria-label={placeholder}
			/>
			{draft && (
				<ActionIcon
					className={classes.searchClear}
					variant="subtle"
					color="gray"
					size="sm"
					aria-label="Clear search"
					onClick={() => {
						if (timer.current) clearTimeout(timer.current);
						setDraft("");
						onSearch("");
					}}
				>
					<IconX size={14} />
				</ActionIcon>
			)}
		</label>
	);
}

export type Option = { value: string; label: string };

/** Pill that opens a menu of options; tinted when it differs from the default */
export function FilterPill({
	icon,
	label,
	value,
	options,
	onChange,
	defaultValue = "",
}: {
	icon?: ReactNode;
	label: string;
	value: string;
	options: Option[];
	onChange: (value: string) => void;
	defaultValue?: string;
}) {
	const current = options.find((o) => o.value === value) ?? options.find((o) => o.value === defaultValue);
	const active = value !== defaultValue;
	return (
		<Menu position="bottom-start" radius="lg" shadow="md" width={240} withinPortal>
			<Menu.Target>
				<button type="button" className={classes.pill} data-active={active || undefined}>
					{icon}
					<span className={classes.pillLabel}>{label}:</span>
					<span className={classes.pillValue}>{current?.label ?? "Any"}</span>
					<span className={classes.pillChevron}>
						<IconChevronDown size={14} />
					</span>
				</button>
			</Menu.Target>
			<Menu.Dropdown mah={320} style={{ overflowY: "auto" }}>
				{options.map((o) => (
					<Menu.Item
						key={o.value || "__any"}
						onClick={() => onChange(o.value)}
						rightSection={o.value === (current?.value ?? "") ? <IconCheck size={14} /> : null}
						fw={o.value === (current?.value ?? "") ? 600 : 400}
					>
						{o.label}
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}

/** Segmented status filter with counts */
export function StatusTabs({
	value,
	options,
	onChange,
}: {
	value: string;
	options: (Option & { count?: number })[];
	onChange: (value: string) => void;
}) {
	return (
		<div className={classes.tabs} role="tablist">
			{options.map((o) => {
				const active = o.value === value;
				return (
					<button
						key={o.value || "__all"}
						type="button"
						role="tab"
						aria-selected={active}
						className={classes.tab}
						data-active={active || undefined}
						onClick={() => onChange(o.value)}
					>
						{o.label}
						{o.count !== undefined && <span className={classes.tabCount}>{o.count}</span>}
					</button>
				);
			})}
		</div>
	);
}

export function ActiveFilters({
	chips,
	onClear,
}: {
	chips: { key: string; label: string; onRemove: () => void }[];
	onClear: () => void;
}) {
	if (chips.length === 0) return null;
	return (
		<div className={classes.chips}>
			{chips.map((c) => (
				<span key={c.key} className={classes.chip}>
					{c.label}
					<button type="button" className={classes.chipRemove} onClick={c.onRemove} aria-label={`Remove ${c.label}`}>
						<IconX size={12} />
					</button>
				</span>
			))}
			<button type="button" className={classes.clearAll} onClick={onClear}>
				Clear all
			</button>
		</div>
	);
}

/* ---------- table ---------- */

export function TableCard({ pending, children }: { pending?: boolean; children: ReactNode }) {
	return (
		<div className={classes.tableCard} data-pending={pending || undefined}>
			<div className={classes.tableScroll}>
				<table className={classes.table}>{children}</table>
			</div>
		</div>
	);
}

export function TitleCell({
	title,
	subtitle,
	href,
	leading,
}: {
	title: string;
	subtitle?: ReactNode;
	href?: string;
	leading?: ReactNode;
}) {
	const body = (
		<span style={{ minWidth: 0, display: "block" }}>
			<span className={classes.primary} title={title}>
				{title}
			</span>
			{subtitle && <span className={classes.secondary}>{subtitle}</span>}
		</span>
	);
	return (
		<div className={classes.titleCell}>
			{leading}
			{href ?
				<Link href={href} className={classes.rowLink} style={{ display: "block", minWidth: 0, color: "inherit", textDecoration: "none" }}>
					{body}
				</Link>
			:	body}
		</div>
	);
}

export function Tag({ children }: { children: ReactNode }) {
	return <span className={classes.tag}>{children}</span>;
}

export function StatusBadge({ tone, children }: { tone?: "good" | "warn" | "bad"; children: ReactNode }) {
	return (
		<span className={classes.status} data-tone={tone}>
			{children}
		</span>
	);
}

export function Person({ name }: { name?: string | null }) {
	if (!name) return <span className={classes.muted}>—</span>;
	return (
		<span className={classes.person} title={name}>
			<span className={classes.avatar}>{name.slice(0, 1)}</span>
			<span className={classes.personName}>{name}</span>
		</span>
	);
}

export type RowAction = {
	label: string;
	icon?: ReactNode;
	href?: string;
	external?: boolean;
	onClick?: () => void;
	danger?: boolean;
	divider?: boolean;
};

/** One "..." menu per row instead of a row of colored icons */
export function RowActions({ label, actions }: { label: string; actions: RowAction[] }) {
	return (
		<Menu position="bottom-end" radius="lg" shadow="md" width={200} withinPortal>
			<Menu.Target>
				<ActionIcon variant="subtle" color="gray" radius="xl" aria-label={`Actions for ${label}`}>
					<IconDots size={18} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				{actions.map((a) => (
					<div key={a.label}>
						{a.divider && <Menu.Divider />}
						{a.href ?
							a.external ?
								<Menu.Item component="a" href={a.href} target="_blank" rel="noreferrer" leftSection={a.icon} color={a.danger ? "red" : undefined}>
									{a.label}
								</Menu.Item>
							:	<Menu.Item component={Link} href={a.href} leftSection={a.icon} color={a.danger ? "red" : undefined}>
									{a.label}
								</Menu.Item>
						:	<Menu.Item onClick={a.onClick} leftSection={a.icon} color={a.danger ? "red" : undefined}>
								{a.label}
							</Menu.Item>
						}
					</div>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}

/* ---------- footer ---------- */

function pageList(current: number, total: number): (number | "…")[] {
	const pages = new Set([1, total, current - 1, current, current + 1]);
	const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
	const out: (number | "…")[] = [];
	sorted.forEach((p, i) => {
		if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
		out.push(p);
	});
	return out;
}

export function ListFooter({
	page,
	totalPages,
	shown,
	total,
	noun,
	onPage,
}: {
	page: number;
	totalPages: number;
	shown: number;
	total?: number;
	noun: [string, string];
	onPage: (page: number) => void;
}) {
	const word = (n: number) => (n === 1 ? noun[0] : noun[1]);
	return (
		<div className={classes.footer}>
			<span>
				{total !== undefined ?
					`Showing ${shown} of ${total} ${word(total)}`
				:	`Showing ${shown} ${word(shown)}`}
			</span>
			{totalPages > 1 && (
				<nav className={classes.pager} aria-label="Pagination">
					<button type="button" className={classes.pageButton} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
						<IconChevronLeft size={16} />
					</button>
					{pageList(page, totalPages).map((p, i) =>
						p === "…" ?
							<span key={`gap${i}`} className={classes.muted} style={{ padding: "0 4px" }}>
								…
							</span>
						:	<button
								key={p}
								type="button"
								className={classes.pageButton}
								data-active={p === page || undefined}
								aria-current={p === page ? "page" : undefined}
								onClick={() => onPage(p)}
							>
								{p}
							</button>,
					)}
					<button
						type="button"
						className={classes.pageButton}
						disabled={page >= totalPages}
						onClick={() => onPage(page + 1)}
						aria-label="Next page"
					>
						<IconChevronRight size={16} />
					</button>
				</nav>
			)}
		</div>
	);
}

export function EmptyList({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
	return (
		<div className={classes.empty}>
			<div className={classes.emptyTitle}>{title}</div>
			{body && <div className={classes.emptyBody}>{body}</div>}
			{action && <div className={classes.emptyAction}>{action}</div>}
		</div>
	);
}

/** Shared sort choices; values are "field:order" */
export const sortValue = (sortBy: string, order: string) => `${sortBy}:${order}`;
export const splitSort = (value: string) => {
	const [sortBy, order] = value.split(":");
	return { sortBy, order };
};

export function formatDate(date?: string | Date | null) {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function timeAgo(date?: string | Date | null) {
	if (!date) return "";
	const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
	const units: [number, string][] = [
		[60 * 60 * 24 * 365, "year"],
		[60 * 60 * 24 * 30, "month"],
		[60 * 60 * 24 * 7, "week"],
		[60 * 60 * 24, "day"],
		[60 * 60, "hour"],
		[60, "minute"],
	];
	for (const [size, name] of units) {
		const n = Math.floor(Math.abs(seconds) / size);
		if (n >= 1) return seconds >= 0 ? `${n} ${name}${n > 1 ? "s" : ""} ago` : `in ${n} ${name}${n > 1 ? "s" : ""}`;
	}
	return "just now";
}
