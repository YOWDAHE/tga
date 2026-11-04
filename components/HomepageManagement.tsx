"use client";

import { useCallback, useState, type ReactNode } from "react";
import "@mantine/tiptap/styles.css";
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	FileInput,
	Group,
	Menu,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Tabs,
	Text,
	TextInput,
	Textarea,
	Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { convertToApiUrl } from "@/lib/utils";
import {
	IconDots,
	IconEdit,
	IconExternalLink,
	IconPlus,
	IconTrash,
	IconUpload,
} from "@tabler/icons-react";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import {
	createHomepageItem,
	deleteHomepageItem,
	updateHomepageItem,
	uploadPartnerImage,
	type HomepageSection,
} from "@/app/actions/homepage.actions";
import {
	AboutEditor,
	HeroEditor,
	ServicesEditor,
	StatementEditor,
	type HomeContent,
} from "@/components/HomeContentEditor";
import { PageHeader } from "@/components/admin-ui";

interface Stat {
	id: number;
	stat: string;
	description: string;
}

interface Practice {
	id: number;
	title: string;
	description: string;
}

interface Partner {
	id: number;
	name: string;
	logo_url: string;
	description?: string | null;
}

interface HomepageManagementProps {
	initialStats?: Stat[];
	initialPractices?: Practice[];
	initialPartners?: Partner[];
	/** Written sections; the editor is hidden when the backend didn't send them */
	initialHomeContent?: HomeContent | null;
}

// Soft surfaces cycled across item cards
const PASTELS = ["#ece7fb", "#e3f1fb", "#fdf1d9", "#e2f5e9", "#fde7ec", "#e8eefc"];

const WRITTEN: string[] = ["hero", "statement", "about", "services"];

// The tabs, in the order the sections appear on the public home page
const TABS = [
	{ id: "hero", label: "Hero" },
	{ id: "statement", label: "Statement" },
	{ id: "about", label: "About" },
	{ id: "stats", label: "Statistics" },
	{ id: "services", label: "Services" },
	{ id: "practices", label: "Practice areas" },
	{ id: "partners", label: "Partners" },
] as const;

// Where "View site" opens: the public site shares this domain in production
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "") || "/";

const editorExtensions = [
	StarterKit,
	Underline,
	Link,
	Superscript,
	SubScript,
	Highlight,
	TextAlign.configure({ types: ["heading", "paragraph"] }),
];

const notifyError = (message?: string) =>
	notifications.show({ title: "Error", message: message || "Something went wrong", color: "red" });
const notifySuccess = (message: string) =>
	notifications.show({ title: "Saved", message, color: "green" });

function SectionCard({
	id,
	title,
	description,
	count,
	action,
	children,
}: {
	id: string;
	title: string;
	description: string;
	count?: number;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<Paper id={`section-${id}`} withBorder p={{ base: "md", sm: "xl" }} style={{ scrollMarginTop: 16 }}>
			<Group justify="space-between" align="flex-start" mb="lg" gap="sm">
				<div>
					<Group gap="xs">
						<Title order={3}>{title}</Title>
						{count !== undefined && (
							<Badge color="gray" variant="light">
								{count}
							</Badge>
						)}
					</Group>
					<Text size="sm" c="dimmed" mt={4}>
						{description}
					</Text>
				</div>
				{action}
			</Group>
			{children}
		</Paper>
	);
}

function ItemMenu({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label: string }) {
	return (
		<Menu position="bottom-end" withinPortal>
			<Menu.Target>
				<ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${label}`}>
					<IconDots size={18} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item leftSection={<IconEdit size={14} />} onClick={onEdit}>
					Edit
				</Menu.Item>
				<Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={onDelete}>
					Delete
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}

function EmptyState({ label }: { label: string }) {
	return (
		<Box py="xl" ta="center">
			<Text c="dimmed" size="sm">
				No {label} yet.
			</Text>
		</Box>
	);
}

function RichEditor({ editor }: { editor: Editor | null }) {
	return (
		<RichTextEditor editor={editor} style={{ borderRadius: 12 }}>
			<RichTextEditor.Toolbar>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.Bold />
					<RichTextEditor.Italic />
					<RichTextEditor.Underline />
					<RichTextEditor.Highlight />
				</RichTextEditor.ControlsGroup>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.H2 />
					<RichTextEditor.H3 />
					<RichTextEditor.BulletList />
					<RichTextEditor.OrderedList />
					<RichTextEditor.Blockquote />
				</RichTextEditor.ControlsGroup>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.Link />
					<RichTextEditor.Unlink />
				</RichTextEditor.ControlsGroup>
				<RichTextEditor.ControlsGroup>
					<RichTextEditor.AlignLeft />
					<RichTextEditor.AlignCenter />
					<RichTextEditor.AlignRight />
				</RichTextEditor.ControlsGroup>
			</RichTextEditor.Toolbar>
			<RichTextEditor.Content />
		</RichTextEditor>
	);
}

type PendingDelete = { section: HomepageSection; id: number; label: string } | null;

export default function HomepageManagement({
	initialStats = [],
	initialPractices = [],
	initialPartners = [],
	initialHomeContent = null,
}: HomepageManagementProps) {
	const [stats, setStats] = useState<Stat[]>(initialStats);
	const [practices, setPractices] = useState<Practice[]>(initialPractices);
	const [partners, setPartners] = useState<Partner[]>(initialPartners);

	const [submitting, setSubmitting] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

	const [statModalOpened, statModal] = useDisclosure(false);
	const [practiceModalOpened, practiceModal] = useDisclosure(false);
	const [partnerModalOpened, partnerModal] = useDisclosure(false);
	const [editingStat, setEditingStat] = useState<Stat | null>(null);
	const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
	const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

	const practiceEditor = useEditor({
		extensions: editorExtensions,
		content: "",
		immediatelyRender: false,
	});

	const statForm = useForm({
		initialValues: { stat: "", description: "" },
		validate: {
			stat: (v) => (v.trim() ? null : "Required"),
			description: (v) => (v.trim() ? null : "Required"),
		},
	});
	const practiceForm = useForm({
		initialValues: { title: "" },
		validate: { title: (v) => (v.trim() ? null : "Required") },
	});
	const partnerForm = useForm({
		initialValues: { name: "", description: "", logo: null as File | null },
		validate: { name: (v) => (v.trim() ? null : "Required") },
	});

	// Replace one item by id, or append it when new
	const upsert = <T extends { id: number }>(list: T[], item: T) =>
		list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item];

	const openStat = (stat: Stat | null) => {
		setEditingStat(stat);
		statForm.setValues({ stat: stat?.stat ?? "", description: stat?.description ?? "" });
		statForm.resetDirty();
		statModal.open();
	};

	const handleStatSubmit = async (values: typeof statForm.values) => {
		setSubmitting(true);
		try {
			const result =
				editingStat ?
					await updateHomepageItem<Stat>("stats", editingStat.id, values)
				:	await createHomepageItem<Stat>("stats", values);
			if (!result.success) return notifyError(result.error);
			setStats((prev) => upsert(prev, result.data));
			notifySuccess(editingStat ? "Statistic updated" : "Statistic added");
			statModal.close();
		} finally {
			setSubmitting(false);
		}
	};

	const openPractice = (practice: Practice | null) => {
		setEditingPractice(practice);
		practiceForm.setValues({ title: practice?.title ?? "" });
		practiceEditor?.commands.setContent(practice?.description ?? "");
		practiceModal.open();
	};

	const handlePracticeSubmit = async (values: typeof practiceForm.values) => {
		const description = practiceEditor?.getHTML() ?? "";
		if (!practiceEditor || practiceEditor.isEmpty) return notifyError("Description is required");
		setSubmitting(true);
		try {
			const data = { title: values.title.trim().toUpperCase(), description };
			const result =
				editingPractice ?
					await updateHomepageItem<Practice>("practices", editingPractice.id, data)
				:	await createHomepageItem<Practice>("practices", data);
			if (!result.success) return notifyError(result.error);
			setPractices((prev) => upsert(prev, result.data));
			notifySuccess(editingPractice ? "Practice area updated" : "Practice area added");
			practiceModal.close();
		} finally {
			setSubmitting(false);
		}
	};

	const openPartner = (partner: Partner | null) => {
		setEditingPartner(partner);
		partnerForm.setValues({ name: partner?.name ?? "", description: partner?.description ?? "", logo: null });
		partnerModal.open();
	};

	const handlePartnerSubmit = async (values: typeof partnerForm.values) => {
		if (!editingPartner && !values.logo) {
			partnerForm.setFieldError("logo", "A logo is required");
			return;
		}
		setSubmitting(true);
		try {
			let logo_url = editingPartner?.logo_url;
			if (values.logo) {
				const upload = await uploadPartnerImage(values.logo);
				if (!upload.success) return notifyError(upload.error);
				logo_url = upload.data.imageUrl;
			}
			const data = { name: values.name.trim(), description: values.description.trim(), logo_url };
			const result =
				editingPartner ?
					await updateHomepageItem<Partner>("partners", editingPartner.id, data)
				:	await createHomepageItem<Partner>("partners", data);
			if (!result.success) return notifyError(result.error);
			setPartners((prev) => upsert(prev, result.data));
			notifySuccess(editingPartner ? "Partner updated" : "Partner added");
			partnerModal.close();
		} finally {
			setSubmitting(false);
		}
	};

	const confirmDelete = async () => {
		if (!pendingDelete) return;
		const { section, id, label } = pendingDelete;
		setDeleting(true);
		try {
			const result = await deleteHomepageItem(section, id);
			if (!result.success) return notifyError(result.error);
			// Only the deleted row leaves local state; everything else is untouched
			if (section === "stats") setStats((prev) => prev.filter((i) => i.id !== id));
			if (section === "practices") setPractices((prev) => prev.filter((i) => i.id !== id));
			if (section === "partners") setPartners((prev) => prev.filter((i) => i.id !== id));
			notifySuccess(`"${label}" deleted`);
			setPendingDelete(null);
		} finally {
			setDeleting(false);
		}
	};

	const [tab, setTab] = useState<string>(initialHomeContent ? "hero" : "stats");
	// Written sections with unsaved edits get a dot on their tab
	const [dirty, setDirty] = useState<Record<string, boolean>>({});
	const onDirtyChange = useCallback(
		(key: string, isDirty: boolean) => setDirty((d) => (d[key] === isDirty ? d : { ...d, [key]: isDirty })),
		[]
	);
	const counts: Record<string, number> = { stats: stats.length, practices: practices.length, partners: partners.length };
	const tabBadge = (id: string) =>
		dirty[id] ? (
			<Box w={8} h={8} bg="orange.5" style={{ borderRadius: 99 }} aria-label="Unsaved changes" />
		) : counts[id] !== undefined ? (
			<Text size="xs" c={id === tab ? "gray.4" : "dimmed"} fw={500}>
				{counts[id]}
			</Text>
		) : null;

	return (
		<Box p={{ base: "sm", sm: "lg" }} maw={1100}>
			<PageHeader
				eyebrow="Website"
				title="Homepage"
				description="Everything on the public home page, section by section. Written sections publish with their own save bar; list items save one at a time."
				actions={
					<Button
						component="a"
						href={SITE_URL}
						target="_blank"
						rel="noopener noreferrer"
						variant="default"
						radius="xl"
						rightSection={<IconExternalLink size={16} />}
					>
						View site
					</Button>
				}
			/>

			<Tabs value={tab} onChange={(value) => value && setTab(value)} variant="pills" radius="xl">
				<Tabs.List mb="xl">
					{TABS.filter((t) => initialHomeContent || !WRITTEN.includes(t.id)).map((t) => (
						<Tabs.Tab key={t.id} value={t.id} rightSection={tabBadge(t.id)}>
							{t.label}
						</Tabs.Tab>
					))}
				</Tabs.List>

				{initialHomeContent && (
					<>
						<Tabs.Panel value="hero">
							<HeroEditor initial={initialHomeContent.hero} onDirtyChange={onDirtyChange} />
						</Tabs.Panel>
						<Tabs.Panel value="statement">
							<StatementEditor initial={initialHomeContent.statement} onDirtyChange={onDirtyChange} />
						</Tabs.Panel>
						<Tabs.Panel value="about">
							<AboutEditor initial={initialHomeContent.about} onDirtyChange={onDirtyChange} />
						</Tabs.Panel>
						<Tabs.Panel value="services">
							<ServicesEditor initial={initialHomeContent.services} onDirtyChange={onDirtyChange} />
						</Tabs.Panel>
					</>
				)}

				<Tabs.Panel value="stats">
					<SectionCard
						id="stats"
						title="Statistics"
						description="Headline numbers shown in the statistics strip."
						count={stats.length}
						action={
							<Button leftSection={<IconPlus size={16} />} onClick={() => openStat(null)}>
								Add statistic
							</Button>
						}
					>
						{stats.length === 0 ?
							<EmptyState label="statistics" />
						:	<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
								{stats.map((stat, i) => (
									<Paper key={stat.id} p="lg" style={{ background: PASTELS[i % PASTELS.length] }}>
										<Group justify="space-between" align="flex-start" wrap="nowrap">
											<Text fw={700} fz={28} lh={1.1}>
												{stat.stat}
											</Text>
											<ItemMenu
												label={stat.stat}
												onEdit={() => openStat(stat)}
												onDelete={() => setPendingDelete({ section: "stats", id: stat.id, label: stat.stat })}
											/>
										</Group>
										<Text size="sm" c="dark.4" mt={6}>
											{stat.description}
										</Text>
									</Paper>
								))}
							</SimpleGrid>
						}
					</SectionCard>
				</Tabs.Panel>
				<Tabs.Panel value="practices">
					<SectionCard
						id="practices"
						title="Practice areas"
						description="Services listed under “Our practices”."
						count={practices.length}
						action={
							<Button leftSection={<IconPlus size={16} />} onClick={() => openPractice(null)}>
								Add practice area
							</Button>
						}
					>
						{practices.length === 0 ?
							<EmptyState label="practice areas" />
						:	<SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
								{practices.map((practice, i) => (
									<Paper key={practice.id} p="lg" style={{ background: PASTELS[i % PASTELS.length] }}>
										<Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
											<Text fw={600}>{practice.title}</Text>
											<ItemMenu
												label={practice.title}
												onEdit={() => openPractice(practice)}
												onDelete={() =>
													setPendingDelete({ section: "practices", id: practice.id, label: practice.title })
												}
											/>
										</Group>
										<Text
											size="sm"
											c="dark.4"
											lineClamp={4}
											className="rich-text-content"
											dangerouslySetInnerHTML={{ __html: practice.description }}
										/>
									</Paper>
								))}
							</SimpleGrid>
						}
					</SectionCard>
				</Tabs.Panel>
				<Tabs.Panel value="partners">
					<SectionCard
						id="partners"
						title="Partners"
						description="Logos shown in the partners carousel."
						count={partners.length}
						action={
							<Button leftSection={<IconPlus size={16} />} onClick={() => openPartner(null)}>
								Add partner
							</Button>
						}
					>
						{partners.length === 0 ?
							<EmptyState label="partners" />
						:	<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
								{partners.map((partner) => (
									<Paper key={partner.id} withBorder p="md">
										<Group justify="space-between" align="flex-start" wrap="nowrap">
											<Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
												<Box
													style={{
														width: 72,
														height: 72,
														flexShrink: 0,
														borderRadius: 14,
														background: "#f4f5f7",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														overflow: "hidden",
													}}
												>
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img
														src={convertToApiUrl(partner.logo_url)}
														alt={partner.name}
														style={{ width: "100%", height: "100%", objectFit: "contain" }}
													/>
												</Box>
												<div style={{ minWidth: 0 }}>
													<Text fw={600} truncate>
														{partner.name}
													</Text>
													<Text size="sm" c="dimmed" lineClamp={2}>
														{partner.description || "No description"}
													</Text>
												</div>
											</Group>
											<ItemMenu
												label={partner.name}
												onEdit={() => openPartner(partner)}
												onDelete={() => setPendingDelete({ section: "partners", id: partner.id, label: partner.name })}
											/>
										</Group>
									</Paper>
								))}
							</SimpleGrid>
						}
					</SectionCard>
				</Tabs.Panel>
			</Tabs>

			<Modal opened={statModalOpened} onClose={statModal.close} title={editingStat ? "Edit statistic" : "Add statistic"}>
				<form onSubmit={statForm.onSubmit(handleStatSubmit)}>
					<Stack>
						<TextInput label="Number" placeholder="e.g. 500+" {...statForm.getInputProps("stat")} />
						<TextInput label="Label" placeholder="e.g. Happy clients" {...statForm.getInputProps("description")} />
						<Group justify="flex-end">
							<Button variant="default" onClick={statModal.close} disabled={submitting}>
								Cancel
							</Button>
							<Button type="submit" loading={submitting}>
								{editingStat ? "Save" : "Add"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<Modal
				opened={practiceModalOpened}
				onClose={practiceModal.close}
				title={editingPractice ? "Edit practice area" : "Add practice area"}
				size="lg"
			>
				<form onSubmit={practiceForm.onSubmit(handlePracticeSubmit)}>
					<Stack>
						<TextInput label="Title" placeholder="e.g. Corporate law" {...practiceForm.getInputProps("title")} />
						<div>
							<Text size="sm" fw={500} mb={6}>
								Description
							</Text>
							<RichEditor editor={practiceEditor} />
						</div>
						<Group justify="flex-end">
							<Button variant="default" onClick={practiceModal.close} disabled={submitting}>
								Cancel
							</Button>
							<Button type="submit" loading={submitting}>
								{editingPractice ? "Save" : "Add"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<Modal opened={partnerModalOpened} onClose={partnerModal.close} title={editingPartner ? "Edit partner" : "Add partner"}>
				<form onSubmit={partnerForm.onSubmit(handlePartnerSubmit)}>
					<Stack>
						<TextInput label="Name" placeholder="Partner name" {...partnerForm.getInputProps("name")} />
						<FileInput
							label="Logo"
							placeholder={editingPartner ? "Keep current logo" : "Upload logo"}
							accept="image/*"
							clearable
							leftSection={<IconUpload size={16} />}
							{...partnerForm.getInputProps("logo")}
						/>
						<Textarea label="Description" rows={3} {...partnerForm.getInputProps("description")} />
						<Group justify="flex-end">
							<Button variant="default" onClick={partnerModal.close} disabled={submitting}>
								Cancel
							</Button>
							<Button type="submit" loading={submitting}>
								{editingPartner ? "Save" : "Add"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>

			<Modal opened={pendingDelete !== null} onClose={() => setPendingDelete(null)} title="Delete item?" size="sm">
				<Stack>
					<Text size="sm">
						“{pendingDelete?.label}” will be removed from the homepage. Other items are not affected.
					</Text>
					<Group justify="flex-end">
						<Button variant="default" onClick={() => setPendingDelete(null)} disabled={deleting}>
							Cancel
						</Button>
						<Button color="red" onClick={confirmDelete} loading={deleting}>
							Delete
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Box>
	);
}
