"use client";

import { useState, useEffect, useTransition } from "react";
import {
	Title,
	Button,
	TextInput,
	Paper,
	Stack,
	FileInput,
	Group,
	Text,
	ActionIcon,
	Image,
	Card,
	Badge,
	Flex,
	Box,
	Divider,
	Switch,
	NumberInput,
	Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { DateTimePicker } from "@mantine/dates";
import {
	IconUpload,
	IconArrowLeft,
	IconX,
	IconPhoto,
	IconTrash,
} from "@tabler/icons-react";
import SimpleRichTextEditor from "./SimpleRichTextEditor";
import { useRouter } from "next/navigation";
import { createNews, updateNews } from "@/app/actions/news.actions";
import { News } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

// If News type is imported from '@/types', extend it here for local use
export interface NewsExtended extends News {
	featured?: boolean;
	read_minutes?: number;
}
	
interface NewsFormProps {
	newsToEdit?: NewsExtended | null;
	categories?: Array<{ value: string; label: string }>;
}

export default function NewsForm({ newsToEdit, categories = [] }: NewsFormProps) {
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(false);
	const [visualFiles, setVisualFiles] = useState<File[]>([]);
	const [existingImages, setExistingImages] = useState<string[]>([]);
	const [originalImages, setOriginalImages] = useState<string[]>([]);
	const [imagePreviews, setImagePreviews] = useState<string[]>([]);
	const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(
		null
	);
	const [loadingImages, setLoadingImages] = useTransition();
	const router = useRouter();
	const { user } = useAuth();

	const form = useForm({
		initialValues: {
			title: "",
			content: "",
			category_id: "",
			published_date: new Date(),
			visual_content: [] as File[],
			hashtags: "",
			seo_keywords: "",
			featured: false,
			read_minutes: 1,
		},
	});

	useEffect(() => {
		console.log("newsToEdit", newsToEdit);
		if (newsToEdit) {
			form.setValues({
				title: newsToEdit.title,
				content: newsToEdit.content,
				category_id: newsToEdit.category_id ? newsToEdit.category_id.toString() : "",
				published_date:
					newsToEdit.published_date ?
						new Date(newsToEdit.published_date)
					:	new Date(),
				visual_content: [],
				hashtags: newsToEdit.hashtags || "",
				seo_keywords: newsToEdit.seo_keywords || "",
				featured: newsToEdit.featured || false,
				read_minutes: newsToEdit.read_minutes || 1,
			});
			setContent(newsToEdit.content);

			// Set existing images if any
			if (newsToEdit.visual_content && Array.isArray(newsToEdit.visual_content)) {
				const images = newsToEdit.visual_content
					.map((img) =>
						typeof img === "string" ? img
						: img && typeof img === "object" && "secure_url" in img ? img.secure_url
						: ""
					)
					.filter(Boolean);
				setExistingImages(images);
				setOriginalImages([...images]); // Keep a copy of the original images
			}
		}
	}, []);

	// Cleanup preview URLs on unmount
	useEffect(() => {
		return () => {
			imagePreviews.forEach((url) => URL.revokeObjectURL(url));
		};
	}, [imagePreviews]);

	// Helper function to get image URL from either string or object
	const getImageUrl = (
		imageData: string | { public_id: string; secure_url: string }
	): string => {
		if (typeof imageData === "string") {
			// Remove protocol/domain if present, then prepend /api/
			const cleaned = imageData.replace(/^https?:\/\/[^/]+/, "");
			return `/api${cleaned.startsWith("/") ? "" : "/"}${cleaned}`;
		}
		return imageData.secure_url;
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files && files.length > 0) {
			const newFiles = Array.from(files);
			// Add new files to existing ones instead of replacing
			const updatedFiles = [...visualFiles, ...newFiles];
			setVisualFiles(updatedFiles);
			form.setFieldValue("visual_content", updatedFiles);

			// Create preview URLs for new files and add to existing previews
			const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
			setImagePreviews((prev) => [...prev, ...newPreviews]);
		} else {
			setVisualFiles([]);
			setImagePreviews([]);
			form.setFieldValue("visual_content", []);
		}
		// Reset the input value to allow selecting the same file again
		if (fileInputRef) {
			fileInputRef.value = "";
		}
	};

	const handleAddImage = () => {
		fileInputRef?.click();
	};

	const removeNewImage = (index: number) => {
		const newFiles = visualFiles.filter((_, i) => i !== index);
		const newPreviews = imagePreviews.filter((_, i) => i !== index);

		setVisualFiles(newFiles);
		setImagePreviews(newPreviews);
		form.setFieldValue("visual_content", newFiles);
	};

	const removeExistingImage = (index: number) => {
		const newImages = existingImages.filter((_, i) => i !== index);
		setExistingImages(newImages);
		// You might want to send this information to the backend to remove the image
	};

	const handleSubmit = async (values: typeof form.values) => {
		setLoading(true);
		try {
			let result;
			const submitData: any = {
				...values,
				content,
				category_id: values.category_id ? parseInt(values.category_id) : null,
				hashtags: values.hashtags,
				seo_keywords: values.seo_keywords,
				featured: values.featured,
				read_minutes: values.read_minutes,
				source: "Website",
				created_by: user?.username || "admin",
			};

			// Handle visual content updates
			if (newsToEdit) {
				// Always send the remaining existing image URLs and new files together
				submitData.visual_content = [...existingImages, ...visualFiles];
				result = await updateNews({ id: newsToEdit.id, ...submitData });
			} else {
				// For new news, only include visual_content if there are files
				if (visualFiles.length > 0) {
					submitData.visual_content = visualFiles;
				}
				result = await createNews(submitData);
			}

			if (result.success) {
				notifications.show({
					title: "Success",
					message:
						newsToEdit ? "News updated successfully" : "News created successfully",
					color: "green",
				});
				router.push("/news");
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to save news",
					color: "red",
				});
			}
		} catch (error) {
			notifications.show({
				title: "Error",
				message: "An unexpected error occurred",
				color: "red",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<Button
				leftSection={<IconArrowLeft size={16} />}
				onClick={() => router.back()}
				mb="lg"
				variant="light"
			>
				Back to News
			</Button>

			<Paper withBorder p="lg" radius="md">
				<Title order={2} mb="lg">
					{newsToEdit ? "Edit News" : "Create News"}
				</Title>

				<form onSubmit={form.onSubmit(handleSubmit)}>
					<Stack>
						<TextInput
							label="Title"
							placeholder="Enter news title"
							required
							{...form.getInputProps("title")}
						/>
						<Select
							label="Category"
							placeholder="Select category"
							data={categories}
							{...form.getInputProps("category_id")}
						/>
						<TextInput
							label="Hashtags"
							placeholder="Enter hashtags, separated by commas (e.g. news,update,breaking)"
							{...form.getInputProps("hashtags")}
						/>
						<TextInput
							label="SEO Keywords"
							placeholder="Enter SEO keywords, separated by commas (e.g. legal news,ethiopia law,corporate law) - These won't be displayed on the frontend but used for search engine optimization"
							{...form.getInputProps("seo_keywords")}
						/>
						<Switch
							label="Featured Article?"
							{...form.getInputProps("featured", { type: "checkbox" })}
						/>
						<NumberInput
							label="Estimated Read Minutes"
							min={1}
							max={120}
							{...form.getInputProps("read_minutes")}
						/>
						{/* 
						<DateTimePicker
							label="Published Date"
							placeholder="Select date and time"
							{...form.getInputProps("published_date")}
						/> */}

						<Box>
							<Text size="sm" fw={500} mb="xs">
								Visual Content
							</Text>

							{/* Hidden file input */}
							<input
								ref={setFileInputRef}
								type="file"
								accept="image/*,video/*"
								multiple
								onChange={handleFileChange}
								style={{ display: "none" }}
							/>

							{/* Add Image Button */}
							<Button
								onClick={handleAddImage}
								leftSection={<IconUpload size={16} />}
								variant="outline"
								mb="md"
							>
								Add Image
							</Button>

							{/* New Image Previews */}
							{imagePreviews.length > 0 && (
								<Box mb="md">
									<Text size="sm" fw={500} mb="xs" c="dimmed">
										New Images ({imagePreviews.length})
									</Text>
									<Group gap="sm">
										{imagePreviews.map((preview, index) => (
											<Card key={index} p={0} radius="md" withBorder>
												<Box style={{ position: "relative" }}>
													<Image
														src={preview}
														alt={`Preview ${index + 1}`}
														width={120}
														height={120}
														fit="cover"
														radius="md"
													/>
													<ActionIcon
														size="sm"
														variant="filled"
														color="red"
														style={{
															position: "absolute",
															top: 4,
															right: 4,
														}}
														onClick={() => removeNewImage(index)}
													>
														<IconTrash size={12} />
													</ActionIcon>
													<Badge
														size="xs"
														variant="filled"
														color="blue"
														style={{
															position: "absolute",
															bottom: 4,
															left: 4,
														}}
													>
														{index + 1}
													</Badge>
												</Box>
												<Box p="xs">
													<Text size="xs" c="dimmed" ta="center">
														{visualFiles[index]?.name || "Image"}
													</Text>
												</Box>
											</Card>
										))}
									</Group>
								</Box>
							)}

							{/* Existing Images */}
							{existingImages.length > 0 && (
								<Box>
									<Divider my="md" />
									<Text size="sm" fw={500} mb="xs" c="dimmed">
										Existing Images ({existingImages.length})
									</Text>
									<Group gap="sm">
										{existingImages.map((imageData, index) => (
											<Card key={index} p={0} radius="md" withBorder>
												<Box style={{ position: "relative" }}>
													<Image
														src={getImageUrl(imageData)}
														alt={`Existing Image ${index + 1}`}
														width={120}
														height={120}
														fit="cover"
														radius="md"
													/>
													<ActionIcon
														size="sm"
														variant="filled"
														color="red"
														style={{
															position: "absolute",
															top: 4,
															right: 4,
														}}
														onClick={() => removeExistingImage(index)}
													>
														<IconTrash size={12} />
													</ActionIcon>
													<Badge
														size="xs"
														variant="filled"
														color="green"
														style={{
															position: "absolute",
															bottom: 4,
															left: 4,
														}}
													>
														{index + 1}
													</Badge>
												</Box>
												<Box p="xs">
													<Text size="xs" c="dimmed" ta="center">
														Existing Image
													</Text>
												</Box>
											</Card>
										))}
									</Group>
								</Box>
							)}

							{/* Empty State */}
							{imagePreviews.length === 0 && existingImages.length === 0 && (
								<Card p="xl" radius="md" withBorder>
									<Flex direction="column" align="center" gap="sm">
										<IconPhoto size={48} color="var(--mantine-color-gray-4)" />
										<Text size="sm" c="dimmed" ta="center">
											No images selected. Upload images to see previews here.
										</Text>
									</Flex>
								</Card>
							)}
						</Box>

						<SimpleRichTextEditor
							label="Content"
							value={content}
							onChange={setContent}
							placeholder="Enter news content..."
							rows={10}
						/>

						<Group justify="flex-end">
							<Button
								variant="light"
								onClick={() => router.push("/news")}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button type="submit" loading={loading}>
								{newsToEdit ? "Update" : "Create"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Paper>
		</div>
	);
}
