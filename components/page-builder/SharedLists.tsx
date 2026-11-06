"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
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
	Text,
	TextInput,
	Textarea,
	Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconDots, IconEdit, IconGripVertical, IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
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
	reorderHomepageItems,
	updateHomepageItem,
	uploadPartnerImage,
	type HomepageSection,
} from "@/app/actions/homepage.actions";
import { SortableList, arrayMove, useSortableItem } from "@/components/Sortable";
import { convertToApiUrl } from "@/lib/utils";
import { useConfirm } from "./context";

export interface Stat {
	id: number;
	stat: string;
	description: string;
}

export interface Practice {
	id: number;
	title: string;
	description: string;
}

export interface Partner {
	id: number;
	name: string;
	logo_url: string;
	description?: string | null;
}

// Soft surfaces cycled across item cards
const PASTELS = ["#ece7fb", "#e3f1fb", "#fdf1d9", "#e2f5e9", "#fde7ec", "#e8eefc"];

const notifyError = (message?: string) =>
	notifications.show({ title: "Error", message: message || "Something went wrong", color: "red" });
const notifySuccess = (message: string) => notifications.show({ title: "Saved", message, color: "green" });

// Replace one item by id, or append it when new
const upsert = <T extends { id: number }>(list: T[], item: T) =>
	list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item];

/* ---------- shared state ---------- */

// The lists are edited from their own tab and inline in the modules that show them, so they live here
interface Lists {
	stats: Stat[];
	setStats: Dispatch<SetStateAction<Stat[]>>;
	practices: Practice[];
	setPractices: Dispatch<SetStateAction<Practice[]>>;
	partners: Partner[];
	setPartners: Dispatch<SetStateAction<Partner[]>>;
}

const ListsContext = createContext<Lists | null>(null);
export const useSharedLists = () => useContext(ListsContext)!;

export function SharedListsProvider({
	initialStats,
	initialPractices,
	initialPartners,
	children,
}: {
	initialStats: Stat[];
	initialPractices: Practice[];
	initialPartners: Partner[];
	children: ReactNode;
}) {
	const [stats, setStats] = useState(initialStats);
	const [practices, setPractices] = useState(initialPractices);
	const [partners, setPartners] = useState(initialPartners);
	return (
		<ListsContext.Provider value={{ stats, setStats, practices, setPractices, partners, setPartners }}>{children}</ListsContext.Provider>
	);
}

/* ---------- pieces ---------- */

export function SectionCard({
	id,
	title,
	description,
	count,
	action,
	children,
}: {
	id: string;
	title: string;
	description: ReactNode;
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

/** Deletes one shared item after a confirmation; `drop` takes it out of local state */
function useDelete() {
	const confirm = useConfirm();
	return async (section: HomepageSection, id: number, label: string, drop: () => void) => {
		const ok = await confirm({
			title: "Delete item?",
			message: <>“{label}” will be removed everywhere this list is shown, straight away. Other items are not affected.</>,
			confirmLabel: "Delete",
		});
		if (!ok) return;
		const result = await deleteHomepageItem(section, id);
		if (!result.success) return notifyError(result.error);
		drop();
		notifySuccess(`"${label}" deleted`);
	};
}

/* ---------- statistics ---------- */

export function StatsManager({ compact = false }: { compact?: boolean }) {
	const { stats, setStats } = useSharedLists();
	const [opened, modal] = useDisclosure(false);
	const [editing, setEditing] = useState<Stat | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const remove = useDelete();
	const form = useForm({
		initialValues: { stat: "", description: "" },
		validate: {
			stat: (v) => (v.trim() ? null : "Required"),
			description: (v) => (v.trim() ? null : "Required"),
		},
	});

	const open = (stat: Stat | null) => {
		setEditing(stat);
		form.setValues({ stat: stat?.stat ?? "", description: stat?.description ?? "" });
		form.resetDirty();
		modal.open();
	};

	const submit = async (values: typeof form.values) => {
		setSubmitting(true);
		try {
			const result = editing ? await updateHomepageItem<Stat>("stats", editing.id, values) : await createHomepageItem<Stat>("stats", values);
			if (!result.success) return notifyError(result.error);
			setStats((prev) => upsert(prev, result.data));
			notifySuccess(editing ? "Statistic updated" : "Statistic added");
			modal.close();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<SectionCard
			id="stats"
			title="Statistics"
			description="Headline numbers shown by every Statistics module."
			count={stats.length}
			action={
				<Button leftSection={<IconPlus size={16} />} onClick={() => open(null)} variant={compact ? "default" : "filled"}>
					Add statistic
				</Button>
			}
		>
			{stats.length === 0 ? (
				<EmptyState label="statistics" />
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
					{stats.map((stat, i) => (
						<Paper key={stat.id} p="lg" style={{ background: PASTELS[i % PASTELS.length] }}>
							<Group justify="space-between" align="flex-start" wrap="nowrap">
								<Text fw={700} fz={28} lh={1.1}>
									{stat.stat}
								</Text>
								<ItemMenu
									label={stat.stat}
									onEdit={() => open(stat)}
									onDelete={() => remove("stats", stat.id, stat.stat, () => setStats((prev) => prev.filter((x) => x.id !== stat.id)))}
								/>
							</Group>
							<Text size="sm" c="dark.4" mt={6}>
								{stat.description}
							</Text>
						</Paper>
					))}
				</SimpleGrid>
			)}
			<Modal opened={opened} onClose={modal.close} title={editing ? "Edit statistic" : "Add statistic"}>
				<form onSubmit={form.onSubmit(submit)}>
					<Stack>
						<TextInput label="Number" placeholder="e.g. 500+" {...form.getInputProps("stat")} />
						<TextInput label="Label" placeholder="e.g. Happy clients" {...form.getInputProps("description")} />
						<Group justify="flex-end">
							<Button variant="default" onClick={modal.close} disabled={submitting}>
								Cancel
							</Button>
							<Button type="submit" loading={submitting}>
								{editing ? "Save" : "Add"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</SectionCard>
	);
}

/* ---------- practice areas ---------- */

const practiceExtensions = [StarterKit, Underline, Link, Superscript, SubScript, Highlight, TextAlign.configure({ types: ["heading", "paragraph"] })];

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

export function PracticesManager({ compact = false }: { compact?: boolean }) {
	const { practices, setPractices } = useSharedLists();
	const [opened, modal] = useDisclosure(false);
	const [editing, setEditing] = useState<Practice | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const remove = useDelete();
	const editor = useEditor({ extensions: practiceExtensions, content: "", immediatelyRender: false });
	const form = useForm({ initialValues: { title: "" }, validate: { title: (v) => (v.trim() ? null : "Required") } });

	const open = (practice: Practice | null) => {
		setEditing(practice);
		form.setValues({ title: practice?.title ?? "" });
		editor?.commands.setContent(practice?.description ?? "");
		modal.open();
	};

	const submit = async (values: typeof form.values) => {
		const description = editor?.getHTML() ?? "";
		if (!editor || editor.isEmpty) return notifyError("Description is required");
		setSubmitting(true);
		try {
			const data = { title: values.title.trim().toUpperCase(), description };
			const result = editing
				? await updateHomepageItem<Practice>("practices", editing.id, data)
				: await createHomepageItem<Practice>("practices", data);
			if (!result.success) return notifyError(result.error);
			setPractices((prev) => upsert(prev, result.data));
			notifySuccess(editing ? "Practice area updated" : "Practice area added");
			modal.close();
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<SectionCard
			id="practices"
			title="Practice areas"
			description="The cards every Practice areas module shows."
			count={practices.length}
			action={
				<Button leftSection={<IconPlus size={16} />} onClick={() => open(null)} variant={compact ? "default" : "filled"}>
					Add practice area
				</Button>
			}
		>
			{practices.length === 0 ? (
				<EmptyState label="practice areas" />
			) : (
				<SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
					{practices.map((practice, i) => (
						<Paper key={practice.id} p="lg" style={{ background: PASTELS[i % PASTELS.length] }}>
							<Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
								<Text fw={600}>{practice.title}</Text>
								<ItemMenu
									label={practice.title}
									onEdit={() => open(practice)}
									onDelete={() =>
										remove("practices", practice.id, practice.title, () => setPractices((prev) => prev.filter((x) => x.id !== practice.id)))
									}
								/>
							</Group>
							<Text size="sm" c="dark.4" lineClamp={4} className="rich-text-content" dangerouslySetInnerHTML={{ __html: practice.description }} />
						</Paper>
					))}
				</SimpleGrid>
			)}
			<Modal opened={opened} onClose={modal.close} title={editing ? "Edit practice area" : "Add practice area"} size="lg">
				<form onSubmit={form.onSubmit(submit)}>
					<Stack>
						<TextInput label="Title" placeholder="e.g. Corporate law" {...form.getInputProps("title")} />
						<div>
							<Text size="sm" fw={500} mb={6}>
								Description
							</Text>
							<RichEditor editor={editor} />
						</div>
						<Group justify="flex-end">
							<Button variant="default" onClick={modal.close} disabled={submitting}>
								Cancel
							</Button>
							<Button type="submit" loading={submitting}>
								{editing ? "Save" : "Add"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</SectionCard>
	);
}

/* ---------- partners ---------- */

/** A partner's card; dragged anywhere on it to change the order. */
function PartnerCard({ partner, position, onEdit, onDelete }: { partner: Partner; position: number; onEdit: () => void; onDelete: () => void }) {
	const { itemProps, dragProps } = useSortableItem(partner.id);
	return (
		<Paper withBorder p="md" {...itemProps} {...dragProps} style={{ ...itemProps.style, ...dragProps.style }}>
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
							draggable={false}
							style={{ width: "100%", height: "100%", objectFit: "contain" }}
						/>
					</Box>
					<div style={{ minWidth: 0 }}>
						<Text size="xs" c="dimmed" fw={600}>
							{String(position).padStart(2, "0")}
						</Text>
						<Text fw={600} truncate>
							{partner.name}
						</Text>
						<Text size="sm" c="dimmed" lineClamp={2}>
							{partner.description || "No description"}
						</Text>
					</div>
				</Group>
				{/* Enter and Space on the menu open it rather than picking the card up */}
				<div onKeyDown={(e) => e.stopPropagation()}>
					<ItemMenu label={partner.name} onEdit={onEdit} onDelete={onDelete} />
				</div>
			</Group>
			<IconGripVertical size={16} color="var(--mantine-color-gray-5)" aria-hidden style={{ position: "absolute", right: 12, bottom: 12 }} />
		</Paper>
	);
}

export function PartnersManager({ compact = false }: { compact?: boolean }) {
	const { partners, setPartners } = useSharedLists();
	const [opened, modal] = useDisclosure(false);
	const [editing, setEditing] = useState<Partner | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const remove = useDelete();
	const form = useForm({
		initialValues: { name: "", description: "", logo: null as File | null },
		validate: { name: (v) => (v.trim() ? null : "Required") },
	});

	const open = (partner: Partner | null) => {
		setEditing(partner);
		form.setValues({ name: partner?.name ?? "", description: partner?.description ?? "", logo: null });
		modal.open();
	};

	const submit = async (values: typeof form.values) => {
		if (!editing && !values.logo) {
			form.setFieldError("logo", "A logo is required");
			return;
		}
		setSubmitting(true);
		try {
			let logo_url = editing?.logo_url;
			if (values.logo) {
				const upload = await uploadPartnerImage(values.logo);
				if (!upload.success) return notifyError(upload.error);
				logo_url = upload.data.imageUrl;
			}
			const data = { name: values.name.trim(), description: values.description.trim(), logo_url };
			const result = editing
				? await updateHomepageItem<Partner>("partners", editing.id, data)
				: await createHomepageItem<Partner>("partners", data);
			if (!result.success) return notifyError(result.error);
			setPartners((prev) => upsert(prev, result.data));
			notifySuccess(editing ? "Partner updated" : "Partner added");
			modal.close();
		} finally {
			setSubmitting(false);
		}
	};

	// Reorders at once and saves; puts the old order back if the save fails
	const move = async (from: number, to: number) => {
		const previous = partners;
		const next = arrayMove(partners, from, to);
		setPartners(next);
		const result = await reorderHomepageItems<Partner>("partners", next.map((p) => p.id));
		if (!result.success) {
			setPartners(previous);
			notifyError(result.error);
		} else notifySuccess("Partner order saved");
	};

	return (
		<SectionCard
			id="partners"
			title="Partners"
			description="Logos every Partner logos module shows, in this order. Drag a card to move it."
			count={partners.length}
			action={
				<Button leftSection={<IconPlus size={16} />} onClick={() => open(null)} variant={compact ? "default" : "filled"}>
					Add partner
				</Button>
			}
		>
			{partners.length === 0 ? (
				<EmptyState label="partners" />
			) : (
				<SortableList ids={partners.map((p) => p.id)} layout="grid" onMove={move}>
					<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
						{partners.map((partner, index) => (
							<PartnerCard
								key={partner.id}
								partner={partner}
								position={index + 1}
								onEdit={() => open(partner)}
								onDelete={() => remove("partners", partner.id, partner.name, () => setPartners((prev) => prev.filter((x) => x.id !== partner.id)))}
							/>
						))}
					</SimpleGrid>
				</SortableList>
			)}
			<Modal opened={opened} onClose={modal.close} title={editing ? "Edit partner" : "Add partner"}>
				<form onSubmit={form.onSubmit(submit)}>
					<Stack>
						<TextInput label="Name" placeholder="Partner name" {...form.getInputProps("name")} />
						<FileInput
							label="Logo"
							placeholder={editing ? "Keep current logo" : "Upload logo"}
							accept="image/*"
							clearable
							leftSection={<IconUpload size={16} />}
							{...form.getInputProps("logo")}
						/>
						<Textarea label="Description" rows={3} {...form.getInputProps("description")} />
						<Group justify="flex-end">
							<Button variant="default" onClick={modal.close} disabled={submitting}>
								Cancel
							</Button>
							<Button type="submit" loading={submitting}>
								{editing ? "Save" : "Add"}
							</Button>
						</Group>
					</Stack>
				</form>
			</Modal>
		</SectionCard>
	);
}
