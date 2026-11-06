"use client";

// Link fields don't ask the admin to know paths or section ids: a modal lists the site's pages (the
// modular ones with their sections, from the current drafts) and builds the address. Custom addresses
// (another site, email, phone) are still possible.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Modal,
	ScrollArea,
	SegmentedControl,
	Stack,
	Text,
	TextInput,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import {
	IconCheck,
	IconChevronRight,
	IconExternalLink,
	IconFileText,
	IconHash,
	IconLink,
	IconMail,
	IconPhone,
	IconX,
} from "@tabler/icons-react";

export interface LinkSection {
	/** The id the section answers to on the site: its link name, else the module id */
	id: string;
	name: string;
	/** The section's own title, to tell similar modules apart */
	title?: string;
	hidden?: boolean;
}

export interface LinkPage {
	name: string;
	path: string;
	/** Undefined for pages that aren't built from modules */
	sections?: LinkSection[];
	description?: string;
}

/** Pages that aren't built in the page builder, still worth linking to */
export const staticPages: LinkPage[] = [
	{ name: "News", path: "/news", description: "All news articles" },
	{ name: "Resources", path: "/resources", description: "Guides and downloads" },
	{ name: "Legal updates", path: "/legal-updates" },
	{ name: "Corporate law in Ethiopia", path: "/corporate-law-ethiopia" },
	{ name: "Diaspora legal services", path: "/diaspora-legal-services" },
	{ name: "Real estate law in Ethiopia", path: "/real-estate-law-ethiopia" },
];

export const LinkPagesContext = createContext<LinkPage[]>(staticPages);

const external = /^(https?:\/\/|mailto:|tel:)/i;

/** Splits "/about-us#leadership" into its page and section */
function parse(href: string, pages: LinkPage[]) {
	const v = href.trim();
	if (!v || external.test(v)) return null;
	const [rawPath, hash = ""] = v.split("#");
	const path = rawPath === "" ? "/" : rawPath.replace(/\/+$/, "") || "/";
	const page = pages.find((p) => p.path === path);
	if (!page) return null;
	const section = hash ? page.sections?.find((s) => s.id === hash) : undefined;
	return { page, hash, section };
}

/** "About us › Leadership", or the address itself when it isn't a known page */
export function describeLink(href: string, pages: LinkPage[]) {
	const found = parse(href, pages);
	if (!found) return null;
	if (!found.hash) return found.page.name;
	return `${found.page.name} › ${found.section?.title || found.section?.name || `#${found.hash}`}`;
}

const join = (path: string, sectionId?: string) => (sectionId ? `${path === "/" ? "/" : path}#${sectionId}` : path);

type Mode = "page" | "web" | "email" | "phone";

const modeOf = (href: string): Mode =>
	/^mailto:/i.test(href) ? "email" : /^tel:/i.test(href) ? "phone" : /^https?:\/\//i.test(href) ? "web" : "page";

export function LinkPickerModal({
	opened,
	value,
	onClose,
	onPick,
}: {
	opened: boolean;
	value: string;
	onClose: () => void;
	onPick: (href: string) => void;
}) {
	const pages = useContext(LinkPagesContext);
	const [mode, setMode] = useState<Mode>("page");
	const [pagePath, setPagePath] = useState<string | null>(null);
	const [custom, setCustom] = useState("");

	// Open on what the field holds now
	useEffect(() => {
		if (!opened) return;
		const m = modeOf(value);
		setMode(m);
		const found = parse(value, pages);
		setPagePath(found?.page.path ?? null);
		setCustom(m === "page" ? "" : value.replace(/^(mailto:|tel:)/i, ""));
	}, [opened, value, pages]);

	const current = parse(value, pages);
	const page = pages.find((p) => p.path === pagePath) ?? null;

	const pick = (href: string) => {
		onPick(href);
		onClose();
	};

	const customHref = () => {
		const v = custom.trim();
		if (!v) return "";
		if (mode === "email") return `mailto:${v}`;
		if (mode === "phone") return `tel:${v.replace(/\s+/g, "")}`;
		return /^https?:\/\//i.test(v) ? v : `https://${v}`;
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Choose where this links to" size="lg" radius="lg">
			<Stack gap="md">
				<SegmentedControl
					radius="xl"
					value={mode}
					onChange={(v) => setMode(v as Mode)}
					data={[
						{ value: "page", label: "A page on this site" },
						{ value: "web", label: "Another website" },
						{ value: "email", label: "Email" },
						{ value: "phone", label: "Phone" },
					]}
				/>

				{mode === "page" ? (
					<Group align="stretch" gap="md" wrap="nowrap" style={{ minHeight: 320 }}>
						<Box style={{ flex: "0 0 44%" }}>
							<Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>
								1. Page
							</Text>
							<ScrollArea.Autosize mah={360}>
								<Stack gap={4}>
									{pages.map((p) => (
										<UnstyledButton
											key={p.path}
											onClick={() => setPagePath(p.path)}
											data-active={p.path === pagePath || undefined}
											style={{
												padding: "8px 10px",
												borderRadius: 10,
												background: p.path === pagePath ? "var(--mantine-color-blue-light)" : undefined,
											}}
										>
											<Group gap={8} wrap="nowrap">
												<IconFileText size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
												<Box style={{ flex: 1, minWidth: 0 }}>
													<Text size="sm" fw={500} truncate>
														{p.name}
													</Text>
													<Text size="xs" c="dimmed" truncate>
														{p.path}
													</Text>
												</Box>
												{p.sections && <IconChevronRight size={14} style={{ opacity: 0.5 }} />}
											</Group>
										</UnstyledButton>
									))}
								</Stack>
							</ScrollArea.Autosize>
						</Box>

						<Box style={{ flex: 1, minWidth: 0, borderLeft: "1px solid var(--mantine-color-gray-3)", paddingLeft: 16 }}>
							<Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>
								2. Section (optional)
							</Text>
							{!page ? (
								<Text size="sm" c="dimmed">
									Choose a page first.
								</Text>
							) : (
								<ScrollArea.Autosize mah={360}>
									<Stack gap={4}>
										<SectionRow
											label="Top of the page"
											detail={page.path}
											selected={current?.page.path === page.path && !current.hash}
											onClick={() => pick(join(page.path))}
										/>
										{page.sections ? (
											page.sections.map((s) => (
												<SectionRow
													key={s.id}
													label={s.name}
													detail={s.title ? `${s.title} · #${s.id}` : `#${s.id}`}
													hidden={s.hidden}
													selected={current?.page.path === page.path && current.hash === s.id}
													onClick={() => pick(join(page.path, s.id))}
												/>
											))
										) : (
											<Text size="xs" c="dimmed" mt={6}>
												This page isn&apos;t built from modules, so it links to the top.
											</Text>
										)}
									</Stack>
								</ScrollArea.Autosize>
							)}
						</Box>
					</Group>
				) : (
					<Stack gap="sm">
						<TextInput
							data-autofocus
							label={mode === "web" ? "Website address" : mode === "email" ? "Email address" : "Phone number"}
							placeholder={
								mode === "web" ? "https://example.com/page" : mode === "email" ? "info@example.com" : "+251 911 000 000"
							}
							leftSection={
								mode === "web" ? (
									<IconExternalLink size={14} />
								) : mode === "email" ? (
									<IconMail size={14} />
								) : (
									<IconPhone size={14} />
								)
							}
							value={custom}
							onChange={(e) => setCustom(e.currentTarget.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && customHref()) pick(customHref());
							}}
						/>
						<Group justify="flex-end">
							<Button variant="default" onClick={onClose}>
								Cancel
							</Button>
							<Button disabled={!customHref()} onClick={() => pick(customHref())}>
								Use this link
							</Button>
						</Group>
					</Stack>
				)}
			</Stack>
		</Modal>
	);
}

function SectionRow({
	label,
	detail,
	hidden,
	selected,
	onClick,
}: {
	label: string;
	detail: string;
	hidden?: boolean;
	selected?: boolean;
	onClick: () => void;
}) {
	return (
		<UnstyledButton
			onClick={onClick}
			style={{
				padding: "8px 10px",
				borderRadius: 10,
				background: selected ? "var(--mantine-color-blue-light)" : undefined,
			}}
			className="link-picker-row"
		>
			<Group gap={8} wrap="nowrap">
				<IconHash size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
				<Box style={{ flex: 1, minWidth: 0 }}>
					<Text size="sm" fw={500} truncate>
						{label}
					</Text>
					<Text size="xs" c="dimmed" truncate>
						{detail}
					</Text>
				</Box>
				{hidden && (
					<Badge size="xs" variant="light" color="gray">
						Hidden
					</Badge>
				)}
				{selected && <IconCheck size={16} color="var(--mantine-color-blue-6)" />}
			</Group>
		</UnstyledButton>
	);
}

/** A link field: shows where it points, "Choose" opens the picker; the address stays editable */
export function LinkField({
	label,
	hint,
	required,
	placeholder,
	value,
	error,
	onChange,
}: {
	label: string;
	hint?: string;
	required?: boolean;
	placeholder?: string;
	value: string;
	error?: string | null;
	onChange: (href: string) => void;
}) {
	const pages = useContext(LinkPagesContext);
	const [open, setOpen] = useState(false);
	const described = useMemo(() => describeLink(value, pages), [value, pages]);
	return (
		<>
			<TextInput
				label={label}
				description={described ? `Links to ${described}` : hint}
				placeholder={placeholder}
				withAsterisk={required}
				leftSection={<IconLink size={14} />}
				value={value}
				error={error}
				onChange={(e) => onChange(e.currentTarget.value)}
				rightSectionWidth={value ? 104 : 80}
				rightSection={
					<Group gap={2} wrap="nowrap">
						{value && (
							<Tooltip label="Clear">
								<ActionIcon
									variant="subtle"
									color="gray"
									size="sm"
									onClick={() => onChange("")}
									aria-label="Clear link"
								>
									<IconX size={14} />
								</ActionIcon>
							</Tooltip>
						)}
						<Button size="compact-xs" variant="light" radius="xl" onClick={() => setOpen(true)}>
							Choose
						</Button>
					</Group>
				}
			/>
			<LinkPickerModal opened={open} value={value} onClose={() => setOpen(false)} onPick={onChange} />
		</>
	);
}
