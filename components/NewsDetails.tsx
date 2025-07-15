"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	commentService,
	type Comment,
} from "@/lib/commentService";
import CommentLikeDisplay from "./CommentLikeDisplay";
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
	TextInput,
	Select,
	Card,
	Avatar,
	Divider,
	Image,
	SimpleGrid,
	Loader,
	Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
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
	IconHash,
	IconStar,
} from "@tabler/icons-react";

interface NewsItem {
	id: number;
	title: string;
	content: string;
	visual_content?: (string | { public_id: string; secure_url: string })[] | null;
	hashtags?: string;
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

export default function NewsDetails({ news }: NewsDetailsProps) {
	const router = useRouter();
	const [comments, setComments] = useState<Comment[]>([]);
	const [loading, setLoading] = useState(true);
	const [newComment, setNewComment] = useState({ content: "" });
	const [submitting, setSubmitting] = useState(false);
	const [actionModalOpened, { open: openActionModal, close: closeActionModal }] =
		useDisclosure(false);
	const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
		useDisclosure(false);
	const [actioningComment, setActioningComment] = useState<Comment | null>(null);
	const [actionType, setActionType] = useState<
		"flag" | "unflag" | "hide" | "show"
	>("flag");
	const [actionReason, setActionReason] = useState("");
	const [deletingComment, setDeletingComment] = useState<Comment | null>(null);
	// Add state to track loaded images
	const [loadedImages, setLoadedImages] = useState<{ [key: number]: boolean }>(
		{}
	);

	// Fetch comments on component mount
	useEffect(() => {
		const fetchComments = async () => {
			try {
				setLoading(true);
				// Admin view - no username needed for like status
				const result = await commentService.getCommentsByNewsId(news.id);
				if (result.success && result.data) {
					setComments(result.data);
				} else {
					notifications.show({
						title: "Error",
						message: result.error || "Failed to fetch comments",
						color: "red",
					});
				}
			} catch (error) {
				console.error("Error fetching comments:", error);
				notifications.show({
					title: "Error",
					message: "Failed to fetch comments",
					color: "red",
				});
			} finally {
				setLoading(false);
			}
		};

		fetchComments();
	}, [news.id]);

	// Handle comment submission
	const handleSubmitComment = async () => {
		if (!newComment.content.trim()) {
			notifications.show({
				title: "Error",
				message: "Please enter a comment",
				color: "red",
			});
			return;
		}

		try {
			setSubmitting(true);
			const result = await commentService.createComment({
				news_id: news.id,
				user_name: news.created_by || "Admin", // Use the current user/author
				content: newComment.content.trim(),
			});

			if (result.success && result.data) {
				setComments((prev) => [result.data!, ...prev]);
				setNewComment({ content: "" });
				notifications.show({
					title: "Success",
					message: "Comment added successfully",
					color: "green",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to add comment",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error creating comment:", error);
			notifications.show({
				title: "Error",
				message: "Failed to add comment",
				color: "red",
			});
		} finally {
			setSubmitting(false);
		}
	};

	// Helper function to get image URL from either string or object
	const getImageUrl = (
		imageData: string | { public_id: string; secure_url: string }
	): string => {
		if (typeof imageData === "string") {
			return imageData;
		}
		return imageData.secure_url;
	};

	const handleCommentAction = (
		comment: Comment,
		action: "flag" | "unflag" | "hide" | "show"
	) => {
		setActioningComment(comment);
		setActionType(action);
		setActionReason("");
		openActionModal();
	};

	const handleDeleteComment = (comment: Comment) => {
		setDeletingComment(comment);
		openDeleteModal();
	};

	const handleSubmitAction = async () => {
		if (!actioningComment) return;

		try {
			let result;
			switch (actionType) {
				case "flag":
				case "unflag":
					result = await commentService.toggleCommentFlag(actioningComment.id, actionReason);
					break;
				case "hide":
				case "show":
					result = await commentService.toggleCommentVisibility(actioningComment.id, actionReason);
					break;
				default:
					return;
			}

			if (result.success && result.data) {
				setComments((prev) =>
					prev.map((comment) => 
						comment.id === actioningComment.id ? result.data! : comment
					)
				);

				notifications.show({
					title: "Success",
					message: result.data.flagged !== actioningComment.flagged 
						? `Comment ${result.data.flagged ? 'flagged' : 'unflagged'} successfully`
						: `Comment ${result.data.visible ? 'shown' : 'hidden'} successfully`,
					color: "green",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update comment",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error updating comment:", error);
			notifications.show({
				title: "Error",
				message: "Failed to update comment",
				color: "red",
			});
		}

		closeActionModal();
		setActioningComment(null);
		setActionReason("");
	};

	const handleConfirmDelete = async () => {
		if (!deletingComment) return;

		try {
			const result = await commentService.deleteComment(deletingComment.id);

			if (result.success) {
				setComments((prev) =>
					prev.filter((comment) => comment.id !== deletingComment.id)
				);

				notifications.show({
					title: "Success",
					message: "Comment deleted successfully",
					color: "red",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to delete comment",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error deleting comment:", error);
			notifications.show({
				title: "Error",
				message: "Failed to delete comment",
				color: "red",
			});
		}

		closeDeleteModal();
		setDeletingComment(null);
	};

	const getStatusBadge = (comment: Comment) => {
		if (comment.flagged) {
			return (
				<Badge color="red" variant="light" size="sm">
					Flagged
				</Badge>
			);
		}
		if (!comment.visible) {
			return (
				<Badge color="orange" variant="light" size="sm">
					Hidden
				</Badge>
			);
		}
		return (
			<Badge color="green" variant="light" size="sm">
				Visible
			</Badge>
		);
	};

	const visibleComments = comments.filter((c) => c.visible);
	const hiddenComments = comments.filter((c) => !c.visible);
	const flaggedComments = comments.filter((c) => c.flagged);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	return (
		<div>
			<Button
				leftSection={<IconArrowLeft size={16} />}
				onClick={() => router.back()}
				mb="lg"
			>
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
										{news.featured && (
											<Badge
												color="yellow"
												variant="filled"
												leftSection={<IconStar size={12} />}
											>
												Featured
											</Badge>
										)}
									</Group>

									{news.hashtags && news.hashtags.trim() && (
										<Group gap="xs" mb="lg">
											<IconHash size={16} />
											{news.hashtags.split(",").map((hashtag, index) => (
												<Badge key={index} variant="light" color="blue">
													{hashtag.trim()}
												</Badge>
											))}
										</Group>
									)}

									{typeof news.read_minutes === "number" && news.read_minutes > 0 && (
										<Text size="sm" c="dimmed" style={{ marginTop: "16px" }}>
											Estimated read: {news.read_minutes} min
										</Text>
									)}
								</div>

								<Button
									leftSection={<IconEdit size={16} />}
									onClick={() => router.push(`/news/add?edit=${news.id}`)}
								>
									Edit Article
								</Button>
							</Group>

							<Divider />

							{news.visual_content && news.visual_content.length > 0 && (
								<div>
									<SimpleGrid cols={2}>
										{news.visual_content.map((imageData, index) => (
											<Box key={index} pos="relative" style={{ minHeight: 150 }}>
												{!loadedImages[index] && (
													<Loader
														style={{
															position: "absolute",
															top: "50%",
															left: "50%",
															transform: "translate(-50%, -50%)",
															zIndex: 1,
														}}
													/>
												)}
												<Image
													src={getImageUrl(imageData)}
													alt={`News visual content ${index + 1}`}
													radius="md"
													width="100%"
													height="100%"
													fit="cover"
													fallbackSrc="/placeholder.svg?height=150&width=200"
													onLoad={() =>
														setLoadedImages((prev) => ({ ...prev, [index]: true }))
													}
													style={{ display: loadedImages[index] ? "block" : "none" }}
												/>
											</Box>
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
									Published:{" "}
									{news.published_date ? formatDate(news.published_date) : "No date"}
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
						<Group mb="lg" gap={20}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									backgroundColor: "white",
									padding: "4px 20px",
								}}
							>
								<Text size="sm" c="dimmed">
									Total Comments
								</Text>
								<Text size="xl" fw={500}>
									{comments.length}
								</Text>
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									backgroundColor: "white",
									padding: "4px 20px",
								}}
							>
								<Text size="sm" c="dimmed">
									Visible
								</Text>
								<Text size="xl" fw={500} c="green">
									{visibleComments.length}
								</Text>
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									backgroundColor: "white",
									padding: "4px 20px",
								}}
							>
								<Text size="sm" c="dimmed">
									Hidden
								</Text>
								<Text size="xl" fw={500} c="orange">
									{hiddenComments.length}
								</Text>
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									backgroundColor: "white",
									padding: "4px 20px",
								}}
							>
								<Text size="sm" c="dimmed">
									Flagged
								</Text>
								<Text size="xl" fw={500} c="red">
									{flaggedComments.length}
								</Text>
							</div>
						</Group>

						{/* Comments Table */}
						<Paper withBorder>
							<Group gap="md" align="flex-end" m='md' mb='lg'>
								<Textarea
									placeholder="Add a comment..."
									value={newComment.content}
									onChange={(e) =>
										setNewComment((prev) => ({ ...prev, content: e.target.value }))
									}
									rows={1}
									style={{ flex: 1 }}
									required
								/>
								<Button
									onClick={handleSubmitComment}
									loading={submitting}
									disabled={!newComment.content.trim()}
									size="sm"
								>
									Post
								</Button>
							</Group>
							{loading ?
								<Box p="xl" ta="center">
									<Loader size="lg" />
									<Text mt="md">Loading comments...</Text>
								</Box>
							: comments.length === 0 ?
								<Box p="xl" ta="center">
									<Text c="dimmed" size="lg">
										No comments yet
									</Text>
									<Text c="dimmed" size="sm" mt="xs">
										Comments will appear here once users start engaging with this article.
									</Text>
								</Box>
							:	<Table striped highlightOnHover>
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
													<CommentLikeDisplay comment={comment} />
												</Table.Td>
												<Table.Td>{getStatusBadge(comment)}</Table.Td>
												<Table.Td>
													<Text size="xs">{formatDate(comment.createdAt)}</Text>
												</Table.Td>
												<Table.Td>
													<Group gap="xs">
														{comment.visible ?
															<ActionIcon
																variant="light"
																color="orange"
																onClick={() => handleCommentAction(comment, "hide")}
															>
																<IconEyeOff size={16} />
															</ActionIcon>
														:	<ActionIcon
																variant="light"
																color="green"
																onClick={() => handleCommentAction(comment, "show")}
															>
																<IconEye size={16} />
															</ActionIcon>
														}

														{comment.flagged ?
															<ActionIcon
																variant="light"
																color="blue"
																onClick={() => handleCommentAction(comment, "unflag")}
															>
																<IconFlag size={16} />
															</ActionIcon>
														:	<ActionIcon
																variant="light"
																color="red"
																onClick={() => handleCommentAction(comment, "flag")}
															>
																<IconFlag size={16} />
															</ActionIcon>
														}

																											<ActionIcon
														variant="light"
														color="red"
														onClick={() => handleDeleteComment(comment)}
													>
														<IconTrash size={16} />
													</ActionIcon>
													</Group>
												</Table.Td>
											</Table.Tr>
										))}
									</Table.Tbody>
								</Table>
							}
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
							color={actionType === "flag" ? "orange" : "green"}
							onClick={handleSubmitAction}
						>
							{actionType.charAt(0).toUpperCase() + actionType.slice(1)}
						</Button>
					</Group>
				</Stack>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal
				opened={deleteModalOpened}
				onClose={closeDeleteModal}
				title="Delete Comment"
			>
				<Stack>
					<Text size="sm" c="red">
						Are you sure you want to delete this comment? This action cannot be undone.
					</Text>

					{deletingComment && (
						<Paper withBorder p="md" bg="gray.0">
							<Group mb="xs">
								<Avatar size="xs" radius="xl">
									{deletingComment.user_name.charAt(0).toUpperCase()}
								</Avatar>
								<Text fw={500} size="sm">
									{deletingComment.user_name}
								</Text>
							</Group>
							<Text size="sm" lineClamp={3}>
								{deletingComment.content}
							</Text>
						</Paper>
					)}

					<Group justify="flex-end">
						<Button variant="light" onClick={closeDeleteModal}>
							Cancel
						</Button>
						<Button color="red" onClick={handleConfirmDelete}>
							Delete
						</Button>
					</Group>
				</Stack>
			</Modal>
		</div>
	);
}
