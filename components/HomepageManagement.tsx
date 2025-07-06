"use client";

import { useState } from "react";
import "@mantine/core/styles.css";
import "@mantine/tiptap/styles.css";
import {
	Title,
	Button,
	TextInput,
	Textarea,
	Paper,
	Text,
	Stack,
	Group,
	FileInput,
	Image,
	Grid,
	Accordion,
	ActionIcon,
	Modal,
	SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
	IconUpload,
	IconPlus,
	IconEdit,
	IconTrash,
	IconPhoto,
} from "@tabler/icons-react";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { updateHomepage } from "@/app/actions/homepage.actions";
import { useRouter } from "next/navigation";

interface LandingPageContent {
	id?: number;
	logo_url: string | null;
	hero_image_url: string | null;
	hero_title: string;
	about_us: string;
	createdAt?: string;
	updatedAt?: string;
}

interface Stat {
	id: number;
	stat: string;
	description: string;
	createdAt?: string;
	updatedAt?: string;
}

interface Practice {
	id: number;
	title: string;
	description: string;
	createdAt?: string;
	updatedAt?: string;
}

interface Partner {
	id: number;
	name: string;
	logo_url: string;
	description?: string;
	createdAt?: string;
	updatedAt?: string;
}

interface Testimonial {
	id: number;
	client: string;
	position: string;
	content: string;
	createdAt?: string;
	updatedAt?: string;
}

interface ContactInfo {
	id: number;
	medium: string;
	email?: string;
	phone_number?: string;
	createdAt?: string;
	updatedAt?: string;
}

interface HomepageManagementProps {
	initialContent?: LandingPageContent;
	initialStats?: Stat[];
	initialPractices?: Practice[];
	initialPartners?: Partner[];
	initialTestimonials?: Testimonial[];
	initialContactInfo?: ContactInfo[];
}

const initialContent: LandingPageContent = {
	logo_url: null,
	hero_image_url: null,
	hero_title: "Welcome to Our Platform",
	about_us: "<p>We are a leading company in our industry...</p>",
};

const mockStats: Stat[] = [
	{ id: 1, stat: "500+", description: "Happy Clients" },
	{ id: 2, stat: "10+", description: "Years Experience" },
	{ id: 3, stat: "50+", description: "Projects Completed" },
];

const mockPractices: Practice[] = [
	{
		id: 1,
		title: "Quality Service",
		description: "We provide high-quality services",
	},
	{
		id: 2,
		title: "Expert Team",
		description: "Our team consists of industry experts",
	},
];

const mockPartners: Partner[] = [
	{
		id: 1,
		name: "Partner 1",
		logo_url: "/placeholder.svg?height=100&width=200",
		description: "Strategic partner",
	},
	{
		id: 2,
		name: "Partner 2",
		logo_url: "/placeholder.svg?height=100&width=200",
		description: "Technology partner",
	},
];

const mockTestimonials: Testimonial[] = [
	{
		id: 1,
		client: "John Doe",
		position: "CEO, Company Inc.",
		content: "Excellent service and support!",
	},
	{
		id: 2,
		client: "Jane Smith",
		position: "Manager, Corp Ltd.",
		content: "Professional and reliable!",
	},
];

const mockContactInfo: ContactInfo[] = [
	{ id: 1, medium: "Email", email: "contact@company.com" },
	{ id: 2, medium: "Phone", phone_number: "+1 234 567 8900" },
	{ id: 3, medium: "WhatsApp", phone_number: "+1 234 567 8901" },
];

export default function HomepageManagement({
	initialContent: defaultContent = initialContent,
	initialStats = mockStats,
	initialPractices = mockPractices,
	initialPartners = mockPartners,
	initialTestimonials = mockTestimonials,
	initialContactInfo = mockContactInfo,
}: HomepageManagementProps) {
	const router = useRouter();
	// State for last fetched landing page
	const [originalContent, setOriginalContent] =
		useState<LandingPageContent>(defaultContent);
	const [originalStats, setOriginalStats] = useState<Stat[]>(initialStats);
	const [originalPractices, setOriginalPractices] =
		useState<Practice[]>(initialPractices);
	const [originalPartners, setOriginalPartners] =
		useState<Partner[]>(initialPartners);
	const [originalContactUs, setOriginalContactUs] =
		useState<ContactInfo[]>(initialContactInfo);
	// State for current edits
	const [content, setContent] = useState<LandingPageContent>(defaultContent);
	const [stats, setStats] = useState<Stat[]>(initialStats);
	const [practices, setPractices] = useState<Practice[]>(initialPractices);
	const [partners, setPartners] = useState<Partner[]>(initialPartners);
	const [testimonials, setTestimonials] =
		useState<Testimonial[]>(initialTestimonials);
	const [contactInfo, setContactInfo] =
		useState<ContactInfo[]>(initialContactInfo);
	const [aboutUsContent, setAboutUsContent] = useState(content.about_us);

	// Modal states
	const [statModalOpened, { open: openStatModal, close: closeStatModal }] =
		useDisclosure(false);
	const [
		practiceModalOpened,
		{ open: openPracticeModal, close: closePracticeModal },
	] = useDisclosure(false);
	const [
		partnerModalOpened,
		{ open: openPartnerModal, close: closePartnerModal },
	] = useDisclosure(false);
	const [
		testimonialModalOpened,
		{ open: openTestimonialModal, close: closeTestimonialModal },
	] = useDisclosure(false);
	const [
		contactModalOpened,
		{ open: openContactModal, close: closeContactModal },
	] = useDisclosure(false);

	// Editing states
	const [editingStat, setEditingStat] = useState<Stat | null>(null);
	const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
	const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
	const [editingTestimonial, setEditingTestimonial] =
		useState<Testimonial | null>(null);
	const [editingContact, setEditingContact] = useState<ContactInfo | null>(null);

	const heroForm = useForm({
		initialValues: {
			hero_title: content.hero_title,
			logo_url: null as File | null,
			hero_image_url: null as File | null,
		},
	});

	const statForm = useForm({
		initialValues: {
			stat: "",
			description: "",
		},
	});

	const practiceForm = useForm({
		initialValues: {
			title: "",
			description: "",
		},
	});

	const partnerForm = useForm({
		initialValues: {
			name: "",
			description: "",
			logo_url: null as File | null,
		},
	});

	const testimonialForm = useForm({
		initialValues: {
			client: "",
			position: "",
			content: "",
		},
	});

	const contactForm = useForm({
		initialValues: {
			medium: "",
			email: "",
			phone_number: "",
		},
	});

	const aboutUsEditor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			Link,
			Superscript,
			SubScript,
			Highlight,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
		],
		content: aboutUsContent,
		onUpdate: ({ editor }) => {
			setAboutUsContent(editor.getHTML());
		},
	});

	const handleAboutUsSubmit = async () => {
		try {
			const updatedContent = {
				...content,
				about_us: aboutUsContent,
			};
			const result = await updateHomepage({ landing: updatedContent });
			if (result.success) {
				// Update local state immediately
				setContent(updatedContent);
				setOriginalContent(updatedContent);
				notifications.show({
					title: "Success",
					message: "About Us updated successfully",
					color: "green",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update About Us",
					color: "red",
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

	const handleHeroSubmit = async (values: typeof heroForm.values) => {
		try {
			const updatedContent = {
				...content,
				hero_title: values.hero_title,
			};
			const result = await updateHomepage({ landing: updatedContent });
			if (result.success) {
				// Update local state immediately
				setContent(updatedContent);
				setOriginalContent(updatedContent);
				notifications.show({
					title: "Success",
					message: "Hero section updated successfully",
					color: "green",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update hero section",
					color: "red",
				});
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
		}
		heroForm.reset();
	};

	// Reusable function to update stats
	const handleStatsUpdate = async (updatedStats: Stat[]) => {
		try {
			// Remove createdAt and updatedAt from the data being sent
			const sanitizedStats = updatedStats.map((item) => {
				const { createdAt, updatedAt, ...rest } = item as any;
				return rest;
			});
			
			const updatePayload = {
				stats: sanitizedStats,
			};
			const result = await updateHomepage(updatePayload);
			if (result.success) {
				// Update local state immediately
				setStats(updatedStats);
				setOriginalStats(updatedStats);
				return true;
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update stats",
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

	const handleStatSubmit = async (values: typeof statForm.values) => {
		const updatedStats =
			editingStat ?
				stats.map((item) =>
					item.id === editingStat.id ? { ...item, ...values } : item
				)
			:	[...stats, { ...values }];
		
		const success = await handleStatsUpdate(updatedStats as Stat[]);
		if (success) {
			notifications.show({
				title: "Success",
				message:
					editingStat ? "Stat updated successfully" : "Stat added successfully",
				color: "green",
			});
		}
		closeStatModal();
		setEditingStat(null);
		statForm.reset();
	};

	// Reusable function to update practices
	const handlePracticesUpdate = async (updatedPractices: Practice[]) => {
		try {
			// Remove createdAt and updatedAt from the data being sent
			const sanitizedPractices = updatedPractices.map((item) => {
				const { createdAt, updatedAt, ...rest } = item as any;
				return rest;
			});
			
			const updatePayload = {
				practices: sanitizedPractices,
			};
			const result = await updateHomepage(updatePayload);
			if (result.success) {
				// Update local state immediately
				setPractices(updatedPractices);
				setOriginalPractices(updatedPractices);
				return true;
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update practices",
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

	const handlePracticeSubmit = async (values: typeof practiceForm.values) => {
		const updatedPractices =
			editingPractice ?
				practices.map((item) =>
					item.id === editingPractice.id ? { ...item, ...values } : item
				)
			:	[...practices, { ...values }];
		
		const success = await handlePracticesUpdate(updatedPractices as Practice[]);
		if (success) {
			notifications.show({
				title: "Success",
				message:
					editingPractice ?
						"Practice updated successfully"
					:	"Practice added successfully",
				color: "green",
			});
		}
		closePracticeModal();
		setEditingPractice(null);
		practiceForm.reset();
	};

	const handlePartnerSubmit = async (values: typeof partnerForm.values) => {
		try {
			const partnerData = {
				...values,
				logo_url:
					values.logo_url ?
						URL.createObjectURL(values.logo_url)
					:	editingPartner?.logo_url || "",
			};
			const updatedPartners =
				editingPartner ?
					originalPartners.map((item) =>
						item.id === editingPartner.id ? { ...item, ...partnerData } : item
					)
				:	[...originalPartners, { ...partnerData }];
			
			// Remove createdAt and updatedAt from the data being sent
			const sanitizedPartners = updatedPartners.map((item) => {
				const { createdAt, updatedAt, ...rest } = item as any;
				return rest;
			});
			
			const updatePayload = {
				partners: sanitizedPartners,
			};
			const result = await updateHomepage(updatePayload);
			if (result.success) {
				// Update local state immediately
				setPartners(updatedPartners as Partner[]);
				setOriginalPartners(updatedPartners as Partner[]);
				notifications.show({
					title: "Success",
					message:
						editingPartner ?
							"Partner updated successfully"
						:	"Partner added successfully",
					color: "green",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update partners",
					color: "red",
				});
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
		}
		closePartnerModal();
		setEditingPartner(null);
		partnerForm.reset();
	};

	const handleTestimonialSubmit = (values: typeof testimonialForm.values) => {
		if (editingTestimonial) {
			setTestimonials((prev) =>
				prev.map((item) =>
					item.id === editingTestimonial.id ? { ...item, ...values } : item
				)
			);
		} else {
			const newTestimonial: Testimonial = {
				id: Date.now(),
				...values
			};
			setTestimonials((prev) => [...prev, newTestimonial]);
		}
		closeTestimonialModal();
		setEditingTestimonial(null);
		testimonialForm.reset();
		notifications.show({
			title: "Success",
			message:
				editingTestimonial ?
					"Testimonial updated successfully"
				:	"Testimonial added successfully",
			color: "green",
		});
	};

	const handleContactSubmit = async (values: typeof contactForm.values) => {
		try {
			const updatedContactInfo =
				editingContact ?
					originalContactUs.map((item) =>
						item.id === editingContact.id ? { ...item, ...values } : item
					)
				:	[...originalContactUs, { ...values }];
			
			// Remove createdAt and updatedAt from the data being sent
			const sanitizedContactInfo = updatedContactInfo.map((item) => {
				const { createdAt, updatedAt, ...rest } = item as any;
				return rest;
			});
			
			const updatePayload = {
				contactUs: sanitizedContactInfo,
			};
			const result = await updateHomepage(updatePayload);
			if (result.success) {
				// Update local state immediately
				setContactInfo(updatedContactInfo as ContactInfo[]);
				setOriginalContactUs(updatedContactInfo as ContactInfo[]);
				notifications.show({
					title: "Success",
					message:
						editingContact ?
							"Contact info updated successfully"
						:	"Contact info added successfully",
					color: "green",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update contact info",
					color: "red",
				});
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
		}
		closeContactModal();
		setEditingContact(null);
		contactForm.reset();
	};

	// Edit handlers
	const handleEditStat = (stat: Stat) => {
		setEditingStat(stat);
		statForm.setValues({ stat: stat.stat, description: stat.description });
		openStatModal();
	};

	const handleEditPractice = (practice: Practice) => {
		setEditingPractice(practice);
		practiceForm.setValues({
			title: practice.title,
			description: practice.description,
		});
		openPracticeModal();
	};

	const handleEditPartner = (partner: Partner) => {
		setEditingPartner(partner);
		partnerForm.setValues({
			name: partner.name,
			description: partner.description || "",
			logo_url: null,
		});
		openPartnerModal();
	};

	const handleEditTestimonial = (testimonial: Testimonial) => {
		setEditingTestimonial(testimonial);
		testimonialForm.setValues({
			client: testimonial.client,
			position: testimonial.position,
			content: testimonial.content,
		});
		openTestimonialModal();
	};

	const handleEditContact = (contact: ContactInfo) => {
		setEditingContact(contact);
		contactForm.setValues({
			medium: contact.medium,
			email: contact.email || "",
			phone_number: contact.phone_number || "",
		});
		openContactModal();
	};

	// Delete handlers
	const handleDeleteStat = async (id: number) => {
		const updatedStats = stats.filter((item) => item.id !== id);
		const success = await handleStatsUpdate(updatedStats);
		if (success) {
			notifications.show({
				title: "Success",
				message: "Stat deleted successfully",
				color: "red",
			});
		}
	};

	const handleDeletePractice = async (id: number) => {
		const updatedPractices = practices.filter((item) => item.id !== id);
		const success = await handlePracticesUpdate(updatedPractices);
		if (success) {
			notifications.show({
				title: "Success",
				message: "Practice deleted successfully",
				color: "red",
			});
		}
	};

	const handleDeletePartner = async (id: number) => {
		try {
			const updatedPartners = partners.filter((item) => item.id !== id);
			const updatePayload = {
				partners: updatedPartners,
			};
			const result = await updateHomepage(updatePayload);
			if (result.success) {
				// Update local state immediately
				setPartners(updatedPartners);
				setOriginalPartners(updatedPartners);
				notifications.show({
					title: "Success",
					message: "Partner deleted successfully",
					color: "red",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to delete partner",
					color: "red",
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

	const handleDeleteTestimonial = async (id: number) => {
		try {
			const updatedTestimonials = testimonials.filter((item) => item.id !== id);
			const updatePayload = {
				testimonials: updatedTestimonials,
			};
			const result = await updateHomepage(updatePayload);
			if (result.success) {
				setTestimonials(updatedTestimonials);
				notifications.show({
					title: "Success",
					message: "Testimonial deleted successfully",
					color: "red",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to delete testimonial",
					color: "red",
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

	const handleDeleteContact = async (id: number) => {
		try {
			const updatedContactInfo = contactInfo.filter((item) => item.id !== id);
			const updatePayload = {
				contactUs: updatedContactInfo,
			};
			const result = await updateHomepage(updatePayload);
			if (result.success) {
				// Update local state immediately
				setContactInfo(updatedContactInfo);
				setOriginalContactUs(updatedContactInfo);
				notifications.show({
					title: "Success",
					message: "Contact info deleted successfully",
					color: "red",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to delete contact info",
					color: "red",
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

	return (
		<div style={{ padding: "24px" }}>
			<Title order={2} mb="lg">
				Homepage Management
			</Title>

			<Accordion
				multiple
				defaultValue={[
					"hero",
					"about",
					"stats",
					"practices",
					"partners",
					"contact",
				]}
			>
				{/* Hero Section */}
				<Accordion.Item value="hero">
					<Accordion.Control>
						<Title order={4}>Hero Section</Title>
					</Accordion.Control>
					<Accordion.Panel>
						<Paper withBorder p="md">
							<form onSubmit={heroForm.onSubmit(handleHeroSubmit)}>
								<Stack>
									<Grid>
										<Grid.Col span={{ base: 12, md: 6 }}>
											<div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
												Logo Image
											</div>
											<Dropzone
												accept={IMAGE_MIME_TYPE}
												onDrop={(files: File[]) => {
													heroForm.setFieldValue("logo_url", files[0]);
													setContent((prev) => ({
														...prev,
														logo_url: URL.createObjectURL(files[0]),
													}));
												}}
												multiple={false}
											>
												{content.logo_url ?
													<div
														style={{
															display: "flex",
															justifyContent: "center",
															alignItems: "center",
														}}
													>
														<Image
															src={content.logo_url}
															alt="Logo"
															h={100}
															w="auto"
															fit="contain"
														/>
													</div>
												:	<Group justify="center" align="center" style={{ height: 100 }}>
														<IconUpload size={32} />
														<Text>Drag logo here or click to select</Text>
													</Group>
												}
											</Dropzone>
										</Grid.Col>
										<Grid.Col span={{ base: 12, md: 6 }}>
											<div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
												Hero Image
											</div>
											<Dropzone
												accept={IMAGE_MIME_TYPE}
												onDrop={(files: File[]) => {
													heroForm.setFieldValue("hero_image_url", files[0]);
													setContent((prev) => ({
														...prev,
														hero_image_url: URL.createObjectURL(files[0]),
													}));
												}}
												multiple={false}
											>
												{content.hero_image_url ?
													<div
														style={{
															display: "flex",
															justifyContent: "center",
															alignItems: "center",
														}}
													>
														<Image
															src={content.hero_image_url}
															alt="Hero Image"
															h={100}
															w="auto"
															fit="contain"
														/>
													</div>
												:	<Group justify="center" align="center" style={{ height: 100 }}>
														<IconUpload size={32} />
														<Text>Drag Hero Image here or click to select</Text>
													</Group>
												}
											</Dropzone>
										</Grid.Col>
									</Grid>

									<TextInput
										label="Hero Title"
										placeholder="Enter hero title"
										{...heroForm.getInputProps("hero_title")}
									/>

									<Button type="submit">Update Hero Section</Button>
								</Stack>
							</form>
						</Paper>
					</Accordion.Panel>
				</Accordion.Item>

				{/* About Us Section */}
				<Accordion.Item value="about">
					<Accordion.Control>
						<Title order={4}>About Us</Title>
					</Accordion.Control>
					<Accordion.Panel>
						<Paper withBorder p="md">
							<Stack>
								<RichTextEditor editor={aboutUsEditor}>
									<RichTextEditor.Toolbar sticky>
										<RichTextEditor.ControlsGroup>
											<RichTextEditor.Bold />
											<RichTextEditor.Italic />
											<RichTextEditor.Underline />
											<RichTextEditor.Strikethrough />
											<RichTextEditor.ClearFormatting />
											<RichTextEditor.Highlight />
											<RichTextEditor.Code />
										</RichTextEditor.ControlsGroup>
										<RichTextEditor.ControlsGroup>
											<RichTextEditor.H1 />
											<RichTextEditor.H2 />
											<RichTextEditor.H3 />
										</RichTextEditor.ControlsGroup>
										<RichTextEditor.ControlsGroup>
											<RichTextEditor.BulletList />
											<RichTextEditor.OrderedList />
										</RichTextEditor.ControlsGroup>
										<RichTextEditor.ControlsGroup>
											<RichTextEditor.Link />
											<RichTextEditor.Unlink />
										</RichTextEditor.ControlsGroup>
										<RichTextEditor.ControlsGroup>
											<RichTextEditor.AlignLeft />
											<RichTextEditor.AlignCenter />
											<RichTextEditor.AlignJustify />
											<RichTextEditor.AlignRight />
										</RichTextEditor.ControlsGroup>
										<RichTextEditor.ControlsGroup>
											<RichTextEditor.Undo />
											<RichTextEditor.Redo />
										</RichTextEditor.ControlsGroup>
									</RichTextEditor.Toolbar>
									<RichTextEditor.Content />
								</RichTextEditor>
								<Button onClick={handleAboutUsSubmit}>Update About Us</Button>
							</Stack>
						</Paper>
					</Accordion.Panel>
				</Accordion.Item>

				{/* Stats Section */}
				<Accordion.Item value="stats">
					<Accordion.Control>
						<Title order={4}>Statistics</Title>
					</Accordion.Control>
					<Accordion.Panel>
						<Paper withBorder p="md">
							<Group justify="space-between" mb="md">
								<Text fw={500}>Statistics</Text>
								<Button
									leftSection={<IconPlus size={16} />}
									onClick={() => {
										setEditingStat(null);
										statForm.reset();
										openStatModal();
									}}
								>
									Add Statistic
								</Button>
							</Group>

							<SimpleGrid cols={{ base: 1, md: 3 }}>
								{stats.map((stat) => (
									<Paper key={stat.id} withBorder p="md">
										<Group justify="space-between" mb="xs">
											<Text fw={700} size="xl">
												{stat.stat}
											</Text>
											<Group gap="xs">
												<ActionIcon
													variant="light"
													color="orange"
													onClick={() => handleEditStat(stat)}
												>
													<IconEdit size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="red"
													onClick={() => handleDeleteStat(stat.id)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Group>
										</Group>
										<Text size="sm" c="dimmed">
											{stat.description}
										</Text>
									</Paper>
								))}
							</SimpleGrid>
						</Paper>
					</Accordion.Panel>
				</Accordion.Item>

				{/* Practices Section */}
				<Accordion.Item value="practices">
					<Accordion.Control>
						<Title order={4}>Our Practices</Title>
					</Accordion.Control>
					<Accordion.Panel>
						<Paper withBorder p="md">
							<Group justify="space-between" mb="md">
								<Text fw={500}>Practices</Text>
								<Button
									leftSection={<IconPlus size={16} />}
									onClick={() => {
										setEditingPractice(null);
										practiceForm.reset();
										openPracticeModal();
									}}
								>
									Add Practice
								</Button>
							</Group>

							<SimpleGrid cols={{ base: 1, md: 2 }}>
								{practices.map((practice) => (
									<Paper key={practice.id} withBorder p="md">
										<Group justify="space-between" mb="xs">
											<Text fw={500}>{practice.title}</Text>
											<Group gap="xs">
												<ActionIcon
													variant="light"
													color="orange"
													onClick={() => handleEditPractice(practice)}
												>
													<IconEdit size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="red"
													onClick={() => handleDeletePractice(practice.id)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Group>
										</Group>
										<Text size="sm" c="dimmed">
											{practice.description}
										</Text>
									</Paper>
								))}
							</SimpleGrid>
						</Paper>
					</Accordion.Panel>
				</Accordion.Item>

				{/* Partners Section */}
				<Accordion.Item value="partners">
					<Accordion.Control>
						<Title order={4}>Partners</Title>
					</Accordion.Control>
					<Accordion.Panel>
						<Paper withBorder p="md">
							<Group justify="space-between" mb="md">
								<Text fw={500}>Partners</Text>
								<Button
									leftSection={<IconPlus size={16} />}
									onClick={() => {
										setEditingPartner(null);
										partnerForm.reset();
										openPartnerModal();
									}}
								>
									Add Partner
								</Button>
							</Group>

							<SimpleGrid cols={{ base: 1, md: 2 }}>
								{partners.map((partner) => (
									<Paper key={partner.id} withBorder p="md">
										<Group justify="space-between" mb="xs">
											<Group>
												<Image
													src={partner.logo_url || "/placeholder.svg"}
													alt={partner.name}
													h={40}
													w={80}
													fit="contain"
												/>
												<div>
													<Text fw={500}>{partner.name}</Text>
													<Text size="sm" c="dimmed">
														{partner.description}
													</Text>
												</div>
											</Group>
											<Group gap="xs">
												<ActionIcon
													variant="light"
													color="orange"
													onClick={() => handleEditPartner(partner)}
												>
													<IconEdit size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="red"
													onClick={() => handleDeletePartner(partner.id)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Group>
										</Group>
									</Paper>
								))}
							</SimpleGrid>
						</Paper>
					</Accordion.Panel>
				</Accordion.Item>

				{/* Testimonials Section */}
				{/* <Accordion.Item value="testimonials">
					<Accordion.Control>
						<Title order={4}>Testimonials</Title>
					</Accordion.Control>
					<Accordion.Panel>
						<Paper withBorder p="md">
							<Group justify="space-between" mb="md">
								<Text fw={500}>Testimonials</Text>
								<Button
									leftSection={<IconPlus size={16} />}
									onClick={() => {
										setEditingTestimonial(null);
										testimonialForm.reset();
										openTestimonialModal();
									}}
								>
									Add Testimonial
								</Button>
							</Group>

							<SimpleGrid cols={{ base: 1, md: 2 }}>
								{testimonials.map((testimonial) => (
									<Paper key={testimonial.id} withBorder p="md">
										<Group justify="space-between" mb="xs">
											<div>
												<Text fw={500}>{testimonial.client}</Text>
												<Text size="sm" c="dimmed">
													{testimonial.position}
												</Text>
											</div>
											<Group gap="xs">
												<ActionIcon
													variant="light"
													color="orange"
													onClick={() => handleEditTestimonial(testimonial)}
												>
													<IconEdit size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="red"
													onClick={() => handleDeleteTestimonial(testimonial.id)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Group>
										</Group>
										<Text size="sm">{testimonial.content}</Text>
									</Paper>
								))}
							</SimpleGrid>
						</Paper>
					</Accordion.Panel>
				</Accordion.Item> */}

				{/* Contact Info Section */}
				{/* <Accordion.Item value="contact">
					<Accordion.Control>
						<Title order={4}>Contact Information</Title>
					</Accordion.Control>
					<Accordion.Panel>
						<Paper withBorder p="md">
							<Group justify="space-between" mb="md">
								<Text fw={500}>Contact Information</Text>
								<Button
									leftSection={<IconPlus size={16} />}
									onClick={() => {
										setEditingContact(null);
										contactForm.reset();
										openContactModal();
									}}
								>
									Add Contact Info
								</Button>
							</Group>

							<SimpleGrid cols={{ base: 1, md: 2 }}>
								{contactInfo.map((contact) => (
									<Paper key={contact.id} withBorder p="md">
										<Group justify="space-between" mb="xs">
											<div>
												<Text fw={500}>{contact.medium}</Text>
												<Text size="sm" c="dimmed">
													{contact.email || contact.phone_number}
												</Text>
											</div>
											<Group gap="xs">
												<ActionIcon
													variant="light"
													color="orange"
													onClick={() => handleEditContact(contact)}
												>
													<IconEdit size={16} />
												</ActionIcon>
												<ActionIcon
													variant="light"
													color="red"
													onClick={() => handleDeleteContact(contact.id)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Group>
										</Group>
									</Paper>
								))}
							</SimpleGrid>
						</Paper>
					</Accordion.Panel>
				</Accordion.Item> */}
			</Accordion>

			{/* Modals */}
			<Modal
				opened={statModalOpened}
				onClose={closeStatModal}
				title={editingStat ? "Edit Statistic" : "Add Statistic"}
			>
				<form onSubmit={statForm.onSubmit(handleStatSubmit)}>
					<Stack>
						<TextInput
							label="Statistic"
							placeholder="e.g., 500+"
							required
							{...statForm.getInputProps("stat")}
						/>
						<TextInput
							label="Description"
							placeholder="e.g., Happy Clients"
							required
							{...statForm.getInputProps("description")}
						/>
						<Group justify="flex-end">
							<Button variant="light" onClick={closeStatModal}>
								Cancel
							</Button>
							<Button type="submit">{editingStat ? "Update" : "Add"}</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<Modal
				opened={practiceModalOpened}
				onClose={closePracticeModal}
				title={editingPractice ? "Edit Practice" : "Add Practice"}
			>
				<form onSubmit={practiceForm.onSubmit(handlePracticeSubmit)}>
					<Stack>
						<TextInput
							label="Practice Title"
							placeholder="Enter practice title"
							required
							{...practiceForm.getInputProps("title")}
						/>
						<Textarea
							label="Description"
							placeholder="Enter practice description"
							rows={3}
							required
							{...practiceForm.getInputProps("description")}
						/>
						<Group justify="flex-end">
							<Button variant="light" onClick={closePracticeModal}>
								Cancel
							</Button>
							<Button type="submit">{editingPractice ? "Update" : "Add"}</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<Modal
				opened={partnerModalOpened}
				onClose={closePartnerModal}
				title={editingPartner ? "Edit Partner" : "Add Partner"}
			>
				<form onSubmit={partnerForm.onSubmit(handlePartnerSubmit)}>
					<Stack>
						<TextInput
							label="Partner Name"
							placeholder="Enter partner name"
							required
							{...partnerForm.getInputProps("name")}
						/>
						<FileInput
							label="Logo"
							placeholder="Upload partner logo"
							accept="image/*"
							leftSection={<IconUpload size={16} />}
							{...partnerForm.getInputProps("logo_url")}
						/>
						<Textarea
							label="Description"
							placeholder="Enter partner description"
							rows={3}
							{...partnerForm.getInputProps("description")}
						/>
						<Group justify="flex-end">
							<Button variant="light" onClick={closePartnerModal}>
								Cancel
							</Button>
							<Button type="submit">{editingPartner ? "Update" : "Add"}</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<Modal
				opened={testimonialModalOpened}
				onClose={closeTestimonialModal}
				title={editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
			>
				<form onSubmit={testimonialForm.onSubmit(handleTestimonialSubmit)}>
					<Stack>
						<TextInput
							label="Client Name"
							placeholder="Enter client name"
							required
							{...testimonialForm.getInputProps("client")}
						/>
						<TextInput
							label="Position"
							placeholder="Enter position/title"
							required
							{...testimonialForm.getInputProps("position")}
						/>
						<Textarea
							label="Testimonial Content"
							placeholder="Enter testimonial content"
							rows={4}
							required
							{...testimonialForm.getInputProps("content")}
						/>
						<Group justify="flex-end">
							<Button variant="light" onClick={closeTestimonialModal}>
								Cancel
							</Button>
							<Button type="submit">{editingTestimonial ? "Update" : "Add"}</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<Modal
				opened={contactModalOpened}
				onClose={closeContactModal}
				title={editingContact ? "Edit Contact Info" : "Add Contact Info"}
			>
				<form onSubmit={contactForm.onSubmit(handleContactSubmit)}>
					<Stack>
						<TextInput
							label="Medium"
							placeholder="e.g., Email, Phone, WhatsApp"
							required
							{...contactForm.getInputProps("medium")}
						/>
						<TextInput
							label="Email"
							placeholder="Enter email address"
							{...contactForm.getInputProps("email")}
						/>
						<TextInput
							label="Phone Number"
							placeholder="Enter phone number"
							{...contactForm.getInputProps("phone_number")}
						/>
						<Group justify="flex-end">
							<Button variant="light" onClick={closeContactModal}>
								Cancel
							</Button>
							<Button type="submit">{editingContact ? "Update" : "Add"}</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</div>
	);
}
