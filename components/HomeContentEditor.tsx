"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import "@mantine/tiptap/styles.css";
import {
	Accordion,
	ActionIcon,
	Box,
	Button,
	FileButton,
	Group,
	Paper,
	Tabs,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Textarea,
	Title,
	Transition,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	IconArrowDown,
	IconArrowUp,
	IconPhotoPlus,
	IconPlus,
	IconTrash,
	IconX,
} from "@tabler/icons-react";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { convertToApiUrl } from "@/lib/utils";
import { saveHomeContent, uploadHomeContentImage, type HomeContentKey } from "@/app/actions/homepage.actions";

// The site's palette, offered as one-click swatches; the picker's wheel is still there for anything else
export const THEME_COLORS = ["#0B1B4D", "#007A5E", "#3E78D6", "#B9821C", "#7559C9", "#5A6377"];

const richExtensions = [StarterKit, Underline, Link, TextStyle, Color];

export interface HomeContent {
	hero: {
		label: string;
		slides: Array<{ title: string; text: string }>;
		highlight: { value: string; word: string; caption: string };
	};
	statement: { html: string };
	about: {
		label: string;
		title: string;
		description: string;
		lists: Array<{ title: string; html: string }>;
		milestones: { label: string; slides: Array<{ html: string; images: string[] }> };
		partner: { label: string; name: string; photo: string; bio: string };
	};
	services: { label: string; title: string; description: string; items: Array<{ title: string; html: string }> };
}

const notifyError = (message?: string) =>
	notifications.show({ title: "Error", message: message || "Something went wrong", color: "red" });

// Images that ship with the public site ("/Images/…") load from the site, which shares this domain in
// production (set NEXT_PUBLIC_SITE_URL when it doesn't, as in local dev); uploads go through the proxy
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
const imageSrc = (url: string) =>
	url.startsWith("/") && !url.startsWith("/office/") ? `${SITE_URL}${url}` : convertToApiUrl(url);

const plainText = (html: string) =>
	html
		.replace(/<\/(p|li|h\d)>|<br\s*\/?>/g, " ")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();

/* ---------- list helpers ---------- */

// List entries carry a local id so their editors keep their own state when entries move
type Keyed<T> = T & { _id: number };
let nextId = 1;
const withIds = <T extends object>(list: T[]): Keyed<T>[] => list.map((item) => ({ ...item, _id: nextId++ }));
const withoutIds = <T extends object>(list: Keyed<T>[]): T[] => list.map(({ _id, ...item }) => item as unknown as T);
const move = <T,>(list: T[], from: number, to: number) => {
	const next = [...list];
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
};
const patchById = <T extends { _id: number }>(list: T[], id: number, patch: Partial<T>) =>
	list.map((item) => (item._id === id ? { ...item, ...patch } : item));

/* ---------- fields ---------- */

/** Rich text with the theme colour swatches. Keyed by its list item, so it only reads `value` on mount. */
function RichField({
	label,
	description,
	value,
	onChange,
	lists = false,
	minHeight = 110,
}: {
	label: string;
	description?: string;
	value: string;
	onChange: (html: string) => void;
	/** Show the bullet/numbered list buttons */
	lists?: boolean;
	minHeight?: number;
}) {
	const editor = useEditor({
		extensions: richExtensions,
		content: value,
		immediatelyRender: false,
		onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
	});

	return (
		<div>
			<Text size="sm" fw={500}>
				{label}
			</Text>
			{description && (
				<Text size="xs" c="dimmed">
					{description}
				</Text>
			)}
			<RichTextEditor editor={editor} mt={6}>
				<RichTextEditor.Toolbar>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Bold />
						<RichTextEditor.Italic />
						<RichTextEditor.Underline />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						{THEME_COLORS.slice(0, 5).map((color) => (
							<RichTextEditor.Color key={color} color={color} />
						))}
						<RichTextEditor.ColorPicker colors={THEME_COLORS} />
						<RichTextEditor.UnsetColor />
					</RichTextEditor.ControlsGroup>
					{lists && (
						<RichTextEditor.ControlsGroup>
							<RichTextEditor.BulletList />
							<RichTextEditor.OrderedList />
						</RichTextEditor.ControlsGroup>
					)}
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Link />
						<RichTextEditor.Unlink />
					</RichTextEditor.ControlsGroup>
				</RichTextEditor.Toolbar>
				<RichTextEditor.Content style={{ minHeight }} />
			</RichTextEditor>
		</div>
	);
}

/** Thumbnails with remove buttons, plus a tile that uploads another. */
function ImagesField({
	label,
	images,
	onChange,
	single = false,
}: {
	label: string;
	images: string[];
	onChange: (images: string[]) => void;
	/** One image only: uploading replaces it */
	single?: boolean;
}) {
	const [uploading, setUploading] = useState(false);
	const size = single ? { w: 160, h: 200 } : { w: 132, h: 96 };

	const upload = async (file: File | null) => {
		if (!file) return;
		setUploading(true);
		try {
			const result = await uploadHomeContentImage(file);
			if (!result.success) return notifyError(result.error);
			onChange(single ? [result.url] : [...images, result.url]);
		} finally {
			setUploading(false);
		}
	};

	return (
		<div>
			<Text size="sm" fw={500} mb={6}>
				{label}
			</Text>
			<Group gap="sm" align="flex-start">
				{images.map((url, i) => (
					<Box key={`${url}-${i}`} pos="relative" {...size}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={imageSrc(url)}
							alt=""
							style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, background: "#eceef1" }}
						/>
						{!single && (
							<ActionIcon
								size="sm"
								radius="xl"
								color="dark"
								variant="filled"
								pos="absolute"
								top={6}
								right={6}
								onClick={() => onChange(images.filter((_, j) => j !== i))}
								aria-label="Remove image"
							>
								<IconX size={12} />
							</ActionIcon>
						)}
					</Box>
				))}
				<FileButton onChange={upload} accept="image/png,image/jpeg,image/webp,image/gif">
					{(props) => (
						<Button
							{...props}
							variant="default"
							loading={uploading}
							{...size}
							styles={{ root: { borderStyle: "dashed", borderRadius: 10 }, inner: { flexDirection: "column", gap: 4 } }}
						>
							<IconPhotoPlus size={20} />
							<Text size="xs" mt={4}>
								{single && images.length ? "Replace" : "Upload"}
							</Text>
						</Button>
					)}
				</FileButton>
			</Group>
		</div>
	);
}

/* ---------- repeatable lists ---------- */

/** Collapsible rows for slides, lists and services: a summary line, controls, and the fields inside. */
function ItemList<T extends { _id: number }>({
	items,
	itemLabel,
	summary,
	onChange,
	newItem,
	min = 0,
	children,
}: {
	items: T[];
	/** "Slide", "Service"… */
	itemLabel: string;
	summary: (item: T) => string;
	onChange: (items: T[]) => void;
	newItem: () => T;
	/** Keep at least this many entries */
	min?: number;
	children: (item: T) => ReactNode;
}) {
	const [open, setOpen] = useState<string | null>(null);

	return (
		<Stack gap="sm">
			<Accordion value={open} onChange={setOpen} variant="separated" radius="md" chevronPosition="left">
				{items.map((item, index) => (
					<Accordion.Item key={item._id} value={String(item._id)}>
						<Group gap={4} wrap="nowrap" pr="xs">
							<Accordion.Control>
								<Group gap="sm" wrap="nowrap">
									<Text size="xs" c="dimmed" fw={600} w={22} style={{ flexShrink: 0 }}>
										{String(index + 1).padStart(2, "0")}
									</Text>
									<Text size="sm" fw={500} lineClamp={1}>
										{summary(item) || `Untitled ${itemLabel.toLowerCase()}`}
									</Text>
								</Group>
							</Accordion.Control>
							<ActionIcon
								variant="subtle"
								color="gray"
								disabled={index === 0}
								onClick={() => onChange(move(items, index, index - 1))}
								aria-label={`Move ${itemLabel.toLowerCase()} up`}
							>
								<IconArrowUp size={16} />
							</ActionIcon>
							<ActionIcon
								variant="subtle"
								color="gray"
								disabled={index === items.length - 1}
								onClick={() => onChange(move(items, index, index + 1))}
								aria-label={`Move ${itemLabel.toLowerCase()} down`}
							>
								<IconArrowDown size={16} />
							</ActionIcon>
							<ActionIcon
								variant="subtle"
								color="red"
								disabled={items.length <= min}
								onClick={() => onChange(items.filter((x) => x._id !== item._id))}
								aria-label={`Remove ${itemLabel.toLowerCase()}`}
							>
								<IconTrash size={16} />
							</ActionIcon>
						</Group>
						<Accordion.Panel>
							<Stack gap="md" pt={4}>
								{children(item)}
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
			<Button
				variant="default"
				leftSection={<IconPlus size={16} />}
				style={{ alignSelf: "flex-start" }}
				onClick={() => {
					const item = newItem();
					onChange([...items, item]);
					setOpen(String(item._id));
				}}
			>
				Add {itemLabel.toLowerCase()}
			</Button>
		</Stack>
	);
}

/* ---------- section frame ---------- */

/** A titled group of fields inside a section. */
function Block({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
	return (
		<Paper withBorder p={{ base: "md", sm: "lg" }} radius="lg">
			<Title order={4}>{title}</Title>
			{description && (
				<Text size="sm" c="dimmed" mt={2}>
					{description}
				</Text>
			)}
			<Stack gap="md" mt="md">
				{children}
			</Stack>
		</Paper>
	);
}

/** Holds one section's draft, compares it with what's saved, and shows a sticky save bar while they differ. */
function useSection<D, C>(initial: C, toDraft: (content: C) => D, toContent: (draft: D) => C) {
	const [saved, setSaved] = useState(initial);
	const [draft, setDraft] = useState(() => toDraft(initial));
	// Bumped on discard, so editors (which read their value once) start again from the saved copy
	const [version, setVersion] = useState(0);
	const content = useMemo(() => toContent(draft), [draft, toContent]);
	const dirty = JSON.stringify(content) !== JSON.stringify(saved);
	const discard = () => {
		setDraft(toDraft(saved));
		setVersion((v) => v + 1);
	};
	return { draft, setDraft, content, dirty, version, discard, markSaved: () => setSaved(content) };
}

function SectionShell({
	sectionKey,
	label,
	section,
	onDirtyChange,
	children,
}: {
	sectionKey: HomeContentKey;
	label: string;
	section: { content: unknown; dirty: boolean; version: number; discard: () => void; markSaved: () => void };
	onDirtyChange?: (key: HomeContentKey, dirty: boolean) => void;
	children: ReactNode;
}) {
	const [saving, setSaving] = useState(false);

	useEffect(() => onDirtyChange?.(sectionKey, section.dirty), [sectionKey, section.dirty, onDirtyChange]);

	const save = async () => {
		setSaving(true);
		try {
			const result = await saveHomeContent(sectionKey, section.content);
			if (!result.success) return notifyError(result.error);
			section.markSaved();
			notifications.show({ title: "Saved", message: `${label} is live on the home page`, color: "green" });
		} finally {
			setSaving(false);
		}
	};

	return (
		<Stack gap="lg" key={section.version} pb={section.dirty ? 80 : 0}>
			{children}
			<Transition mounted={section.dirty} transition="slide-up" duration={180}>
				{(styles) => (
					<Paper
						style={{ ...styles, position: "sticky", bottom: 16, zIndex: 20 }}
						p="sm"
						pl="lg"
						radius="xl"
						bg="dark.8"
						c="white"
						shadow="lg"
					>
						<Group justify="space-between" gap="sm">
							<Text size="sm" fw={500}>
								Unsaved changes to {label.toLowerCase()}
							</Text>
							<Group gap="xs">
								<Button variant="subtle" color="gray.3" radius="xl" onClick={section.discard} disabled={saving}>
									Discard
								</Button>
								<Button color="teal" radius="xl" onClick={save} loading={saving}>
									Save and publish
								</Button>
							</Group>
						</Group>
					</Paper>
				)}
			</Transition>
		</Stack>
	);
}

type DirtyProps = { onDirtyChange?: (key: HomeContentKey, dirty: boolean) => void };

/* ---------- hero ---------- */

const heroDraft = (c: HomeContent["hero"]) => ({ ...c, slides: withIds(c.slides) });
const heroContent = (d: ReturnType<typeof heroDraft>): HomeContent["hero"] => ({ ...d, slides: withoutIds(d.slides) });

export function HeroEditor({ initial, onDirtyChange }: { initial: HomeContent["hero"] } & DirtyProps) {
	const section = useSection(initial, heroDraft, heroContent);
	const { draft: hero, setDraft: setHero } = section;

	return (
		<SectionShell sectionKey="hero" label="The hero" section={section} onDirtyChange={onDirtyChange}>
			<Block title="Slides" description="Rotate every six seconds at the top of the page. Bold words in a statement show in dark navy.">
				<TextInput
					label="Small label above the headline"
					value={hero.label}
					onChange={(e) => setHero({ ...hero, label: e.currentTarget.value })}
				/>
				<ItemList
					items={hero.slides}
					itemLabel="Slide"
					min={1}
					summary={(s) => s.title}
					onChange={(slides) => setHero({ ...hero, slides })}
					newItem={() => withIds([{ title: "", text: "" }])[0]}
				>
					{(slide) => (
						<>
							<TextInput
								label="Headline"
								value={slide.title}
								onChange={(e) => {
									const title = e.currentTarget.value;
									setHero((h) => ({ ...h, slides: patchById(h.slides, slide._id, { title }) }));
								}}
							/>
							<RichField
								label="Statement"
								value={slide.text}
								onChange={(text) => setHero((h) => ({ ...h, slides: patchById(h.slides, slide._id, { text }) }))}
							/>
						</>
					)}
				</ItemList>
			</Block>

			<Block title="Highlight" description="The figure in the bottom-right corner of the hero.">
				<SimpleGrid cols={{ base: 1, sm: 3 }}>
					<TextInput
						label="Number"
						value={hero.highlight.value}
						onChange={(e) => setHero({ ...hero, highlight: { ...hero.highlight, value: e.currentTarget.value } })}
					/>
					<TextInput
						label="Word (shown in green)"
						value={hero.highlight.word}
						onChange={(e) => setHero({ ...hero, highlight: { ...hero.highlight, word: e.currentTarget.value } })}
					/>
					<TextInput
						label="Caption"
						value={hero.highlight.caption}
						onChange={(e) => setHero({ ...hero, highlight: { ...hero.highlight, caption: e.currentTarget.value } })}
					/>
				</SimpleGrid>
			</Block>
		</SectionShell>
	);
}

/* ---------- statement ---------- */

const same = <T,>(x: T) => x;

export function StatementEditor({ initial, onDirtyChange }: { initial: HomeContent["statement"] } & DirtyProps) {
	const section = useSection(initial, same, same);
	const { draft, setDraft } = section;

	return (
		<SectionShell sectionKey="statement" label="The statement" section={section} onDirtyChange={onDirtyChange}>
			<Block
				title="Statement"
				description="The large sentence under the partner logos. It lights up word by word as visitors scroll; colour key phrases with the swatches."
			>
				<RichField label="Text" value={draft.html} onChange={(html) => setDraft({ html })} minHeight={140} />
				<Box>
					<Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.1em" mb={6}>
						Preview
					</Text>
					<Paper p="xl" radius="md" bg="white" style={{ border: "1px solid var(--admin-line)" }}>
						<Box
							ta="center"
							fz={26}
							fw={500}
							lh={1.25}
							c="#0B1B4D"
							style={{ letterSpacing: "-0.02em", textWrap: "balance" }}
							dangerouslySetInnerHTML={{ __html: draft.html }}
						/>
					</Paper>
				</Box>
			</Block>
		</SectionShell>
	);
}

/* ---------- about ---------- */

const aboutDraft = (c: HomeContent["about"]) => ({
	...c,
	lists: withIds(c.lists),
	milestones: { ...c.milestones, slides: withIds(c.milestones.slides) },
});
const aboutContent = (d: ReturnType<typeof aboutDraft>): HomeContent["about"] => ({
	...d,
	lists: withoutIds(d.lists),
	milestones: { ...d.milestones, slides: withoutIds(d.milestones.slides) },
});

export function AboutEditor({ initial, onDirtyChange }: { initial: HomeContent["about"] } & DirtyProps) {
	const section = useSection(initial, aboutDraft, aboutContent);
	const { draft: about, setDraft: setAbout } = section;
	const [part, setPart] = useState("intro");

	return (
		<SectionShell sectionKey="about" label="The about section" section={section} onDirtyChange={onDirtyChange}>
			<Tabs value={part} onChange={(value) => value && setPart(value)} variant="pills" radius="xl">
				<Tabs.List>
					<Tabs.Tab value="intro">Introduction & lists</Tabs.Tab>
					<Tabs.Tab value="milestones">Milestones · {about.milestones.slides.length}</Tabs.Tab>
					<Tabs.Tab value="partner">Managing partner</Tabs.Tab>
				</Tabs.List>
			</Tabs>

			{/* All three stay mounted so their editors keep unsaved text when switching */}
			<Stack gap="lg" display={part === "intro" ? undefined : "none"}>
				<Block title="Introduction">
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						<TextInput label="Label" value={about.label} onChange={(e) => setAbout({ ...about, label: e.currentTarget.value })} />
						<TextInput label="Title" value={about.title} onChange={(e) => setAbout({ ...about, title: e.currentTarget.value })} />
					</SimpleGrid>
					<RichField label="Text" value={about.description} onChange={(description) => setAbout((a) => ({ ...a, description }))} />
				</Block>
				<Block title="Lists" description="Shown side by side under the introduction. Each bullet becomes one row.">
					<ItemList
						items={about.lists}
						itemLabel="List"
						summary={(l) => l.title}
						onChange={(lists) => setAbout({ ...about, lists })}
						newItem={() => withIds([{ title: "", html: "<ul><li><p></p></li></ul>" }])[0]}
					>
						{(list) => (
							<>
								<TextInput
									label="Heading"
									value={list.title}
									onChange={(e) => {
										const title = e.currentTarget.value;
										setAbout((a) => ({ ...a, lists: patchById(a.lists, list._id, { title }) }));
									}}
								/>
								<RichField
									label="Items"
									lists
									minHeight={180}
									value={list.html}
									onChange={(html) => setAbout((a) => ({ ...a, lists: patchById(a.lists, list._id, { html }) }))}
								/>
							</>
						)}
					</ItemList>
				</Block>
			</Stack>

			<Stack gap="lg" display={part === "milestones" ? undefined : "none"}>
				<Block title="Milestones slideshow" description="Text on the left, photos on the right. Bold words show in green.">
					<TextInput
						label="Label"
						value={about.milestones.label}
						onChange={(e) => setAbout({ ...about, milestones: { ...about.milestones, label: e.currentTarget.value } })}
					/>
					<ItemList
						items={about.milestones.slides}
						itemLabel="Milestone"
						min={1}
						summary={(s) => plainText(s.html)}
						onChange={(slides) => setAbout({ ...about, milestones: { ...about.milestones, slides } })}
						newItem={() => withIds([{ html: "", images: [] as string[] }])[0]}
					>
						{(slide) => {
							const update = (patch: Partial<typeof slide>) =>
								setAbout((a) => ({
									...a,
									milestones: { ...a.milestones, slides: patchById(a.milestones.slides, slide._id, patch) },
								}));
							return (
								<>
									<RichField label="Text" value={slide.html} onChange={(html) => update({ html })} />
									<ImagesField label="Photos, shown one after another" images={slide.images} onChange={(images) => update({ images })} />
								</>
							);
						}}
					</ItemList>
				</Block>
			</Stack>

			<Stack gap="lg" display={part === "partner" ? undefined : "none"}>
				<Block title="Managing partner">
					<Group align="flex-start" gap="xl" wrap="wrap">
						<ImagesField
							label="Photo"
							single
							images={about.partner.photo ? [about.partner.photo] : []}
							onChange={([photo]) => setAbout((a) => ({ ...a, partner: { ...a.partner, photo: photo ?? "" } }))}
						/>
						<Stack gap="md" style={{ flex: "1 1 280px" }}>
							<TextInput
								label="Label"
								value={about.partner.label}
								onChange={(e) => setAbout({ ...about, partner: { ...about.partner, label: e.currentTarget.value } })}
							/>
							<TextInput
								label="Name"
								value={about.partner.name}
								onChange={(e) => setAbout({ ...about, partner: { ...about.partner, name: e.currentTarget.value } })}
							/>
						</Stack>
					</Group>
					<RichField
						label="Biography"
						minHeight={220}
						value={about.partner.bio}
						onChange={(bio) => setAbout((a) => ({ ...a, partner: { ...a.partner, bio } }))}
					/>
				</Block>
			</Stack>
		</SectionShell>
	);
}

/* ---------- services ---------- */

const servicesDraft = (c: HomeContent["services"]) => ({ ...c, items: withIds(c.items) });
const servicesContent = (d: ReturnType<typeof servicesDraft>): HomeContent["services"] => ({ ...d, items: withoutIds(d.items) });

export function ServicesEditor({ initial, onDirtyChange }: { initial: HomeContent["services"] } & DirtyProps) {
	const section = useSection(initial, servicesDraft, servicesContent);
	const { draft: services, setDraft: setServices } = section;

	return (
		<SectionShell sectionKey="services" label="The services section" section={section} onDirtyChange={onDirtyChange}>
			<Block title="Heading">
				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					<TextInput label="Label" value={services.label} onChange={(e) => setServices({ ...services, label: e.currentTarget.value })} />
					<TextInput label="Title" value={services.title} onChange={(e) => setServices({ ...services, title: e.currentTarget.value })} />
				</SimpleGrid>
				<Textarea
					label="Description"
					autosize
					minRows={2}
					value={services.description}
					onChange={(e) => setServices({ ...services, description: e.currentTarget.value })}
				/>
			</Block>
			<Block title="Services" description="Each row shows its title on the left and the detail on the right.">
				<ItemList
					items={services.items}
					itemLabel="Service"
					summary={(s) => s.title}
					onChange={(items) => setServices({ ...services, items })}
					newItem={() => withIds([{ title: "", html: "" }])[0]}
				>
					{(item) => (
						<>
							<TextInput
								label="Title"
								value={item.title}
								onChange={(e) => {
									const title = e.currentTarget.value;
									setServices((sv) => ({ ...sv, items: patchById(sv.items, item._id, { title }) }));
								}}
							/>
							<RichField
								label="Detail"
								value={item.html}
								onChange={(html) => setServices((sv) => ({ ...sv, items: patchById(sv.items, item._id, { html }) }))}
							/>
						</>
					)}
				</ItemList>
			</Block>
		</SectionShell>
	);
}
