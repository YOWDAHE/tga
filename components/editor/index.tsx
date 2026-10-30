"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { Menu } from "@mantine/core";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import {
	IconAlignCenter,
	IconAlignLeft,
	IconAlignRight,
	IconArrowBackUp,
	IconArrowForwardUp,
	IconBlockquote,
	IconBold,
	IconCheck,
	IconChevronDown,
	IconChevronLeft,
	IconHighlight,
	IconItalic,
	IconLink,
	IconList,
	IconListNumbers,
	IconSeparatorHorizontal,
	IconStrikethrough,
	IconUnderline,
} from "@tabler/icons-react";
import { timeAgo } from "../admin-ui";
import classes from "./editor.module.css";

export { classes as editorClasses };

/* ---------- page frame ---------- */

export function EditorFrame({
	back,
	status,
	actions,
	children,
}: {
	back: { href: string; label: string };
	status?: ReactNode;
	actions?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className={classes.page}>
			<div className={classes.topBar}>
				<Link href={back.href} className={classes.back}>
					<IconChevronLeft size={16} />
					{back.label}
				</Link>
				<div className={classes.topActions}>
					{status}
					{actions}
				</div>
			</div>
			{children}
		</div>
	);
}

export function Workspace({ main, aside }: { main: ReactNode; aside: ReactNode }) {
	return (
		<div className={classes.layout}>
			<div className={classes.main}>{main}</div>
			<aside className={classes.aside}>{aside}</aside>
		</div>
	);
}

export function SideCard({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
	return (
		<section className={classes.card}>
			<div className={classes.cardTitle}>{title}</div>
			{children}
			{hint && <div className={classes.cardHint}>{hint}</div>}
		</section>
	);
}

/** "Saving…", "Unsaved changes" or "Last edited 3 minutes ago" */
export function SaveState({
	saving,
	dirty,
	savedAt,
}: {
	saving?: boolean;
	dirty?: boolean;
	savedAt?: string | Date | null;
}) {
	if (saving) return <span className={classes.saveState}>Saving…</span>;
	if (dirty)
		return (
			<span className={classes.saveState} data-tone="dirty">
				Unsaved changes
			</span>
		);
	if (savedAt) return <span className={classes.saveState}>Last edited {timeAgo(savedAt)}</span>;
	return null;
}

/** ⌘S / Ctrl+S saves, and leaving the page with unsaved changes asks first */
export function useEditorGuards({ dirty, onSave }: { dirty: boolean; onSave: () => void }) {
	const save = useRef(onSave);
	save.current = onSave;

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				save.current();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	useEffect(() => {
		if (!dirty) return;
		const onLeave = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", onLeave);
		return () => window.removeEventListener("beforeunload", onLeave);
	}, [dirty]);
}

/* ---------- title + summary ---------- */

function AutoTextarea({
	value,
	onChange,
	className,
	placeholder,
	singleLine,
	ariaLabel,
	maxLength,
}: {
	value: string;
	onChange: (value: string) => void;
	className: string;
	placeholder?: string;
	singleLine?: boolean;
	ariaLabel: string;
	maxLength?: number;
}) {
	const ref = useRef<HTMLTextAreaElement>(null);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}, [value]);

	return (
		<textarea
			ref={ref}
			rows={1}
			value={value}
			aria-label={ariaLabel}
			placeholder={placeholder}
			maxLength={maxLength}
			className={className}
			onChange={(e) => onChange(singleLine ? e.target.value.replace(/\n/g, " ") : e.target.value)}
			onKeyDown={(e) => {
				if (singleLine && e.key === "Enter") e.preventDefault();
			}}
		/>
	);
}

export function TitleBlock({
	eyebrow,
	title,
	onTitle,
	titlePlaceholder = "Untitled",
	titleError,
	summary,
	onSummary,
	summaryPlaceholder,
}: {
	eyebrow: string;
	title: string;
	onTitle: (value: string) => void;
	titlePlaceholder?: string;
	titleError?: string | null;
	summary?: string;
	onSummary?: (value: string) => void;
	summaryPlaceholder?: string;
}) {
	return (
		<div className={classes.heading}>
			<div className={classes.eyebrow}>{eyebrow}</div>
			<AutoTextarea
				singleLine
				ariaLabel="Title"
				value={title}
				onChange={onTitle}
				placeholder={titlePlaceholder}
				className={classes.titleInput}
			/>
			{titleError && <div className={classes.fieldError}>{titleError}</div>}
			{onSummary && (
				<AutoTextarea
					ariaLabel="Summary"
					value={summary ?? ""}
					onChange={onSummary}
					placeholder={summaryPlaceholder}
					className={classes.summaryInput}
				/>
			)}
		</div>
	);
}

/* ---------- status menu ---------- */

export function StatusMenu({ published, onChange }: { published: boolean; onChange: (published: boolean) => void }) {
	const options = [
		{ value: false, label: "Draft", detail: "Only visible here in the admin." },
		{ value: true, label: "Published", detail: "Live on the public website." },
	];
	return (
		<Menu position="bottom-end" width={260} radius="lg" shadow="md">
			<Menu.Target>
				<button type="button" className={classes.statusButton}>
					<span className={classes.statusDot} data-on={published || undefined} />
					{published ? "Published" : "Draft"}
					<IconChevronDown size={14} color="var(--admin-muted)" />
				</button>
			</Menu.Target>
			<Menu.Dropdown>
				{options.map((o) => (
					<Menu.Item
						key={o.label}
						onClick={() => onChange(o.value)}
						rightSection={o.value === published ? <IconCheck size={14} /> : null}
					>
						<div className={classes.statusOption}>
							<span className={classes.statusDot} data-on={o.value || undefined} />
							<div>
								<div className={classes.statusOptionLabel}>{o.label}</div>
								<div className={classes.statusOptionDetail}>{o.detail}</div>
							</div>
						</div>
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}

/* ---------- slug ---------- */

export function slugify(text: string) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function SlugField({
	prefix,
	value,
	onChange,
	auto,
	onReset,
}: {
	prefix: string;
	value: string;
	onChange: (value: string) => void;
	auto: boolean;
	onReset: () => void;
}) {
	return (
		<div>
			<label className={classes.slug}>
				<span className={classes.slugPrefix}>{prefix}</span>
				<input
					className={classes.slugInput}
					value={value}
					aria-label="URL slug"
					placeholder="url-slug"
					onChange={(e) =>
						onChange(
							e.target.value
								.toLowerCase()
								.replace(/\s+/g, "-")
								.replace(/[^a-z0-9_-]/g, ""),
						)
					}
				/>
			</label>
			<div className={classes.slugMeta}>
				{auto ?
					<span>Follows the title</span>
				:	<>
						<span>Custom</span>
						<button type="button" className={classes.linkButton} onClick={onReset}>
							From title
						</button>
					</>
				}
			</div>
		</div>
	);
}

/* ---------- document editor ---------- */

export function textStats(html: string) {
	const text = html
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&[a-z#0-9]+;/gi, "x");
	const words = text.trim() ? text.trim().split(/\s+/).length : 0;
	return {
		words,
		minutes: words ? Math.max(1, Math.round(words / 220)) : 0,
		characters: text.replace(/\s+/g, " ").trim().length,
	};
}

type Tool = { label: string; icon: ReactNode; run: () => void; active?: boolean; disabled?: boolean };

const BLOCKS = [
	{ id: "p", label: "Paragraph" },
	{ id: "h2", label: "Heading" },
	{ id: "h3", label: "Subheading" },
	{ id: "h4", label: "Small heading" },
	{ id: "quote", label: "Quote" },
] as const;

function currentBlock(editor: Editor) {
	if (editor.isActive("heading", { level: 2 }) || editor.isActive("heading", { level: 1 })) return "h2";
	if (editor.isActive("heading", { level: 3 })) return "h3";
	if (editor.isActive("heading", { level: 4 })) return "h4";
	if (editor.isActive("blockquote")) return "quote";
	return "p";
}

function applyBlock(editor: Editor, id: (typeof BLOCKS)[number]["id"]) {
	const chain = editor.chain().focus();
	if (editor.isActive("blockquote") && id !== "quote") chain.lift("blockquote");
	if (id === "p") chain.setParagraph().run();
	else if (id === "quote") chain.setParagraph().toggleBlockquote().run();
	else chain.setHeading({ level: Number(id.slice(1)) as 2 | 3 | 4 }).run();
}

function toolbar(editor: Editor): Tool[][] {
	const c = () => editor.chain().focus();
	return [
		[
			{ label: "Undo", icon: <IconArrowBackUp size={17} />, run: () => c().undo().run(), disabled: !editor.can().undo() },
			{ label: "Redo", icon: <IconArrowForwardUp size={17} />, run: () => c().redo().run(), disabled: !editor.can().redo() },
		],
		[
			{ label: "Bold", icon: <IconBold size={17} />, run: () => c().toggleBold().run(), active: editor.isActive("bold") },
			{ label: "Italic", icon: <IconItalic size={17} />, run: () => c().toggleItalic().run(), active: editor.isActive("italic") },
			{
				label: "Underline",
				icon: <IconUnderline size={17} />,
				run: () => c().toggleUnderline().run(),
				active: editor.isActive("underline"),
			},
			{
				label: "Strikethrough",
				icon: <IconStrikethrough size={17} />,
				run: () => c().toggleStrike().run(),
				active: editor.isActive("strike"),
			},
			{
				label: "Highlight",
				icon: <IconHighlight size={17} />,
				run: () => c().toggleHighlight().run(),
				active: editor.isActive("highlight"),
			},
		],
		[
			{
				label: "Bulleted list",
				icon: <IconList size={17} />,
				run: () => c().toggleBulletList().run(),
				active: editor.isActive("bulletList"),
			},
			{
				label: "Numbered list",
				icon: <IconListNumbers size={17} />,
				run: () => c().toggleOrderedList().run(),
				active: editor.isActive("orderedList"),
			},
			{
				label: "Quote",
				icon: <IconBlockquote size={17} />,
				run: () => c().toggleBlockquote().run(),
				active: editor.isActive("blockquote"),
			},
			{ label: "Divider", icon: <IconSeparatorHorizontal size={17} />, run: () => c().setHorizontalRule().run() },
		],
		[
			{
				label: "Link",
				icon: <IconLink size={17} />,
				active: editor.isActive("link"),
				run: () => {
					const url = window.prompt("Link address (leave empty to remove the link)", editor.getAttributes("link").href ?? "https://");
					if (url === null) return;
					if (url === "" || url === "https://") c().extendMarkRange("link").unsetLink().run();
					else c().extendMarkRange("link").setLink({ href: url }).run();
				},
			},
		],
	];
}

const ALIGNS = [
	{ value: "left", label: "Align left", icon: IconAlignLeft },
	{ value: "center", label: "Align center", icon: IconAlignCenter },
	{ value: "right", label: "Align right", icon: IconAlignRight },
] as const;

function AlignMenu({ editor }: { editor: Editor }) {
	const current = ALIGNS.find((a) => editor.isActive({ textAlign: a.value })) ?? ALIGNS[0];
	return (
		<Menu position="bottom-end" radius="md" shadow="md">
			<Menu.Target>
				<button type="button" className={classes.tool} title="Alignment" aria-label="Alignment">
					<current.icon size={17} />
				</button>
			</Menu.Target>
			<Menu.Dropdown>
				{ALIGNS.map((a) => (
					<Menu.Item
						key={a.value}
						leftSection={<a.icon size={15} />}
						rightSection={a.value === current.value ? <IconCheck size={14} /> : null}
						onClick={() => editor.chain().focus().setTextAlign(a.value).run()}
					>
						{a.label}
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}

/** Drop line breaks between tags so stored HTML doesn't turn into empty paragraphs */
const tidy = (raw: string) => (raw || "").replace(/>[ \t]*\r?\n\s*</g, "><");

/** Rich-text document: sticky toolbar card above a white page, with a word count footer. Emits HTML ("" when empty). */
export function DocumentEditor({
	value,
	onChange,
	placeholder = "Start writing…",
}: {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
}) {
	// The HTML we loaded and what the editor turned it into. Untouched content is
	// emitted as the original string, so opening and saving never rewrites it.
	const loaded = useRef<{ raw: string; html: string } | null>(null);
	const html = (ed: Editor) => (ed.isEmpty ? "" : ed.getHTML());
	const load = (ed: Editor, raw: string) => {
		ed.commands.setContent(tidy(raw), false);
		loaded.current = { raw, html: html(ed) };
	};

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			LinkExtension.configure({ openOnClick: false }),
			Highlight,
			Superscript,
			Subscript,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
		],
		content: tidy(value),
		immediatelyRender: false,
		onCreate: ({ editor: ed }) => {
			loaded.current = { raw: value, html: html(ed) };
		},
		onUpdate: ({ editor: ed }) => {
			const next = html(ed);
			onChange(loaded.current && next === loaded.current.html ? loaded.current.raw : next);
		},
	});

	// Follow value changes that did not come from typing (e.g. a reset after saving)
	useEffect(() => {
		if (!editor) return;
		const current = html(editor);
		if (value === current) return;
		if (loaded.current && value === loaded.current.raw && current === loaded.current.html) return;
		load(editor, value);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, editor]);

	const stats = textStats(value);

	return (
		<>
			<div className={classes.toolbar} role="toolbar" aria-label="Formatting">
				{editor ?
					<>
						<select
							className={classes.blockSelect}
							aria-label="Text style"
							value={currentBlock(editor)}
							onChange={(e) => applyBlock(editor, e.target.value as (typeof BLOCKS)[number]["id"])}
						>
							{BLOCKS.map((b) => (
								<option key={b.id} value={b.id}>
									{b.label}
								</option>
							))}
						</select>
						{toolbar(editor).map((group, i) => (
							<div key={i} className={classes.toolGroup}>
								<span className={classes.toolSep} aria-hidden />
								{group.map((tool) => (
									<button
										key={tool.label}
										type="button"
										className={classes.tool}
										title={tool.label}
										aria-label={tool.label}
										aria-pressed={tool.active}
										data-active={tool.active || undefined}
										disabled={tool.disabled}
										onClick={tool.run}
									>
										{tool.icon}
									</button>
								))}
							</div>
						))}
						<div className={classes.toolGroup}>
							<span className={classes.toolSep} aria-hidden />
							<AlignMenu editor={editor} />
						</div>
					</>
				:	<div style={{ height: 34 }} />}
			</div>
			<div className={classes.document}>
				<div className={`${classes.documentBody} rich-text-content`}>
					{editor?.isEmpty && <div className={classes.placeholder}>{placeholder}</div>}
					<EditorContent editor={editor} />
				</div>
				<div className={classes.documentFooter}>
					<span>
						{stats.words.toLocaleString()} {stats.words === 1 ? "word" : "words"}
						{stats.minutes > 0 && ` · ${stats.minutes} min read`}
					</span>
					<span>{stats.characters.toLocaleString()} characters</span>
				</div>
			</div>
		</>
	);
}

/* ---------- reading view pieces ---------- */

export function Facts({ items }: { items: Array<{ label: string; value: ReactNode } | false | null | undefined> }) {
	return (
		<div className={classes.facts}>
			{items.filter(Boolean).map((item) => {
				const { label, value } = item as { label: string; value: ReactNode };
				return (
					<div key={label} className={classes.fact}>
						<span className={classes.factLabel}>{label}</span>
						<span className={classes.factValue}>{value}</span>
					</div>
				);
			})}
		</div>
	);
}

export function Chips({ items }: { items: string[] }) {
	return (
		<div className={classes.chips}>
			{items.map((item) => (
				<span key={item} className={classes.chip}>
					{item}
				</span>
			))}
		</div>
	);
}

export const splitList = (value?: string | null) =>
	(value ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
