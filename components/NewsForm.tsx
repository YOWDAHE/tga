"use client";

import { useState, useEffect } from "react";
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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { DateTimePicker } from "@mantine/dates";
import { IconUpload, IconArrowLeft, IconX } from "@tabler/icons-react";
import SimpleRichTextEditor from "./SimpleRichTextEditor";
import { useRouter } from "next/navigation";
import { createNews, updateNews } from "@/app/actions/news.actions";
import { News } from "@/types";

interface NewsFormProps {
	newsToEdit?: News | null;
}

export default function NewsForm({ newsToEdit }: NewsFormProps) {
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(false);
	const [visualFiles, setVisualFiles] = useState<File[]>([]);
	const [existingImages, setExistingImages] = useState<string[]>([]);
	const router = useRouter();

	const form = useForm({
		initialValues: {
			title: "",
			content: "",
			source: "",
			published_date: new Date(),
			created_by: "",
			visual_content: [] as File[],
		},
	});

	useEffect(() => {
		console.log("newsToEdit", newsToEdit);
		if (newsToEdit) {
			form.setValues({
				title: newsToEdit.title,
				content: newsToEdit.content,
				source: newsToEdit.source || "",
				published_date:
					newsToEdit.published_date ?
						new Date(newsToEdit.published_date)
					:	new Date(),
				created_by: newsToEdit.created_by || "",
				visual_content: [],
			});
			setContent(newsToEdit.content);

			// Set existing images if any
			if (newsToEdit.visual_content && Array.isArray(newsToEdit.visual_content)) {
				setExistingImages(newsToEdit.visual_content);
			}
		}
	}, []);

	const handleFileChange = (files: File[] | null) => {
		if (files) {
			setVisualFiles(files);
			form.setFieldValue("visual_content", files);
		} else {
			setVisualFiles([]);
			form.setFieldValue("visual_content", []);
		}
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
			const submitData = {
				...values,
				content,
				visual_content: visualFiles.length > 0 ? visualFiles : existingImages,
			};

			if (newsToEdit) {
				console.log("submitData", submitData);
				result = await updateNews({
					id: newsToEdit.id!,
					...submitData,
				});
			} else {
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

						<Group grow>
							<TextInput
								label="Source"
								placeholder="News source"
								{...form.getInputProps("source")}
							/>
							<TextInput
								label="Created By"
								placeholder="Author name"
								{...form.getInputProps("created_by")}
							/>
						</Group>

						<DateTimePicker
							label="Published Date"
							placeholder="Select date and time"
							{...form.getInputProps("published_date")}
						/>

						<FileInput
							label="Visual Content"
							placeholder="Upload images or videos"
							accept="image/*,video/*"
							multiple
							leftSection={<IconUpload size={16} />}
							value={visualFiles}
							onChange={handleFileChange}
						/>

						{/* Display existing images */}
						{existingImages.length > 0 && (
							<div>
								<Text size="sm" fw={500} mb="xs">
									Existing Images:
								</Text>
								<Group>
									{existingImages.map((imageUrl, index) => (
										<div key={index} style={{ position: "relative" }}>
											<Image
												src={imageUrl}
												alt={`Image ${index + 1}`}
												width={100}
												height={100}
												fit="cover"
												radius="md"
											/>
											<ActionIcon
												size="xs"
												variant="filled"
												color="red"
												style={{
													position: "absolute",
													top: -5,
													right: -5,
												}}
												onClick={() => removeExistingImage(index)}
											>
												<IconX size={10} />
											</ActionIcon>
										</div>
									))}
								</Group>
							</div>
						)}

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
