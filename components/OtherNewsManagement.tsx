"use client";

import { useState } from "react";
import {
	Title,
	Button,
	TextInput,
	Textarea,
	Paper,
	Text,
	Stack,
	Group,
	ActionIcon,
	Modal,
	SimpleGrid,
	Badge,
	Card,
	Image,
	Loader,
	Box,
	Overlay,
	Center,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
	IconUpload,
	IconPlus,
	IconEdit,
	IconTrash,
	IconEye,
	IconExternalLink,
	IconPlayerPlay,
	IconLink,
} from "@tabler/icons-react";
import { updateHomepage } from "@/app/actions/homepage.actions";

interface NewsLink {
	id?: number;
	title: string;
	description: string;
	link: string;
	createdAt?: string;
	updatedAt?: string;
}

interface OtherNewsManagementProps {
	initialNewsLinks?: NewsLink[];
}

const mockNewsLinks: NewsLink[] = [
	{
		id: 1,
		title: "Latest News Update",
		description: "Watch our latest news coverage",
		link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
	},
	{
		id: 2,
		title: "Company Overview",
		description: "Learn more about our company",
		link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
	},
];

export default function OtherNewsManagement({
	initialNewsLinks = mockNewsLinks,
}: OtherNewsManagementProps) {
	const [originalNewsLinks, setOriginalNewsLinks] = useState<NewsLink[]>(initialNewsLinks);
	const [newsLinks, setNewsLinks] = useState<NewsLink[]>(initialNewsLinks);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Modal states
	const [newsLinkModalOpened, { open: openNewsLinkModal, close: closeNewsLinkModal }] =
		useDisclosure(false);
	const [previewModalOpened, { open: openPreviewModal, close: closePreviewModal }] =
		useDisclosure(false);
	const [editingNewsLink, setEditingNewsLink] = useState<NewsLink | null>(null);
	const [previewingNewsLink, setPreviewingNewsLink] = useState<NewsLink | null>(null);

	// Form
	const newsLinkForm = useForm({
		initialValues: {
			title: "",
			description: "",
			link: "",
		},
		validate: {
			title: (value) => (!value ? "Title is required" : null),
			description: (value) => (!value ? "Description is required" : null),
			link: (value) => (!value ? "Link is required" : null),
		},
	});

	// Reusable function to update news links
	const handleNewsLinksUpdate = async (updatedNewsLinks: NewsLink[]) => {
		try {
			// Remove createdAt and updatedAt from the data being sent
			const sanitizedNewsLinks = updatedNewsLinks.map((item) => {
				const { createdAt, updatedAt, ...rest } = item as any;
				return rest;
			});

			const updatePayload = {
				newsLinks: sanitizedNewsLinks,
			};
			const result = await updateHomepage(updatePayload);
			if (result.success) {
				// Update local state immediately
				setNewsLinks(updatedNewsLinks);
				setOriginalNewsLinks(updatedNewsLinks);
				return true;
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update news links",
					color: "red",
				});
				return false;
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
			return false;
		}
	};

	const handleNewsLinkSubmit = async (values: typeof newsLinkForm.values) => {
		setIsSubmitting(true);
		try {
			const updatedNewsLinks =
				editingNewsLink ?
					newsLinks.map((item) =>
						item.id === editingNewsLink.id ? { ...item, ...values } : item
					)
				:	[...newsLinks, { ...values }];
			
			const success = await handleNewsLinksUpdate(updatedNewsLinks as NewsLink[]);
			if (success) {
				notifications.show({
					title: "Success",
					message:
						editingNewsLink ?
							"News link updated successfully"
						:	"News link added successfully",
					color: "green",
				});
			}
			closeNewsLinkModal();
			setEditingNewsLink(null);
			newsLinkForm.reset();
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteNewsLink = async (id: number | undefined) => {
		try {
			if (!id) return;
			const updatedNewsLinks = newsLinks.filter((item) => item.id !== id);
			const success = await handleNewsLinksUpdate(updatedNewsLinks);
			if (success) {
				notifications.show({
					title: "Success",
					message: "News link deleted successfully",
					color: "green",
				});
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
		}
	};

	const handleEditNewsLink = (newsLink: NewsLink) => {
		setEditingNewsLink(newsLink);
		newsLinkForm.setValues({
			title: newsLink.title,
			description: newsLink.description,
			link: newsLink.link,
		});
		openNewsLinkModal();
	};

	const handlePreviewNewsLink = (newsLink: NewsLink) => {
		setPreviewingNewsLink(newsLink);
		openPreviewModal();
	};

	// Helper function to extract YouTube video ID
	const getYouTubeVideoId = (url: string) => {
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? match[2] : null;
	};

	// Helper function to get YouTube thumbnail
	const getYouTubeThumbnail = (url: string) => {
		const videoId = getYouTubeVideoId(url);
		return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
	};

	// Helper function to get embed URL
	const getEmbedUrl = (url: string) => {
		const videoId = getYouTubeVideoId(url);
		return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
	};

	// Helper function to detect link type and get appropriate embed
	const getLinkInfo = (url: string) => {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.toLowerCase();
		
		// YouTube
		if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
			const videoId = getYouTubeVideoId(url);
			return {
				type: 'youtube',
				thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null,
				embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
				icon: 'youtube',
				color: 'red'
			};
		}
		
		// Vimeo
		if (hostname.includes('vimeo.com')) {
			const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
			return {
				type: 'vimeo',
				thumbnail: videoId ? `https://vumbnail.com/${videoId}.jpg` : null,
				embedUrl: videoId ? `https://player.vimeo.com/video/${videoId}` : null,
				icon: 'vimeo',
				color: 'blue'
			};
		}
		
		// Twitter/X
		if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
			return {
				type: 'twitter',
				embedUrl: url,
				icon: 'twitter',
				color: 'blue'
			};
		}
		
		// Facebook
		if (hostname.includes('facebook.com')) {
			return {
				type: 'facebook',
				embedUrl: url,
				icon: 'facebook',
				color: 'blue'
			};
		}
		
		// Instagram
		if (hostname.includes('instagram.com')) {
			return {
				type: 'instagram',
				embedUrl: url,
				icon: 'instagram',
				color: 'pink'
			};
		}
		
		// LinkedIn
		if (hostname.includes('linkedin.com')) {
			return {
				type: 'linkedin',
				embedUrl: url,
				icon: 'linkedin',
				color: 'blue'
			};
		}
		
		// Generic website
		return {
			type: 'website',
			embedUrl: null,
			icon: 'link',
			color: 'gray'
		};
	};

	return (
		<div style={{ padding: "24px" }}>
			<Title order={2} mb="lg">
				Other News Management
			</Title>

			<Paper withBorder p="md" mb="lg">
				<Group justify="space-between" mb="md">
					<Text fw={500}>News Links</Text>
					<Button
						leftSection={<IconPlus size={16} />}
						onClick={() => {
							setEditingNewsLink(null);
							newsLinkForm.reset();
							openNewsLinkModal();
						}}
					>
						Add News Link
					</Button>
				</Group>

				{newsLinks.length === 0 ? (
					<Text c="dimmed" ta="center" py="xl">
						No news links found. Add your first news link to get started.
					</Text>
				) : (
					<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
						{newsLinks.map((newsLink) => {
							const linkInfo = getLinkInfo(newsLink.link);

							return (
								<Card key={newsLink.id} shadow="sm" padding="lg" radius="md" withBorder>
									<Card.Section>
										{linkInfo.thumbnail ? (
											<Box pos="relative">
												<Image
													src={linkInfo.thumbnail}
													height={160}
													alt={newsLink.title}
													style={{ objectFit: "cover" }}
												/>
												<Badge
													pos="absolute"
													top={8}
													right={8}
													color={linkInfo.color}
													variant="filled"
													size="sm"
												>
													{linkInfo.type.charAt(0).toUpperCase() + linkInfo.type.slice(1)}
												</Badge>
												<Overlay
													pos="absolute"
													top={0}
													left={0}
													right={0}
													bottom={0}
													opacity={0}
													style={{ 
														transition: 'opacity 0.2s',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center'
													}}
													className="hover:opacity-100"
													onClick={() => handlePreviewNewsLink(newsLink)}
												>
													<Center>
														<IconPlayerPlay size={48} color="white" />
													</Center>
												</Overlay>
											</Box>
										) : (
											<Box
												h={160}
												bg="gray.1"
												pos="relative"
												style={{ 
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center'
												}}
												onClick={() => handlePreviewNewsLink(newsLink)}
											>
												<IconLink size={48} color="gray" />
												<Badge
													pos="absolute"
													top={8}
													right={8}
													color={linkInfo.color}
													variant="filled"
													size="sm"
												>
													{linkInfo.type.charAt(0).toUpperCase() + linkInfo.type.slice(1)}
												</Badge>
											</Box>
										)}
									</Card.Section>

									<Stack gap="xs" mt="md">
										<Text fw={600} size="lg" lineClamp={2}>
											{newsLink.title}
										</Text>
										<Text size="sm" c="dimmed" lineClamp={3}>
											{newsLink.description}
										</Text>
										
										<Group justify="space-between" mt="auto">
											<Group gap="xs">
												<ActionIcon
													variant="light"
													color="blue"
													size="sm"
													onClick={() => handlePreviewNewsLink(newsLink)}
													title="Preview"
												>
													<IconEye size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="green"
													size="sm"
													onClick={() => window.open(newsLink.link, '_blank')}
													title="Open in New Tab"
												>
													<IconExternalLink size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="orange"
													size="sm"
													onClick={() => handleEditNewsLink(newsLink)}
													title="Edit"
												>
													<IconEdit size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="red"
													size="sm"
													onClick={() => newsLink.id && handleDeleteNewsLink(newsLink.id)}
													title="Delete"
													disabled={!newsLink.id}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Group>
										</Group>
									</Stack>
								</Card>
							);
						})}
					</SimpleGrid>
				)}
			</Paper>

			{/* News Link Modal */}
			<Modal
				opened={newsLinkModalOpened}
				onClose={closeNewsLinkModal}
				title={editingNewsLink ? "Edit News Link" : "Add News Link"}
			>
				<form onSubmit={newsLinkForm.onSubmit(handleNewsLinkSubmit)}>
					<Stack>
						<TextInput
							label="Title"
							placeholder="Enter news link title"
							required
							{...newsLinkForm.getInputProps("title")}
						/>
						<Textarea
							label="Description"
							placeholder="Enter news link description"
							rows={3}
							required
							{...newsLinkForm.getInputProps("description")}
						/>
						<TextInput
							label="Link URL"
							placeholder="Enter any URL (YouTube, Vimeo, Twitter, Facebook, Instagram, LinkedIn, or any website)"
							required
							{...newsLinkForm.getInputProps("link")}
						/>
						<Group justify="flex-end">
							<Button
								variant="light"
								onClick={closeNewsLinkModal}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" loading={isSubmitting}>
								{editingNewsLink ? "Update" : "Add"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			{/* Preview Modal */}
			<Modal
				opened={previewModalOpened}
				onClose={closePreviewModal}
				title={previewingNewsLink?.title}
				size="80%"
				styles={{
					body: {
						padding: 0,
					},
					content: {
						height: '80vh',
					},
				}}
			>
				{previewingNewsLink && (
					<Box h="100%">
						<Stack gap="md" p="md">
							<Text size="sm" c="dimmed">
								{previewingNewsLink.description}
							</Text>
							<Group>
								<Button
									variant="light"
									leftSection={<IconExternalLink size={16} />}
									onClick={() => window.open(previewingNewsLink.link, '_blank')}
								>
									Open in New Tab
								</Button>
							</Group>
						</Stack>
						<Box 
							h="500px" 
							style={{ 
								border: '1px solid #e0e0e0', 
								borderRadius: '8px', 
								overflow: 'hidden',
								margin: '0 16px 16px 16px'
							}}
						>
							{getLinkInfo(previewingNewsLink.link).embedUrl ? (
								<iframe
									src={getLinkInfo(previewingNewsLink.link).embedUrl || ''}
									width="100%"
									height="100%"
									frameBorder="0"
									allowFullScreen
                                    title={previewingNewsLink.title}
								/>
							) : (
								<Box 
									h="100%" 
									bg="gray.1"
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									<Stack align="center" gap="md">
										<IconLink size={48} color="gray" />
										<Text c="dimmed">This link cannot be embedded</Text>
										<Button
											variant="light"
											leftSection={<IconExternalLink size={16} />}
											onClick={() => window.open(previewingNewsLink.link, '_blank')}
										>
											Open in New Tab
										</Button>
									</Stack>
								</Box>
							)}
						</Box>
					</Box>
				)}
			</Modal>
		</div>
	);
} 