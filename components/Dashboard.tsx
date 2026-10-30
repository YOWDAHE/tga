"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Alert, Button, Tooltip } from "@mantine/core";
import {
	IconAlertCircle,
	IconArchive,
	IconArrowDownRight,
	IconArrowRight,
	IconArrowUpRight,
	IconCategory,
	IconFileText,
	IconFlag,
	IconMailQuestion,
	IconMessage,
	IconMinus,
	IconNews,
	IconPencil,
	IconPlus,
	IconUpload,
	IconUser,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, StatusBadge, formatDate, timeAgo } from "./admin-ui";
import classes from "./Dashboard.module.css";

type Totals = { total: number; last30: number; prev30: number; views: number };

interface Overview {
	news: Totals;
	documents: Totals;
	legal: { published: number; drafts: number; last30: number };
	subscribers: { active: number; pending: number };
	comments: { total: number; flagged: number };
	remarks: number;
	categories: number;
	landingViews: number;
	weekly: { start: string; news: number; documents: number; legal: number }[];
	topNews: { id: number; title: string; views: number; published_date: string | null }[];
	recentNews: {
		id: number;
		title: string;
		createdAt: string;
		published_date: string | null;
		category: string | null;
		created_by: string | null;
	}[];
	recentLegal: { id: number; title: string; published: boolean; content_type: string; updatedAt: string }[];
}

interface RecentActivity {
	id: number;
	type: "news" | "archive" | "category";
	title: string;
	description: string;
	time: string;
	user: string;
}

interface DashboardData {
	overview?: Overview;
	recentActivity: RecentActivity[];
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
	alert: "Client Alert",
	analysis: "Analysis",
	guide: "Guide",
	update: "Legal Update",
};

const SERIES = [
	{ key: "news", label: "News", noun: ["article", "articles"] },
	{ key: "documents", label: "Documents", noun: ["document", "documents"] },
	{ key: "legal", label: "Legal", noun: ["update", "updates"] },
] as const;
type SeriesKey = (typeof SERIES)[number]["key"];

const plural = (n: number, [one, many]: readonly [string, string]) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

function greeting(date: Date) {
	const hour = date.getHours();
	return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function niceMax(value: number) {
	if (value <= 4) return 4;
	const step = value <= 10 ? 2 : value <= 25 ? 5 : value <= 50 ? 10 : 20;
	return Math.ceil(value / step) * step;
}

const shortDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function CardHeader({ title, subtitle, href, action }: { title: string; subtitle?: string; href?: string; action?: ReactNode }) {
	return (
		<div className={classes.cardHeader}>
			<div style={{ minWidth: 0 }}>
				<div className={classes.cardTitle}>{title}</div>
				{subtitle && <div className={classes.cardSubtitle}>{subtitle}</div>}
			</div>
			{action}
			{href && (
				<Link href={href} className={classes.viewAll}>
					View all <IconArrowRight size={14} />
				</Link>
			)}
		</div>
	);
}

function StatTile({
	label,
	value,
	delta,
	sub,
	href,
}: {
	label: string;
	value: number;
	delta?: number;
	sub?: string;
	href?: string;
}) {
	const dir = delta === undefined ? undefined : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
	const body = (
		<>
			<div className={classes.statLabel}>{label}</div>
			<div className={classes.statValue}>{value.toLocaleString()}</div>
			<div className={classes.statMeta}>
				{dir && (
					<span className={classes.delta} data-dir={dir}>
						{dir === "up" ?
							<IconArrowUpRight size={12} />
						: dir === "down" ?
							<IconArrowDownRight size={12} />
						:	<IconMinus size={12} />}
						{delta! > 0 ? "+" : ""}
						{delta}
					</span>
				)}
				{sub && <span>{sub}</span>}
			</div>
		</>
	);
	return href ?
			<Link href={href} className={classes.stat}>
				{body}
			</Link>
		:	<div className={classes.stat}>{body}</div>;
}

function WeeklyChart({ weeks, series }: { weeks: Overview["weekly"]; series: (typeof SERIES)[number] }) {
	const height = 180;
	const values = weeks.map((w) => Number(w[series.key]) || 0);
	const max = niceMax(Math.max(0, ...values));
	const ticks = [0, max / 2, max];
	const peak = values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
	const last = values.length - 1;

	return (
		<figure style={{ margin: 0 }}>
			<div className={classes.chart} style={{ height }}>
				<div className={classes.yAxis} style={{ height }}>
					{ticks.map((t) => (
						<span key={t} className={classes.yTick} style={{ top: height - (t / max) * height }}>
							{t}
						</span>
					))}
				</div>
				<div className={classes.plot}>
					{ticks.map((t) => (
						<span
							key={t}
							className={classes.gridLine}
							data-base={t === 0 || undefined}
							style={{ top: height - (t / max) * height }}
							aria-hidden
						/>
					))}
					<div className={classes.columns} style={{ height }}>
						{weeks.map((week, i) => {
							const v = values[i];
							const h = (v / max) * height;
							const end = new Date(`${week.start}T00:00:00`);
							end.setDate(end.getDate() + 6);
							const range = `${shortDate(week.start)} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
							return (
								<Tooltip key={week.start} label={`${range}: ${plural(v, series.noun)}`} withArrow radius="md">
									<button type="button" className={classes.column} aria-label={`${range}: ${plural(v, series.noun)}`}>
										<span className={classes.bar} style={{ height: v ? Math.max(3, h) : 0 }} />
										{(i === last || i === peak) && v > 0 && (
											<span className={classes.barLabel} style={{ bottom: h + 4 }}>
												{v}
											</span>
										)}
									</button>
								</Tooltip>
							);
						})}
					</div>
				</div>
			</div>
			<div className={classes.xAxis} style={{ paddingLeft: 30 }}>
				{weeks.map((w, i) => (
					<span key={w.start}>{i % 3 === 0 || i === last ? shortDate(w.start) : ""}</span>
				))}
			</div>
		</figure>
	);
}

const activityVerb: Record<string, string> = { INSERT: "Added", UPDATE: "Updated", DELETE: "Deleted" };

export default function Dashboard({ initialData }: { initialData?: DashboardData | null }) {
	const { user, hasPermission } = useAuth();
	const [seriesKey, setSeriesKey] = useState<SeriesKey>("news");
	const o = initialData?.overview;
	const now = new Date();

	if (!o) {
		return (
			<div className={classes.page}>
				<PageHeader eyebrow={now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} title="Overview" />
				<Alert color="red" radius="lg" icon={<IconAlertCircle size={18} />}>
					The dashboard data could not be loaded. Check that the API is running and try again.
				</Alert>
			</div>
		);
	}

	const series = SERIES.find((s) => s.key === seriesKey)!;
	const weeklyTotal = o.weekly.reduce((sum, w) => sum + (Number(w[seriesKey]) || 0), 0);
	const topMax = Math.max(1, ...o.topNews.map((n) => n.views));

	const attention = [
		{
			label: "Flagged comments",
			hint: "Reported by readers on news articles",
			count: o.comments.flagged,
			icon: <IconFlag size={16} />,
			tone: o.comments.flagged ? "bad" : undefined,
		},
		{
			label: "Draft legal updates",
			hint: "Not yet visible or emailed",
			count: o.legal.drafts,
			icon: <IconPencil size={16} />,
			tone: o.legal.drafts ? "warn" : undefined,
			href: "/legal-updates?status=draft",
		},
		{
			label: "Unconfirmed subscribers",
			hint: "Waiting to confirm their email",
			count: o.subscribers.pending,
			icon: <IconMailQuestion size={16} />,
			href: "/legal-updates?tab=subscribers",
		},
		{
			label: "Remarks",
			hint: "Unread messages from the contact form",
			count: o.remarks,
			icon: <IconMessage size={16} />,
			href: "/remarks?status=new",
		},
	];
	const pendingCount = o.comments.flagged + o.legal.drafts;

	return (
		<div className={classes.page}>
			<PageHeader
				eyebrow={now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
				title={`${greeting(now)}, ${user?.username ?? "there"}`}
				description={
					pendingCount ?
						[
							o.comments.flagged && `${plural(o.comments.flagged, ["flagged comment", "flagged comments"])} to review`,
							o.legal.drafts && `${plural(o.legal.drafts, ["legal update", "legal updates"])} still in draft`,
						]
							.filter(Boolean)
							.join(" · ") + "."
					:	"Everything is published and nothing is waiting for review."
				}
				actions={
					<>
						{hasPermission("ARCHIVES_CRUD") && (
							<Button component={Link} href="/archives/uploads" variant="default" leftSection={<IconUpload size={16} />}>
								Upload document
							</Button>
						)}
						{hasPermission("NEWS_CRUD") && (
							<Button component={Link} href="/news/add" leftSection={<IconPlus size={16} />}>
								New article
							</Button>
						)}
					</>
				}
			/>

			<div className={classes.statGrid}>
				<StatTile
					label="News articles"
					value={o.news.total}
					delta={o.news.last30 - o.news.prev30}
					sub="vs previous 30 days"
					href="/news"
				/>
				<StatTile
					label="Archive documents"
					value={o.documents.total}
					delta={o.documents.last30 - o.documents.prev30}
					sub="vs previous 30 days"
					href="/archives"
				/>
				<StatTile
					label="Legal updates"
					value={o.legal.published}
					sub={`published · ${plural(o.legal.drafts, ["draft", "drafts"])}`}
					href="/legal-updates"
				/>
				<StatTile
					label="Subscribers"
					value={o.subscribers.active}
					sub={o.subscribers.pending ? `${o.subscribers.pending} awaiting confirmation` : "all confirmed"}
					href="/legal-updates?tab=subscribers"
				/>
			</div>

			<div className={`${classes.row} ${classes.rowWide}`}>
				<div className={classes.card}>
					<CardHeader
						title="Added per week"
						subtitle={`${plural(weeklyTotal, series.noun)} in the last 12 weeks`}
						action={
							<div className={classes.segment} role="tablist" aria-label="Chart series">
								{SERIES.map((s) => (
									<button
										key={s.key}
										type="button"
										role="tab"
										aria-selected={s.key === seriesKey}
										className={classes.segmentButton}
										data-active={s.key === seriesKey || undefined}
										onClick={() => setSeriesKey(s.key)}
									>
										{s.label}
									</button>
								))}
							</div>
						}
					/>
					<WeeklyChart weeks={o.weekly} series={series} />
				</div>

				<div className={classes.card}>
					<CardHeader title="Needs attention" subtitle="Items waiting on someone" />
					<div className={classes.attention}>
						{attention.map((a) => {
							const body = (
								<>
									<span className={classes.attentionIcon} data-tone={a.tone}>
										{a.icon}
									</span>
									<span className={classes.attentionText}>
										<div className={classes.attentionLabel}>{a.label}</div>
										<div className={classes.attentionHint}>{a.hint}</div>
									</span>
									<span className={classes.attentionCount}>{a.count}</span>
								</>
							);
							return a.href ?
									<Link key={a.label} href={a.href} className={classes.attentionRow}>
										{body}
									</Link>
								:	<div key={a.label} className={classes.attentionRow}>
										{body}
									</div>;
						})}
					</div>
				</div>
			</div>

			<div className={`${classes.row} ${classes.rowHalf}`}>
				<div className={classes.card}>
					<CardHeader
						title="Most read articles"
						subtitle={`${o.news.views.toLocaleString()} article views · ${o.documents.views.toLocaleString()} document views`}
						href="/news"
					/>
					{o.topNews.length ?
						<div className={classes.barList}>
							{o.topNews.map((n) => (
								<Link key={n.id} href={`/news/${n.id}`} className={classes.barItem}>
									<div className={classes.barItemHead}>
										<span className={classes.barItemTitle}>{n.title}</span>
										<span className={classes.barItemValue}>{n.views.toLocaleString()}</span>
									</div>
									<div className={classes.track}>
										<div className={classes.fill} style={{ width: `${(n.views / topMax) * 100}%` }} />
									</div>
								</Link>
							))}
						</div>
					:	<p className={classes.emptyNote}>No articles yet.</p>}
				</div>

				<div className={classes.card}>
					<CardHeader title="Latest articles" subtitle={`${plural(o.news.last30, ["article", "articles"])} in the last 30 days`} href="/news" />
					{o.recentNews.length ?
						<div className={classes.list}>
							{o.recentNews.map((n) => (
								<Link key={n.id} href={`/news/${n.id}`} className={classes.listItem}>
									<span className={classes.activityIcon}>
										<IconNews size={15} />
									</span>
									<span className={classes.listText}>
										<span className={classes.listTitle}>{n.title}</span>
										<span className={classes.listMeta}>
											{[n.category, n.created_by, formatDate(n.published_date ?? n.createdAt)].filter(Boolean).join(" · ")}
										</span>
									</span>
								</Link>
							))}
						</div>
					:	<p className={classes.emptyNote}>No articles yet.</p>}
				</div>
			</div>

			<div className={`${classes.row} ${classes.rowHalf}`}>
				<div className={classes.card}>
					<CardHeader title="Recent activity" subtitle="Changes made in the admin" />
					{initialData.recentActivity.length ?
						<div className={classes.list}>
							{initialData.recentActivity.slice(0, 6).map((a) => {
								const [action] = a.title.split(" ");
								const Icon =
									a.type === "news" ? IconNews
									: a.type === "archive" ? IconArchive
									: IconCategory;
								return (
									<div key={a.id} className={classes.listItem}>
										<span className={classes.activityIcon}>
											<Icon size={15} />
										</span>
										<span className={classes.listText}>
											<span className={classes.listTitle}>{a.description || `${activityVerb[action] ?? action} ${a.type}`}</span>
											<span className={classes.listMeta}>
												<IconUser size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
												{a.user} · {a.time}
											</span>
										</span>
									</div>
								);
							})}
						</div>
					:	<p className={classes.emptyNote}>No changes recorded yet.</p>}
				</div>

				<div className={classes.card}>
					<CardHeader
						title="Legal updates"
						subtitle={`${plural(o.legal.last30, ["update", "updates"])} published in the last 30 days`}
						href="/legal-updates"
					/>
					{o.recentLegal.length ?
						<div className={classes.list}>
							{o.recentLegal.map((l) => (
								<Link key={l.id} href={`/legal-updates/${l.id}`} className={classes.listItem}>
									<span className={classes.activityIcon}>
										<IconFileText size={15} />
									</span>
									<span className={classes.listText}>
										<span className={classes.listTitle}>{l.title}</span>
										<span className={classes.listMeta}>
											{CONTENT_TYPE_LABELS[l.content_type] ?? l.content_type} · edited {timeAgo(l.updatedAt)}
										</span>
									</span>
									<StatusBadge tone={l.published ? "good" : undefined}>{l.published ? "Live" : "Draft"}</StatusBadge>
								</Link>
							))}
						</div>
					:	<p className={classes.emptyNote}>No legal updates yet.</p>}
				</div>
			</div>
		</div>
	);
}
