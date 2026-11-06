"use client";

import { useContext, useRef, useState, type ReactNode } from "react";
import "@mantine/tiptap/styles.css";
import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Button,
	FileButton,
	Group,
	Menu,
	Paper,
	Popover,
	SegmentedControl,
	Select,
	SimpleGrid,
	Stack,
	Switch,
	Text,
	TextInput,
	Textarea,
	Title,
	Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	IconArrowBarToDown,
	IconArrowBarToUp,
	IconArrowDown,
	IconArrowUp,
	IconCopy,
	IconDots,
	IconEye,
	IconEyeOff,
	IconLink,
	IconPhotoPlus,
	IconPlus,
	IconRowInsertBottom,
	IconRowInsertTop,
	IconSearch,
	IconTrash,
	IconX,
} from "@tabler/icons-react";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { uploadHomeContentImage } from "@/app/actions/homepage.actions";
import { DragHandle, SortableList, arrayMove, useSortableItem } from "@/components/Sortable";
import type { Field } from "@/lib/module-fields";
import { imageSrc } from "@/lib/page-modules";
import { IconsContext, useConfirm } from "./context";
import { ModuleIcon, knownIcons } from "./icons";
import { copyItem, insertAt, withKeys } from "./model";
import { LinkField, LinkPickerModal } from "./LinkPicker";

// The site's palette, offered as one-click swatches; the picker's wheel is still there for anything else
export const THEME_COLORS = ["#0B1B4D", "#007A5E", "#3E78D6", "#B9821C", "#7559C9", "#5A6377"];

const richExtensions = [StarterKit, Underline, Link, TextStyle, Color];

/** Applies a change to the latest value; `coalesce` groups rapid edits of one field into one undo step */
export type Update<T = any> = (fn: (value: T) => T, coalesce?: string) => void;

const notifyError = (message?: string) =>
	notifications.show({ title: "Error", message: message || "Something went wrong", color: "red" });

/* ---------- single fields ---------- */

/** Rich text with the theme colour swatches. Reads `value` on mount only: remount it (key) to reload. */
export function RichField({
	label,
	description,
	value,
	onChange,
	lists = false,
	minHeight = 110,
	required,
}: {
	label: string;
	description?: string;
	value: string;
	onChange: (html: string) => void;
	/** Show the bullet/numbered list buttons */
	lists?: boolean;
	minHeight?: number;
	required?: boolean;
}) {
	// The editor keeps its first callbacks; route them through a ref so they always see fresh props
	const latest = useRef(onChange);
	latest.current = onChange;
	const editor = useEditor({
		extensions: richExtensions,
		content: value,
		immediatelyRender: false,
		onUpdate: ({ editor: ed }) => latest.current(ed.isEmpty ? "" : ed.getHTML()),
	});
	const [picking, setPicking] = useState(false);
	const setLink = (href: string) => {
		if (!editor) return;
		const chain = editor.chain().focus().extendMarkRange("link");
		if (!href) chain.unsetLink().run();
		else if (editor.state.selection.empty && !editor.isActive("link"))
			// Nothing selected: insert the address itself as linked text
			chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
		else chain.setLink({ href }).run();
	};

	return (
		<div>
			<Text size="sm" fw={500}>
				{label}
				{required && (
					<Text span c="red" ml={4} aria-hidden>
						*
					</Text>
				)}
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
						<RichTextEditor.Control
							onClick={() => setPicking(true)}
							aria-label="Link to a page or section"
							title="Link to a page or section"
							active={editor?.isActive("link")}
						>
							<IconLink size={16} stroke={1.5} />
						</RichTextEditor.Control>
						<RichTextEditor.Unlink />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Undo />
						<RichTextEditor.Redo />
					</RichTextEditor.ControlsGroup>
				</RichTextEditor.Toolbar>
				<RichTextEditor.Content style={{ minHeight }} />
			</RichTextEditor>
			<LinkPickerModal
				opened={picking}
				value={editor?.getAttributes("link").href ?? ""}
				onClose={() => setPicking(false)}
				onPick={setLink}
			/>
		</div>
	);
}

/** One thumbnail; dragged anywhere on it to reorder. */
function SortableThumb({
	id,
	url,
	size,
	sortable,
	onRemove,
}: {
	id: string;
	url: string;
	size: { w: number; h: number };
	sortable: boolean;
	onRemove?: () => void;
}) {
	const { itemProps, dragProps } = useSortableItem(id);
	return (
		<Box {...size} {...itemProps}>
			<Box
				pos="relative"
				h="100%"
				{...(sortable ? dragProps : {})}
				aria-label={sortable ? "Drag to reorder the photo" : undefined}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={imageSrc(url)}
					alt=""
					draggable={false}
					style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, background: "#eceef1" }}
				/>
				{onRemove && (
					<ActionIcon
						size="sm"
						radius="xl"
						color="dark"
						variant="filled"
						pos="absolute"
						top={6}
						right={6}
						onClick={onRemove}
						onKeyDown={(e) => e.stopPropagation()}
						aria-label="Remove image"
					>
						<IconX size={12} />
					</ActionIcon>
				)}
			</Box>
		</Box>
	);
}

/** Thumbnails, dragged to reorder, with remove buttons, plus a tile that uploads another. */
export function ImagesField({
	label,
	hint,
	images,
	onChange,
	single = false,
	required,
}: {
	label: string;
	hint?: string;
	images: string[];
	onChange: (images: string[]) => void;
	/** One image only: uploading replaces it */
	single?: boolean;
	required?: boolean;
}) {
	const [uploading, setUploading] = useState(false);
	const [pasting, setPasting] = useState(false);
	const [address, setAddress] = useState("");
	const size = single ? { w: 160, h: 200 } : { w: 132, h: 96 };
	// Drag ids: the URL, numbered when the same image is used twice
	const ids = images.map((url, i) => `${url}#${images.slice(0, i).filter((u) => u === url).length}`);

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

	const addAddress = () => {
		const url = address.trim();
		if (!url) return;
		onChange(single ? [url] : [...images, url]);
		setAddress("");
		setPasting(false);
	};

	return (
		<div>
			<Text size="sm" fw={500}>
				{label}
				{required && (
					<Text span c="red" ml={4} aria-hidden>
						*
					</Text>
				)}
			</Text>
			{hint && (
				<Text size="xs" c="dimmed">
					{hint}
				</Text>
			)}
			<Group gap="sm" align="flex-start" mt={6}>
				<SortableList ids={ids} layout="grid" onMove={(from, to) => onChange(arrayMove(images, from, to))}>
					{images.map((url, i) => (
						<SortableThumb
							key={ids[i]}
							id={ids[i]}
							url={url}
							size={size}
							sortable={!single}
							onRemove={() => onChange(images.filter((_, j) => j !== i))}
						/>
					))}
				</SortableList>
				<Stack gap={6}>
					<FileButton onChange={upload} accept="image/png,image/jpeg,image/webp,image/gif">
						{(props) => (
							<Button
								{...props}
								variant="default"
								loading={uploading}
								{...size}
								styles={{
									root: { borderStyle: "dashed", borderRadius: 10 },
									inner: { flexDirection: "column", gap: 4 },
								}}
							>
								<IconPhotoPlus size={20} />
								<Text size="xs" mt={4}>
									{single && images.length ? "Replace" : "Upload"}
								</Text>
							</Button>
						)}
					</FileButton>
					<Popover opened={pasting} onChange={setPasting} width={320} position="bottom-start" trapFocus>
						<Popover.Target>
							<Button size="compact-xs" variant="subtle" color="gray" onClick={() => setPasting((o) => !o)}>
								Use an address
							</Button>
						</Popover.Target>
						<Popover.Dropdown>
							<Stack gap="xs">
								<TextInput
									size="xs"
									label="Image address"
									description="A site path such as /aboutUs/photo.jpg, or a full https:// link"
									value={address}
									onChange={(e) => setAddress(e.currentTarget.value)}
									onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAddress())}
								/>
								<Button size="xs" onClick={addAddress} disabled={!address.trim()}>
									{single ? "Use this image" : "Add image"}
								</Button>
							</Stack>
						</Popover.Dropdown>
					</Popover>
				</Stack>
			</Group>
		</div>
	);
}

/** A grid of the icons modules may use */
export function IconPicker({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (icon: string) => void;
}) {
	const allowed = useContext(IconsContext);
	const icons = (allowed.length ? allowed : knownIcons).filter(Boolean);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const shown = icons.filter((i) => i.includes(query.trim().toLowerCase()));

	return (
		<div>
			<Text size="sm" fw={500} mb={6}>
				{label}
			</Text>
			<Popover opened={open} onChange={setOpen} width={300} position="bottom-start" trapFocus>
				<Popover.Target>
					<Button
						variant="default"
						radius="md"
						leftSection={<ModuleIcon name={value} />}
						onClick={() => setOpen((o) => !o)}
						aria-label={`${label}: ${value || "none"}. Change icon`}
					>
						{value || "Choose"}
					</Button>
				</Popover.Target>
				<Popover.Dropdown>
					<TextInput
						size="xs"
						mb="xs"
						placeholder="Search icons"
						leftSection={<IconSearch size={14} />}
						value={query}
						onChange={(e) => setQuery(e.currentTarget.value)}
					/>
					<SimpleGrid cols={6} spacing={4}>
						{shown.map((name) => (
							<Tooltip key={name} label={name} openDelay={300}>
								<ActionIcon
									size="lg"
									radius="md"
									variant={name === value ? "filled" : "subtle"}
									color={name === value ? "dark" : "gray"}
									aria-label={name}
									aria-pressed={name === value}
									onClick={() => {
										onChange(name);
										setOpen(false);
									}}
								>
									<ModuleIcon name={name} />
								</ActionIcon>
							</Tooltip>
						))}
					</SimpleGrid>
					{shown.length === 0 && (
						<Text size="xs" c="dimmed" ta="center" py="sm">
							No icon matches.
						</Text>
					)}
				</Popover.Dropdown>
			</Popover>
		</div>
	);
}

const linkHint = (href: string) => {
	const v = href.trim();
	if (!v || /^(\/|#|https?:\/\/|mailto:|tel:)/.test(v)) return null;
	return "Links start with / (a page on this site), # (a section), https://, mailto: or tel:";
};

/* ---------- lists ---------- */

type Item = Record<string, any> & { _key: string; hidden?: boolean };

function ItemMenu({
	label,
	hidden,
	first,
	last,
	canAdd,
	canRemove,
	act,
}: {
	label: string;
	hidden: boolean;
	first: boolean;
	last: boolean;
	canAdd: boolean;
	canRemove: boolean;
	act: (action: "hide" | "duplicate" | "above" | "below" | "up" | "down" | "top" | "bottom" | "remove") => void;
}) {
	return (
		<Menu position="bottom-end" withinPortal>
			<Menu.Target>
				<ActionIcon
					variant="subtle"
					color="gray"
					aria-label={`Actions for ${label}`}
					onClick={(e) => e.stopPropagation()}
				>
					<IconDots size={18} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item leftSection={hidden ? <IconEye size={14} /> : <IconEyeOff size={14} />} onClick={() => act("hide")}>
					{hidden ? "Show on the site" : "Hide from the site"}
				</Menu.Item>
				<Menu.Item leftSection={<IconCopy size={14} />} disabled={!canAdd} onClick={() => act("duplicate")}>
					Duplicate
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item leftSection={<IconRowInsertTop size={14} />} disabled={!canAdd} onClick={() => act("above")}>
					Add above
				</Menu.Item>
				<Menu.Item leftSection={<IconRowInsertBottom size={14} />} disabled={!canAdd} onClick={() => act("below")}>
					Add below
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item leftSection={<IconArrowUp size={14} />} disabled={first} onClick={() => act("up")}>
					Move up
				</Menu.Item>
				<Menu.Item leftSection={<IconArrowDown size={14} />} disabled={last} onClick={() => act("down")}>
					Move down
				</Menu.Item>
				<Menu.Item leftSection={<IconArrowBarToUp size={14} />} disabled={first} onClick={() => act("top")}>
					Move to top
				</Menu.Item>
				<Menu.Item leftSection={<IconArrowBarToDown size={14} />} disabled={last} onClick={() => act("bottom")}>
					Move to bottom
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item
					color="red"
					leftSection={<IconTrash size={14} />}
					disabled={!canRemove}
					onClick={() => act("remove")}
				>
					Remove
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}

/** One collapsible row, dragged by its grip to reorder. */
function SortableAccordionItem({
	item,
	index,
	title,
	itemLabel,
	menu,
	children,
}: {
	item: Item;
	index: number;
	title: string;
	itemLabel: string;
	menu: ReactNode;
	children: ReactNode;
}) {
	const { itemProps, handle } = useSortableItem(item._key);
	return (
		<Accordion.Item
			value={item._key}
			{...itemProps}
			style={{ ...itemProps.style, opacity: item.hidden ? 0.6 : itemProps.style.opacity }}
		>
			<Group gap={4} wrap="nowrap" pl={6} pr="xs">
				<DragHandle handle={handle} label={`Drag to reorder ${itemLabel.toLowerCase()} ${index + 1}`} />
				<Accordion.Control>
					<Group gap="sm" wrap="nowrap">
						<Text size="xs" c="dimmed" fw={600} w={22} style={{ flexShrink: 0 }}>
							{String(index + 1).padStart(2, "0")}
						</Text>
						<Text size="sm" fw={500} lineClamp={1} td={item.hidden ? "line-through" : undefined}>
							{title}
						</Text>
						{item.hidden && (
							<Badge
								size="xs"
								variant="light"
								color="gray"
								leftSection={<IconEyeOff size={10} />}
								style={{ flexShrink: 0 }}
							>
								Hidden
							</Badge>
						)}
					</Group>
				</Accordion.Control>
				{/* Enter and Space on the menu open it rather than picking the row up */}
				<div onKeyDown={(e) => e.stopPropagation()}>{menu}</div>
			</Group>
			<Accordion.Panel>
				<Stack gap="md" pt={4}>
					{children}
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}

/** Collapsible rows for slides, cards, buttons…: a summary line, an actions menu, and the fields inside. */
function ItemList({
	field,
	items,
	update,
	path,
}: {
	field: Extract<Field, { kind: "list" }>;
	items: Item[];
	update: Update<Item[]>;
	path: string;
}) {
	const [open, setOpen] = useState<string | null>(null);
	const confirm = useConfirm();
	const max = field.max ?? Infinity;
	const min = field.min ?? 0;
	const label = field.itemLabel.toLowerCase();

	const create = () => withKeys([field.newItem()])[0] as Item;

	const act = async (item: Item, action: Parameters<Parameters<typeof ItemMenu>[0]["act"]>[0]) => {
		const index = items.findIndex((x) => x._key === item._key);
		const name = field.summary(item) || `${field.itemLabel} ${index + 1}`;
		switch (action) {
			case "hide":
				return update((list) => list.map((x) => (x._key === item._key ? { ...x, hidden: !x.hidden || undefined } : x)));
			case "duplicate": {
				const copy = copyItem(item) as Item;
				update((list) => insertAt(list, list.findIndex((x) => x._key === item._key) + 1, copy));
				return setOpen(copy._key);
			}
			case "above":
			case "below": {
				const fresh = create();
				update((list) =>
					insertAt(list, list.findIndex((x) => x._key === item._key) + (action === "below" ? 1 : 0), fresh),
				);
				return setOpen(fresh._key);
			}
			case "up":
			case "down":
			case "top":
			case "bottom":
				return update((list) => {
					const from = list.findIndex((x) => x._key === item._key);
					const to = action === "up" ? from - 1 : action === "down" ? from + 1 : action === "top" ? 0 : list.length - 1;
					return arrayMove(list, from, Math.max(0, Math.min(list.length - 1, to)));
				});
			case "remove":
				if (
					await confirm({
						title: `Remove this ${label}?`,
						message: <>“{name}” will be removed from the draft. You can undo this until you publish.</>,
					})
				)
					update((list) => list.filter((x) => x._key !== item._key));
		}
	};

	return (
		<Stack gap="sm">
			{items.length > 0 && (
				<SortableList
					ids={items.map((item) => item._key)}
					onMove={(from, to) => update((list) => arrayMove(list, from, to))}
				>
					<Accordion value={open} onChange={setOpen} variant="separated" radius="md" chevronPosition="left">
						{items.map((item, index) => (
							<SortableAccordionItem
								key={item._key}
								item={item}
								index={index}
								title={field.summary(item) || `Untitled ${label}`}
								itemLabel={field.itemLabel}
								menu={
									<ItemMenu
										label={field.summary(item) || `${field.itemLabel} ${index + 1}`}
										hidden={!!item.hidden}
										first={index === 0}
										last={index === items.length - 1}
										canAdd={items.length < max}
										canRemove={items.length > min}
										act={(action) => act(item, action)}
									/>
								}
							>
								{/* Only the open row mounts its editors, which keeps long lists light */}
								{open === item._key && (
									<Fields
										fields={field.fields}
										value={item}
										path={`${path}.${item._key}`}
										update={(fn, coalesce) =>
											update((list) => list.map((x) => (x._key === item._key ? fn(x) : x)), coalesce)
										}
									/>
								)}
							</SortableAccordionItem>
						))}
					</Accordion>
				</SortableList>
			)}
			<Group gap="sm">
				<Button
					variant="default"
					leftSection={<IconPlus size={16} />}
					disabled={items.length >= max}
					onClick={() => {
						const item = create();
						update((list) => [...list, item]);
						setOpen(item._key);
					}}
				>
					Add {label}
				</Button>
				<Text size="xs" c="dimmed">
					{items.length} {items.length === 1 ? label : `${label}s`}
					{items.some((i) => i.hidden) && ` · ${items.filter((i) => i.hidden).length} hidden`}
					{field.max !== undefined && ` · up to ${field.max}`}
					{min > 0 && ` · at least ${min}`}
				</Text>
			</Group>
		</Stack>
	);
}

/* ---------- the generic form ---------- */

function FieldView({ field, value, update, path }: { field: Field; value: any; update: Update; path: string }) {
	if (field.kind === "row") {
		return (
			<SimpleGrid cols={{ base: 1, sm: field.columns ?? field.fields.length }}>
				{field.fields.map((f, i) => (
					<FieldView key={f.key ?? i} field={f} value={value} update={update} path={path} />
				))}
			</SimpleGrid>
		);
	}

	const key = field.key;
	const at = `${path}.${key}`;
	const current = value?.[key];
	const set = (v: unknown, coalesce?: string) => update((o) => ({ ...o, [key]: v }), coalesce);

	switch (field.kind) {
		case "text":
			return (
				<TextInput
					label={field.label}
					description={field.hint}
					placeholder={field.placeholder}
					withAsterisk={field.required}
					value={current ?? ""}
					onChange={(e) => set(e.currentTarget.value, at)}
				/>
			);
		case "textarea":
			return (
				<Textarea
					label={field.label}
					description={field.hint}
					placeholder={field.placeholder}
					withAsterisk={field.required}
					autosize
					minRows={2}
					value={current ?? ""}
					onChange={(e) => set(e.currentTarget.value, at)}
				/>
			);
		case "link":
			return (
				<LinkField
					label={field.label}
					hint={field.hint}
					placeholder={field.placeholder}
					required={field.required}
					value={current ?? ""}
					error={linkHint(current ?? "")}
					onChange={(href) => set(href, at)}
				/>
			);
		case "rich":
			return (
				<RichField
					label={field.label}
					description={field.hint}
					required={field.required}
					lists={field.lists}
					minHeight={field.minHeight}
					value={current ?? ""}
					onChange={(html) => set(html, at)}
				/>
			);
		case "image":
			return (
				<ImagesField
					label={field.label}
					hint={field.hint}
					required={field.required}
					single
					images={current ? [current] : []}
					onChange={([url]) => set(url ?? "")}
				/>
			);
		case "images":
			return (
				<ImagesField
					label={field.label}
					hint={field.hint}
					required={field.required}
					images={current ?? []}
					onChange={(images) => set(images)}
				/>
			);
		case "select":
			return field.options.length <= 3 ? (
				<div>
					<Text size="sm" fw={500} mb={6}>
						{field.label}
					</Text>
					<SegmentedControl
						radius="xl"
						data={field.options}
						value={current ?? field.options[0].value}
						onChange={(v) => set(v)}
					/>
				</div>
			) : (
				<Select
					label={field.label}
					data={field.options}
					value={current ?? null}
					onChange={(v) => v && set(v)}
					allowDeselect={false}
				/>
			);
		case "switch":
			return (
				<Switch
					label={field.label}
					description={field.hint}
					checked={!!current}
					onChange={(e) => set(e.currentTarget.checked)}
				/>
			);
		case "icon":
			return <IconPicker label={field.label} value={current ?? ""} onChange={(icon) => set(icon)} />;
		case "group":
			return (
				<Stack gap="md">
					{field.label && (
						<Text size="sm" fw={600}>
							{field.label}
						</Text>
					)}
					{field.columns ? (
						<SimpleGrid cols={{ base: 1, sm: field.columns }}>
							<Fields
								fields={field.fields}
								value={current}
								path={at}
								update={(fn, c) => update((o) => ({ ...o, [key]: fn(o?.[key] ?? {}) }), c)}
							/>
						</SimpleGrid>
					) : (
						<Fields
							fields={field.fields}
							value={current}
							path={at}
							update={(fn, c) => update((o) => ({ ...o, [key]: fn(o?.[key] ?? {}) }), c)}
						/>
					)}
				</Stack>
			);
		case "list":
			return (
				<ItemList
					field={field}
					items={current ?? []}
					path={at}
					update={(fn, c) => update((o) => ({ ...o, [key]: fn(o?.[key] ?? []) }), c)}
				/>
			);
	}
}

/** Renders a schema's fields for one object */
export function Fields({ fields, value, update, path }: { fields: Field[]; value: any; update: Update; path: string }) {
	return (
		<>
			{fields.map((f, i) => (
				<FieldView key={f.key ?? `row-${i}`} field={f} value={value} update={update} path={path} />
			))}
		</>
	);
}

/** A titled group of fields, with an optional actions menu and a "hidden" state */
export function Block({
	title,
	description,
	menu,
	hidden,
	children,
}: {
	title: string;
	description?: string;
	menu?: ReactNode;
	hidden?: boolean;
	children: ReactNode;
}) {
	return (
		<Paper
			withBorder
			p={{ base: "md", sm: "lg" }}
			radius="lg"
			style={hidden ? { opacity: 0.65, outline: "1px dashed var(--mantine-color-gray-4)" } : undefined}
		>
			<Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
				<div>
					<Group gap="xs">
						<Title order={4}>{title}</Title>
						{hidden && (
							<Badge size="sm" variant="light" color="gray" leftSection={<IconEyeOff size={11} />}>
								Hidden on the site
							</Badge>
						)}
					</Group>
					{description && (
						<Text size="sm" c="dimmed" mt={2}>
							{description}
						</Text>
					)}
				</div>
				{menu}
			</Group>
			<Stack gap="md" mt="md">
				{children}
			</Stack>
		</Paper>
	);
}
