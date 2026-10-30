"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	ActionIcon,
	Alert,
	Button,
	CopyButton,
	Drawer,
	Loader,
	Menu,
	TextInput,
	Textarea,
	Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	IconAlertCircle,
	IconAlertTriangle,
	IconArchive,
	IconArrowBackUp,
	IconArrowsSort,
	IconCheck,
	IconChevronDown,
	IconCopy,
	IconExternalLink,
	IconMail,
	IconMailOpened,
	IconMessageReply,
	IconSend,
	IconTrash,
} from "@tabler/icons-react";
import { deleteRemark, fetchRemarkById, replyToRemark, updateRemarkStatus } from "@/app/actions/remarks.actions";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import {
	ActiveFilters,
	EmptyList,
	FilterPill,
	ListFooter,
	PageHeader,
	RowActions,
	SearchPill,
	StatusBadge,
	StatusTabs,
	Toolbar,
	ToolbarRow,
	timeAgo,
	useListParams,
} from "./admin-ui";
import classes from "./RemarksManagement.module.css";

type RemarkStatus = "new" | "read" | "replied" | "archived";

interface Remark {
	id: number;
	name: string;
	email: string;
	content: string;
	response?: string | null;
	status: RemarkStatus;
	replyCount?: number;
	createdAt: string;
	updatedAt: string;
}

interface Reply {
	id: number;
	subject: string;
	body: string;
	status: "sent" | "failed";
	error?: string | null;
	sent_by?: string | null;
	createdAt: string;
}

type Mail = { configured: boolean; from: string | null };

const STATUS_LABELS: Record<RemarkStatus, string> = {
	new: "New",
	read: "Read",
	replied: "Replied",
	archived: "Archived",
};
const STATUS_TONE: Record<RemarkStatus, "good" | "warn" | "bad" | undefined> = {
	new: "warn",
	read: undefined,
	replied: "good",
	archived: undefined,
};
const SORTS = [
	{ value: "newest", label: "Newest first" },
	{ value: "oldest", label: "Oldest first" },
];
const DEFAULT_SUBJECT = "Re: Your message to TGA Global Law Group";

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
const fullDate = (date: string) =>
	new Date(date).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});

interface RemarksManagementProps {
	remarks: Remark[];
	statusCounts?: Record<RemarkStatus, number>;
	pagination?: { currentPage: number; totalPages: number; totalCount: number };
	mail?: Mail;
	error?: string | null;
	searchQuery: string;
	status: string;
	sort: string;
}

export default function RemarksManagement({
	remarks: initialRemarks,
	statusCounts,
	pagination,
	mail,
	error,
	searchQuery,
	status,
	sort,
}: RemarksManagementProps) {
	const router = useRouter();
	const { update, pending } = useListParams();
	const [remarks, setRemarks] = useState(initialRemarks);
	const [openId, setOpenId] = useState<number | null>(null);
	const [focusReply, setFocusReply] = useState(false);
	const [toDelete, setToDelete] = useState<Remark | null>(null);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => setRemarks(initialRemarks), [initialRemarks]);

	const counts = statusCounts && {
		inbox: statusCounts.new + statusCounts.read + statusCounts.replied,
		...statusCounts,
	};
	const filtered = Boolean(searchQuery || status);
	const open = remarks.find((r) => r.id === openId) ?? null;

	const patchLocal = (id: number, changes: Partial<Remark>) =>
		setRemarks((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));

	const setStatus = async (remark: Remark, next: RemarkStatus, quiet = false) => {
		if (remark.status === next) return;
		const previous = remark.status;
		patchLocal(remark.id, { status: next });
		const result = await updateRemarkStatus(remark.id, next);
		if (!result.success) {
			patchLocal(remark.id, { status: previous });
			notifications.show({ title: "Couldn't update", message: result.error, color: "red" });
			return;
		}
		if (!quiet)
			notifications.show({
				title: "Updated",
				message: `${remark.name} moved to “${STATUS_LABELS[next]}”`,
				color: "green",
			});
		router.refresh();
	};

	const openRemark = (remark: Remark, reply = false) => {
		setFocusReply(reply);
		setOpenId(remark.id);
		if (remark.status === "new") setStatus(remark, "read", true);
	};

	const confirmDelete = async () => {
		if (!toDelete) return;
		setDeleting(true);
		const result = await deleteRemark(toDelete.id);
		setDeleting(false);
		if (result.success) {
			setRemarks((prev) => prev.filter((r) => r.id !== toDelete.id));
			if (openId === toDelete.id) setOpenId(null);
			notifications.show({ title: "Deleted", message: `Message from ${toDelete.name} deleted`, color: "green" });
			router.refresh();
		} else {
			notifications.show({ title: "Couldn't delete", message: result.error, color: "red" });
		}
		setToDelete(null);
	};

	return (
		<div>
			<PageHeader
				eyebrow="Engagement"
				title="Remarks"
				description="Messages from the website's contact form. Open one to read it and reply by email."
			/>

			{mail && !mail.configured && (
				<Alert color="yellow" radius="lg" mb="md" icon={<IconAlertTriangle size={18} />}>
					Email isn't configured on the server, so replies can't be sent. Set SMTP_USER and SMTP_PASS for the backend.
				</Alert>
			)}

			<Toolbar>
				<StatusTabs
					value={status}
					options={[
						{ value: "", label: "Inbox", count: counts?.inbox },
						{ value: "new", label: "New", count: counts?.new },
						{ value: "read", label: "Read", count: counts?.read },
						{ value: "replied", label: "Replied", count: counts?.replied },
						{ value: "archived", label: "Archived", count: counts?.archived },
					]}
					onChange={(value) => update({ status: value })}
				/>
				<ToolbarRow>
					<SearchPill
						value={searchQuery}
						onSearch={(q) => update({ search: q })}
						placeholder="Search name, email or message"
						pending={pending}
					/>
					<FilterPill
						icon={<IconArrowsSort size={16} />}
						label="Sort"
						value={sort || "newest"}
						defaultValue="newest"
						options={SORTS}
						onChange={(value) => update({ sort: value === "newest" ? null : value })}
					/>
				</ToolbarRow>
				<ActiveFilters
					chips={[
						...(searchQuery ? [{ key: "q", label: `“${searchQuery}”`, onRemove: () => update({ search: null }) }] : []),
						...(status ?
							[{ key: "s", label: STATUS_LABELS[status as RemarkStatus] ?? status, onRemove: () => update({ status: null }) }]
						:	[]),
					]}
					onClear={() => update({ search: null, status: null })}
				/>
			</Toolbar>

			{error && (
				<Alert color="red" radius="lg" mb="md" icon={<IconAlertCircle size={18} />}>
					{error}
				</Alert>
			)}

			{remarks.length === 0 ?
				<EmptyList
					title={
						filtered ? "No messages match"
						: status === "" ?
							"Inbox zero"
						:	"No messages"
					}
					body={
						filtered ?
							"Try a different search or status."
						:	"Messages sent through the website's contact form will appear here."
					}
					action={
						filtered ?
							<Button variant="default" onClick={() => update({ search: null, status: null })}>
								Clear filters
							</Button>
						:	undefined
					}
				/>
			:	<>
					<div className={classes.inbox} data-pending={pending || undefined}>
						{remarks.map((remark) => (
							<div
								key={remark.id}
								className={classes.row}
								data-new={remark.status === "new" || undefined}
								role="button"
								tabIndex={0}
								aria-label={`Open message from ${remark.name}`}
								onClick={() => openRemark(remark)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && e.target === e.currentTarget) openRemark(remark);
								}}
							>
								<span className={classes.avatar}>{remark.name.charAt(0)}</span>
								<div className={classes.body}>
									<div className={classes.head}>
										<span className={classes.name}>{remark.name}</span>
										<span className={classes.email}>{remark.email}</span>
									</div>
									<div className={classes.excerpt}>{remark.content}</div>
									<div className={classes.meta}>
										<StatusBadge tone={STATUS_TONE[remark.status]}>{STATUS_LABELS[remark.status]}</StatusBadge>
										{(remark.replyCount ?? 0) > 0 && (
											<span>
												<IconMessageReply size={14} />
												{remark.replyCount} {remark.replyCount === 1 ? "reply" : "replies"}
											</span>
										)}
									</div>
								</div>
								<div className={classes.side} onClick={(e) => e.stopPropagation()}>
									<Tooltip label={fullDate(remark.createdAt)} withArrow>
										<span className={classes.time}>{timeAgo(remark.createdAt)}</span>
									</Tooltip>
									<div style={{ display: "flex", gap: 4 }}>
										<Button
											size="compact-sm"
											variant="default"
											className={classes.quickReply}
											leftSection={<IconArrowBackUp size={14} />}
											onClick={() => openRemark(remark, true)}
										>
											Reply
										</Button>
										<RowActions
											label={`message from ${remark.name}`}
											actions={[
												{ label: "Reply", icon: <IconArrowBackUp size={14} />, onClick: () => openRemark(remark, true) },
												remark.status === "new" ?
													{ label: "Mark as read", icon: <IconMailOpened size={14} />, onClick: () => setStatus(remark, "read") }
												:	{ label: "Mark as new", icon: <IconMail size={14} />, onClick: () => setStatus(remark, "new") },
												remark.status === "archived" ?
													{ label: "Move to inbox", icon: <IconMail size={14} />, onClick: () => setStatus(remark, "read") }
												:	{ label: "Archive", icon: <IconArchive size={14} />, onClick: () => setStatus(remark, "archived") },
												{
													label: "Delete",
													icon: <IconTrash size={14} />,
													danger: true,
													divider: true,
													onClick: () => setToDelete(remark),
												},
											]}
										/>
									</div>
								</div>
							</div>
						))}
					</div>
					<ListFooter
						page={pagination?.currentPage ?? 1}
						totalPages={pagination?.totalPages ?? 1}
						shown={remarks.length}
						total={pagination?.totalCount}
						noun={["message", "messages"]}
						onPage={(page) => update({ page: String(page) })}
					/>
				</>
			}

			<Drawer
				opened={Boolean(open)}
				onClose={() => setOpenId(null)}
				position="right"
				size={580}
				offset={12}
				radius="lg"
				withCloseButton={false}
				classNames={{ body: classes.drawerBody }}
				styles={{ content: { display: "flex", flexDirection: "column" } }}
			>
				{open && (
					<Conversation
						key={open.id}
						remark={open}
						mail={mail}
						focusReply={focusReply}
						onClose={() => setOpenId(null)}
						onStatus={(next) => setStatus(open, next)}
						onReplied={(count) => {
							patchLocal(open.id, { status: "replied", replyCount: count });
							router.refresh();
						}}
						onDelete={() => setToDelete(open)}
					/>
				)}
			</Drawer>

			<DeleteConfirmationModal
				opened={Boolean(toDelete)}
				onClose={() => setToDelete(null)}
				onConfirm={confirmDelete}
				loading={deleting}
				title="Delete message"
				message={
					toDelete ?
						`Delete the message from ${toDelete.name}${(toDelete.replyCount ?? 0) > 0 ? " and its reply history" : ""}? This can't be undone.`
					:	undefined
				}
			/>
		</div>
	);
}

/* ---------- conversation drawer ---------- */

function Conversation({
	remark,
	mail,
	focusReply,
	onClose,
	onStatus,
	onReplied,
	onDelete,
}: {
	remark: Remark;
	mail?: Mail;
	focusReply: boolean;
	onClose: () => void;
	onStatus: (status: RemarkStatus) => void;
	onReplied: (sentCount: number) => void;
	onDelete: () => void;
}) {
	const [replies, setReplies] = useState<Reply[] | null>(null);
	const [subject, setSubject] = useState(DEFAULT_SUBJECT);
	const [body, setBody] = useState("");
	const [sending, setSending] = useState(false);
	const bodyRef = useRef<HTMLTextAreaElement>(null);
	const threadRef = useRef<HTMLDivElement>(null);
	const canSend = mail?.configured !== false;

	useEffect(() => {
		let active = true;
		fetchRemarkById(remark.id).then((result) => {
			if (!active) return;
			const list: Reply[] = result.success ? (result.data.replies ?? []) : [];
			setReplies(list);
			const last = [...list].reverse().find((r) => r.status === "sent");
			if (last && last.subject !== "Reply") setSubject(last.subject);
			if (!result.success) notifications.show({ title: "Couldn't load replies", message: result.error, color: "red" });
		});
		return () => {
			active = false;
		};
	}, [remark.id]);

	useEffect(() => {
		if (focusReply) setTimeout(() => bodyRef.current?.focus(), 250);
	}, [focusReply]);

	useEffect(() => {
		threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
	}, [replies?.length]);

	const send = async () => {
		if (!subject.trim() || !body.trim() || sending) return;
		setSending(true);
		const result = await replyToRemark(remark.id, { subject: subject.trim(), response: body.trim() });
		setSending(false);
		const attempt: Reply | undefined = result.data?.reply;
		const next = attempt ? [...(replies ?? []), attempt] : (replies ?? []);
		setReplies(next);
		if (result.success) {
			setBody("");
			notifications.show({ title: "Reply sent", message: `Emailed to ${remark.email}`, color: "green" });
			onReplied(next.filter((r) => r.status === "sent").length);
		} else {
			notifications.show({ title: "Reply not sent", message: result.error, color: "red" });
		}
	};

	return (
		<>
			<div className={classes.drawerHead}>
				<span className={classes.avatar}>{remark.name.charAt(0)}</span>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div className={classes.drawerTitle}>{remark.name}</div>
					<div className={classes.drawerEmail}>
						{remark.email}
						<CopyButton value={remark.email}>
							{({ copied, copy }) => (
								<Tooltip label={copied ? "Copied" : "Copy email"} withArrow>
									<ActionIcon variant="subtle" color="gray" size="sm" onClick={copy} aria-label="Copy email">
										{copied ?
											<IconCheck size={14} />
										:	<IconCopy size={14} />}
									</ActionIcon>
								</Tooltip>
							)}
						</CopyButton>
					</div>
				</div>
				<ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close">
					<span aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>
						×
					</span>
				</ActionIcon>
			</div>

			<div className={classes.drawerTools}>
				<Menu position="bottom-start" radius="md" shadow="md">
					<Menu.Target>
						<Button variant="default" size="xs" rightSection={<IconChevronDown size={14} />}>
							{STATUS_LABELS[remark.status]}
						</Button>
					</Menu.Target>
					<Menu.Dropdown>
						{(Object.keys(STATUS_LABELS) as RemarkStatus[]).map((s) => (
							<Menu.Item
								key={s}
								onClick={() => onStatus(s)}
								rightSection={s === remark.status ? <IconCheck size={14} /> : null}
							>
								{STATUS_LABELS[s]}
							</Menu.Item>
						))}
					</Menu.Dropdown>
				</Menu>
				<Button
					variant="default"
					size="xs"
					component="a"
					href={`mailto:${remark.email}?subject=${encodeURIComponent(subject)}`}
					leftSection={<IconExternalLink size={14} />}
				>
					Open in mail app
				</Button>
				<div style={{ flex: 1 }} />
				<Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={14} />} onClick={onDelete}>
					Delete
				</Button>
			</div>

			<div className={classes.thread} ref={threadRef}>
				<div className={classes.message}>
					<div className={classes.messageHead}>
						<span className={classes.messageAuthor}>{remark.name}</span>
						<span>{fullDate(remark.createdAt)}</span>
					</div>
					<div className={classes.messageText}>{remark.content}</div>
				</div>

				{replies === null ?
					<Loader size="sm" style={{ alignSelf: "center" }} />
				:	replies.map((reply) => (
						<div
							key={reply.id}
							className={classes.message}
							data-mine
							data-failed={reply.status === "failed" || undefined}
						>
							<div className={classes.messageHead}>
								<span className={classes.messageAuthor}>{reply.sent_by || "TGA"}</span>
								<span>{fullDate(reply.createdAt)}</span>
							</div>
							{reply.subject !== "Reply" && <div className={classes.messageSubject}>{reply.subject}</div>}
							<div className={classes.messageText}>{reply.body}</div>
							{reply.status === "failed" && (
								<div className={classes.messageError}>
									<IconAlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
									<span>
										Not delivered{reply.error ? `: ${reply.error}` : ""}.{" "}
										<button
											type="button"
											onClick={() => {
												setSubject(reply.subject);
												setBody(reply.body);
												bodyRef.current?.focus();
											}}
											style={{
												border: 0,
												padding: 0,
												background: "none",
												color: "inherit",
												font: "inherit",
												textDecoration: "underline",
												cursor: "pointer",
											}}
										>
											Try again
										</button>
									</span>
								</div>
							)}
						</div>
					))
				}
			</div>

			<div className={classes.composer}>
				{canSend ?
					<>
						<TextInput
							size="sm"
							value={subject}
							onChange={(e) => setSubject(e.currentTarget.value)}
							aria-label="Subject"
							placeholder="Subject"
							mb="xs"
						/>
						<Textarea
							ref={bodyRef}
							autosize
							minRows={4}
							maxRows={12}
							value={body}
							onChange={(e) => setBody(e.currentTarget.value)}
							onKeyDown={(e) => {
								if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
							}}
							aria-label="Reply"
							placeholder={`Write your reply to ${firstName(remark.name)}…`}
						/>
						<div className={classes.composerFoot}>
							<span>
								Sent from {mail?.from ?? "the configured email account"} · their message is quoted below your reply
							</span>
							<Button
								onClick={send}
								loading={sending}
								disabled={!subject.trim() || !body.trim()}
								leftSection={<IconSend size={16} />}
							>
								Send reply
							</Button>
						</div>
					</>
				:	<div className={classes.notice}>
						<IconAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
						Email isn't configured on the server, so replies can't be sent from here. Use “Open in mail app” instead.
					</div>
				}
			</div>
		</>
	);
}
