"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Group, Loader, Modal, Text, Textarea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
	IconEdit,
	IconEye,
	IconEyeOff,
	IconFlag,
	IconFlagOff,
	IconThumbDown,
	IconThumbUp,
	IconTrash,
} from "@tabler/icons-react";
import { commentService, type Comment } from "@/lib/commentService";
import { convertToApiUrl } from "@/lib/utils";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { RowActions, StatusBadge, StatusTabs, formatDate, listClasses, timeAgo } from "./admin-ui";
import { Chips, EditorFrame, Facts, SideCard, Workspace, editorClasses as classes, splitList, textStats } from "./editor";

interface NewsItem {
	id: number;
	title: string;
	content: string;
	visual_content?: Array<string | { secure_url: string; public_id?: string }> | null;
	hashtags?: string;
	seo_keywords?: string;
	category_id?: number | null;
	category?: { id: number; name: string; description: string | null } | null;
	source?: string;
	published_date?: string;
	created_by?: string;
	view_count?: number;
	createdAt: string;
	updatedAt?: string;
	featured?: boolean;
	read_minutes?: number;
}

interface NewsDetailsProps {
	news: NewsItem;
}

type Moderation = "flag" | "unflag" | "hide" | "show";
type Filter = "" | "visible" | "hidden" | "flagged";

const imageSrc = (img: string | { secure_url: string }) =>
	convertToApiUrl(typeof img === "string" ? img : img.secure_url) ?? "";

export default function NewsDetails({ news }: NewsDetailsProps) {
	const images = (news.visual_content ?? []).map(imageSrc).filter(Boolean);
	const [activeImage, setActiveImage] = useState(0);
	const hashtags = splitList(news.hashtags);
	const keywords = splitList(news.seo_keywords);
	const minutes = news.read_minutes || textStats(news.content).minutes;

	return (
		<EditorFrame
			back={{ href: "/news", label: "News" }}
			actions={
				<Button component={Link} href={`/news/add?edit=${news.id}`} leftSection={<IconEdit size={16} />}>
					Edit
				</Button>
			}
		>
			<Workspace
				main={
					<>
						<article className={classes.article}>
							<div className={classes.articleInner}>
								<div className={classes.eyebrow}>{news.category?.name ?? "News"}</div>
								<h1 className={classes.articleTitle}>{news.title}</h1>
								<div className={classes.articleMeta}>
									{news.created_by && <span>{news.created_by}</span>}
									<span>{formatDate(news.published_date ?? news.createdAt)}</span>
									{minutes > 0 && <span>{minutes} min read</span>}
								</div>

								{images.length > 0 && (
									<>
										<div className={classes.hero}>
											<img src={images[activeImage] ?? images[0]} alt="" />
										</div>
										{images.length > 1 && (
											<div className={classes.heroStrip}>
												{images.map((src, i) => (
													<button
														key={src}
														type="button"
														aria-label={`Show image ${i + 1}`}
														data-active={i === activeImage || undefined}
														onClick={() => setActiveImage(i)}
													>
														<img src={src} alt="" />
													</button>
												))}
											</div>
										)}
									</>
								)}

								<div className={classes.articleRule} />
								{news.content ?
									<div
										className={`rich-text-content ${classes.articleBody}`}
										dangerouslySetInnerHTML={{ __html: news.content }}
									/>
								:	<p className={classes.empty}>No content yet.</p>}
							</div>
						</article>

						<Comments newsId={news.id} author={news.created_by} />
					</>
				}
				aside={
					<>
						<SideCard title="Overview">
							<Facts
								items={[
									{ label: "Views", value: (news.view_count ?? 0).toLocaleString() },
									{
										label: "Featured",
										value: news.featured ? <StatusBadge tone="good">Featured</StatusBadge> : "No",
									},
									{ label: "Category", value: news.category?.name ?? "—" },
									{ label: "Author", value: news.created_by || "—" },
									{ label: "Source", value: news.source || "—" },
									{ label: "Published", value: formatDate(news.published_date) },
									{ label: "Created", value: formatDate(news.createdAt) },
									Boolean(news.updatedAt) && { label: "Last edited", value: formatDate(news.updatedAt) },
								]}
							/>
						</SideCard>

						<SideCard title="Hashtags">
							{hashtags.length ? <Chips items={hashtags} /> : <p className={classes.prose}>None</p>}
						</SideCard>

						<SideCard title="Search keywords" hint="Used by search engines; not shown on the article.">
							{keywords.length ? <Chips items={keywords} /> : <p className={classes.prose}>None</p>}
						</SideCard>
					</>
				}
			/>
		</EditorFrame>
	);
}

/* ---------- comment moderation ---------- */

function Comments({ newsId, author }: { newsId: number; author?: string }) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<Filter>("");
	const [draft, setDraft] = useState("");
	const [posting, setPosting] = useState(false);
	const [pending, setPending] = useState<{ comment: Comment; action: Moderation } | null>(null);
	const [reason, setReason] = useState("");
	const [reasonOpened, { open: openReason, close: closeReason }] = useDisclosure(false);
	const [deleting, setDeleting] = useState<Comment | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let active = true;
		commentService.getCommentsByNewsId(newsId).then((result) => {
			if (!active) return;
			if (result.success && result.data) setComments(result.data);
			else notifications.show({ title: "Error", message: result.error || "Failed to fetch comments", color: "red" });
			setLoading(false);
		});
		return () => {
			active = false;
		};
	}, [newsId]);

	const counts = {
		all: comments.length,
		visible: comments.filter((c) => c.visible).length,
		hidden: comments.filter((c) => !c.visible).length,
		flagged: comments.filter((c) => c.flagged).length,
	};
	const shown = comments.filter((c) =>
		filter === "visible" ? c.visible
		: filter === "hidden" ? !c.visible
		: filter === "flagged" ? c.flagged
		: true,
	);

	const post = async () => {
		if (!draft.trim()) return;
		setPosting(true);
		const result = await commentService.createComment({
			news_id: newsId,
			user_name: author || "Admin",
			content: draft.trim(),
		});
		setPosting(false);
		if (result.success && result.data) {
			setComments((prev) => [result.data!, ...prev]);
			setDraft("");
		} else {
			notifications.show({ title: "Error", message: result.error || "Failed to add comment", color: "red" });
		}
	};

	const run = async (comment: Comment, action: Moderation, why = "") => {
		setBusy(true);
		const result =
			action === "flag" || action === "unflag" ?
				await commentService.toggleCommentFlag(comment.id, why)
			:	await commentService.toggleCommentVisibility(comment.id, why);
		setBusy(false);
		if (result.success && result.data) {
			setComments((prev) => prev.map((c) => (c.id === comment.id ? result.data! : c)));
			const done = { flag: "flagged", unflag: "unflagged", hide: "hidden", show: "shown again" }[action];
			notifications.show({ title: "Comment updated", message: `Comment ${done}`, color: "green" });
		} else {
			notifications.show({ title: "Error", message: result.error || "Failed to update comment", color: "red" });
		}
	};

	// Flagging and hiding ask for an optional reason; undoing them doesn't
	const moderate = (comment: Comment, action: Moderation) => {
		if (action === "flag" || action === "hide") {
			setPending({ comment, action });
			setReason("");
			openReason();
		} else {
			run(comment, action);
		}
	};

	const confirmDelete = async () => {
		if (!deleting) return;
		setBusy(true);
		const result = await commentService.deleteComment(deleting.id);
		setBusy(false);
		if (result.success) {
			setComments((prev) => prev.filter((c) => c.id !== deleting.id));
			notifications.show({ title: "Deleted", message: "Comment deleted", color: "green" });
		} else {
			notifications.show({ title: "Error", message: result.error || "Failed to delete comment", color: "red" });
		}
		setDeleting(null);
	};

	return (
		<section className={classes.section} id="comments">
			<div className={classes.sectionHeader}>
				<div className={classes.sectionTitle}>Comments</div>
				<StatusTabs
					value={filter}
					onChange={(v) => setFilter(v as Filter)}
					options={[
						{ value: "", label: "All", count: counts.all },
						{ value: "visible", label: "Visible", count: counts.visible },
						{ value: "hidden", label: "Hidden", count: counts.hidden },
						{ value: "flagged", label: "Flagged", count: counts.flagged },
					]}
				/>
			</div>

			<div className={classes.composer}>
				<textarea
					rows={1}
					value={draft}
					placeholder={`Reply as ${author || "Admin"}…`}
					aria-label="New comment"
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if ((e.metaKey || e.ctrlKey) && e.key === "Enter") post();
					}}
				/>
				<Button size="sm" onClick={post} loading={posting} disabled={!draft.trim()}>
					Post
				</Button>
			</div>

			{loading ?
				<Group justify="center" py="xl">
					<Loader size="sm" />
				</Group>
			: shown.length === 0 ?
				<Text c="dimmed" size="sm" ta="center" py="xl">
					{comments.length === 0 ? "No comments yet. Reader comments from the website appear here." : "No comments here."}
				</Text>
			:	<div className={classes.comments}>
					{shown.map((comment) => (
						<div key={comment.id} className={classes.comment} data-muted={!comment.visible || undefined}>
							<span className={listClasses.avatar}>{comment.user_name.charAt(0)}</span>
							<div className={classes.commentBody}>
								<div className={classes.commentHead}>
									<span className={classes.commentName}>{comment.user_name}</span>
									<span className={classes.commentTime}>
										{timeAgo(comment.createdAt)}
										{comment.edited ? " · edited" : ""}
									</span>
									{comment.flagged && <StatusBadge tone="bad">Flagged</StatusBadge>}
									{!comment.visible && <StatusBadge tone="warn">Hidden</StatusBadge>}
								</div>
								<div className={classes.commentText}>{comment.content}</div>
								<div className={classes.commentFoot}>
									<span>
										<IconThumbUp size={14} /> {comment.likes_count}
									</span>
									<span>
										<IconThumbDown size={14} /> {comment.dislikes_count}
									</span>
									{comment.flagged_reason && <span className={classes.reason}>“{comment.flagged_reason}”</span>}
								</div>
							</div>
							<RowActions
								label={`comment by ${comment.user_name}`}
								actions={[
									comment.visible ?
										{ label: "Hide", icon: <IconEyeOff size={14} />, onClick: () => moderate(comment, "hide") }
									:	{ label: "Show", icon: <IconEye size={14} />, onClick: () => moderate(comment, "show") },
									comment.flagged ?
										{ label: "Remove flag", icon: <IconFlagOff size={14} />, onClick: () => moderate(comment, "unflag") }
									:	{ label: "Flag", icon: <IconFlag size={14} />, onClick: () => moderate(comment, "flag") },
									{
										label: "Delete",
										icon: <IconTrash size={14} />,
										danger: true,
										divider: true,
										onClick: () => setDeleting(comment),
									},
								]}
							/>
						</div>
					))}
				</div>
			}

			<Modal
				opened={reasonOpened}
				onClose={closeReason}
				title={pending?.action === "flag" ? "Flag comment" : "Hide comment"}
				centered
				radius="lg"
			>
				{pending && (
					<Text size="sm" c="dimmed" mb="md" lineClamp={3}>
						“{pending.comment.content}” — {pending.comment.user_name}
					</Text>
				)}
				<Textarea
					label="Reason"
					description="Optional, for other admins"
					autosize
					minRows={2}
					value={reason}
					onChange={(e) => setReason(e.currentTarget.value)}
				/>
				<Group justify="flex-end" mt="lg">
					<Button variant="default" onClick={closeReason}>
						Cancel
					</Button>
					<Button
						loading={busy}
						color={pending?.action === "flag" ? "red" : undefined}
						onClick={async () => {
							if (pending) await run(pending.comment, pending.action, reason);
							closeReason();
						}}
					>
						{pending?.action === "flag" ? "Flag" : "Hide"}
					</Button>
				</Group>
			</Modal>

			<DeleteConfirmationModal
				opened={Boolean(deleting)}
				onClose={() => setDeleting(null)}
				onConfirm={confirmDelete}
				loading={busy}
				title="Delete comment"
				itemName={deleting ? `comment by ${deleting.user_name}` : undefined}
				itemType="comment"
			/>
		</section>
	);
}
