"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Badge,
	Box,
	Button,
	Chip,
	Group,
	Modal,
	ScrollArea,
	SegmentedControl,
	Stack,
	Text,
	TextInput,
	UnstyledButton,
} from "@mantine/core";
import { IconAlertTriangle, IconClipboard, IconRecycle, IconSearch, IconShare } from "@tabler/icons-react";
import dayjs from "dayjs";
import { SITE_URL, type ModuleCategory, type ModuleDefinition, type PageKey, type PageModule } from "@/lib/page-modules";
import { moduleName } from "./model";
import { PreviewFrame, type Device, DEVICES } from "./PreviewFrame";
import classes from "./page-builder.module.css";

export interface Removed {
	module: PageModule;
	page: PageKey;
	at: number;
}

const CATEGORIES: ModuleCategory[] = ["Firm sections", "Page sections", "Text", "Media", "People", "Layout"];

const sharedLabel: Record<string, string> = {
	stats: "Shared statistics",
	practices: "Shared practice areas",
	partners: "Shared partners",
	contactUs: "Shared contact details",
	news: "News feed",
};

/** Words that match a module: its name, description, keywords and category */
const matches = (def: ModuleDefinition, query: string) => {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean);
	const hay = [def.name, def.description, def.category, def.type, ...def.keywords].join(" ").toLowerCase();
	return words.every((w) => hay.includes(w));
};

export function AddModuleModal({
	opened,
	onClose,
	defs,
	modules,
	pageName,
	where,
	atTop,
	clipboard,
	removed,
	onAdd,
	onPaste,
	onRestore,
}: {
	opened: boolean;
	onClose: () => void;
	defs: ModuleDefinition[];
	/** The page's current modules */
	modules: PageModule[];
	pageName: string;
	/** "at the end", "above “Services”"… */
	where: string;
	/** The new module would become the first one */
	atTop: boolean;
	clipboard: PageModule | null;
	removed: Removed[];
	onAdd: (def: ModuleDefinition) => void;
	onPaste: () => void;
	onRestore: (entry: Removed) => void;
}) {
	const [mode, setMode] = useState<"catalogue" | "clipboard" | "removed">("catalogue");
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<string>("all");
	const [selected, setSelected] = useState<ModuleDefinition | null>(null);
	const [device, setDevice] = useState<Device>("desktop");
	const byType = useMemo(() => Object.fromEntries(defs.map((d) => [d.type, d])), [defs]);

	useEffect(() => {
		if (!opened) return;
		setMode("catalogue");
		setQuery("");
		setCategory("all");
		setSelected(null);
	}, [opened]);

	const countOnPage = (def: ModuleDefinition) => modules.filter((m) => m.type === def.type).length;
	const blocked = (def: ModuleDefinition) => (def.single && countOnPage(def) > 0 ? `${pageName} already has one; only one makes sense per page.` : null);

	const shown = defs.filter((d) => (category === "all" || d.category === category) && (!query.trim() || matches(d, query)));
	const groups = CATEGORIES.map((c) => ({ category: c, items: shown.filter((d) => d.category === c) })).filter((g) => g.items.length);
	const current = selected && shown.includes(selected) ? selected : shown[0] ?? null;

	const pasteName = clipboard ? moduleName(clipboard, byType) : "";

	return (
		<Modal opened={opened} onClose={onClose} size="min(1180px, 96vw)" radius="lg" title={<Text fw={600}>Add a module {where}</Text>}>
			<Stack gap="md">
				{(clipboard || removed.length > 0) && (
					<SegmentedControl
						radius="xl"
						value={mode}
						onChange={(v) => setMode(v as typeof mode)}
						data={[
							{ value: "catalogue", label: `All modules · ${defs.length}` },
							...(clipboard ? [{ value: "clipboard", label: "Paste copied module" }] : []),
							...(removed.length ? [{ value: "removed", label: `Recently removed · ${removed.length}` }] : []),
						]}
						style={{ alignSelf: "flex-start" }}
					/>
				)}

				{mode === "clipboard" && clipboard && (
					<Stack gap="sm">
						<Group gap="sm" wrap="nowrap" p="md" style={{ border: "1px solid var(--admin-line)", borderRadius: 12 }}>
							<IconClipboard size={20} />
							<div style={{ flex: 1 }}>
								<Text fw={600}>{pasteName}</Text>
								<Text size="sm" c="dimmed">
									{byType[clipboard.type]?.name ?? clipboard.type} copied from a page. Pasting adds a copy with its content and settings
									{blocked(byType[clipboard.type] ?? ({} as ModuleDefinition)) ? "." : ` ${where}.`}
								</Text>
							</div>
							<Button onClick={onPaste} disabled={!!(byType[clipboard.type] && blocked(byType[clipboard.type]))}>
								Paste
							</Button>
						</Group>
						{byType[clipboard.type] && blocked(byType[clipboard.type]) && (
							<Text size="sm" c="orange.8">
								{blocked(byType[clipboard.type])}
							</Text>
						)}
					</Stack>
				)}

				{mode === "removed" && (
					<Stack gap="xs">
						<Text size="sm" c="dimmed">
							Modules removed since you opened this page. Restoring adds them back {where}.
						</Text>
						{removed.map((entry) => (
							<Group key={`${entry.module.id}-${entry.at}`} gap="sm" wrap="nowrap" p="sm" style={{ border: "1px solid var(--admin-line)", borderRadius: 12 }}>
								<IconRecycle size={18} />
								<div style={{ flex: 1, minWidth: 0 }}>
									<Text fw={600} truncate>
										{moduleName(entry.module, byType)}
									</Text>
									<Text size="xs" c="dimmed">
										{byType[entry.module.type]?.name} · removed from {entry.page === "home" ? "Home page" : "About us"} at {dayjs(entry.at).format("HH:mm")}
									</Text>
								</div>
								<Button size="xs" variant="default" onClick={() => onRestore(entry)}>
									Restore
								</Button>
							</Group>
						))}
					</Stack>
				)}

				{mode === "catalogue" && (
					<Box className={classes.gallery}>
						<Stack gap="sm" style={{ minWidth: 0 }}>
							<TextInput
								data-autofocus
								placeholder="Search modules: photos, faq, partner…"
								leftSection={<IconSearch size={16} />}
								value={query}
								onChange={(e) => setQuery(e.currentTarget.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && current && !blocked(current)) onAdd(current);
								}}
								radius="xl"
							/>
							<Chip.Group value={category} onChange={(v) => setCategory(v as string)}>
								<Group gap={6}>
									<Chip size="xs" value="all">
										All
									</Chip>
									{CATEGORIES.map((c) => (
										<Chip key={c} size="xs" value={c}>
											{c}
										</Chip>
									))}
								</Group>
							</Chip.Group>
							<ScrollArea h={460} type="auto" offsetScrollbars>
								<Stack gap="md" role="listbox" aria-label="Modules">
									{groups.map((g) => (
										<div key={g.category}>
											<Text size="xs" tt="uppercase" fw={600} c="dimmed" lts="0.1em" mb={6}>
												{g.category}
											</Text>
											<Stack gap={4}>
												{g.items.map((def) => {
													const count = countOnPage(def);
													const active = current?.type === def.type;
													return (
														<UnstyledButton
															key={def.type}
															role="option"
															aria-selected={active}
															onClick={() => setSelected(def)}
															onDoubleClick={() => !blocked(def) && onAdd(def)}
															p="sm"
															style={{
																borderRadius: 12,
																background: active ? "#111113" : "transparent",
																color: active ? "white" : undefined,
																opacity: blocked(def) && !active ? 0.55 : 1,
															}}
														>
															<Group justify="space-between" wrap="nowrap" gap="xs">
																<Text size="sm" fw={600} truncate>
																	{def.name}
																</Text>
																<Group gap={4} wrap="nowrap">
																	{def.shared && <IconShare size={13} aria-label="Uses a shared list" />}
																	{count > 0 && (
																		<Badge size="xs" variant={active ? "white" : "light"} color="gray">
																			On page{count > 1 ? ` ×${count}` : ""}
																		</Badge>
																	)}
																</Group>
															</Group>
															<Text size="xs" c={active ? "gray.4" : "dimmed"} lineClamp={2}>
																{def.description}
															</Text>
														</UnstyledButton>
													);
												})}
											</Stack>
										</div>
									))}
									{groups.length === 0 && (
										<Text size="sm" c="dimmed" ta="center" py="xl">
											No module matches “{query}”.
										</Text>
									)}
								</Stack>
							</ScrollArea>
						</Stack>

						{current ? (
							<Stack gap="sm" style={{ minWidth: 0 }}>
								<Group justify="space-between" align="flex-start" wrap="nowrap">
									<div style={{ minWidth: 0 }}>
										<Text fw={700} fz="lg">
											{current.name}
										</Text>
										<Text size="sm" c="dimmed">
											{current.description}
										</Text>
										<Group gap={6} mt={6}>
											<Badge size="sm" variant="light" color="gray">
												{current.category}
											</Badge>
											{current.shared && (
												<Badge size="sm" variant="light" color="teal">
													{sharedLabel[current.shared]}
												</Badge>
											)}
											{current.single && (
												<Badge size="sm" variant="light" color="gray">
													One per page
												</Badge>
											)}
											{current.top && (
												<Badge size="sm" variant="light" color="gray">
													Top of the page
												</Badge>
											)}
											{current.toneable && (
												<Badge size="sm" variant="light" color="gray">
													Background options
												</Badge>
											)}
										</Group>
									</div>
									<SegmentedControl
										size="xs"
										radius="xl"
										value={device}
										onChange={(v) => setDevice(v as Device)}
										data={[
											{ value: "desktop", label: "Desktop" },
											{ value: "mobile", label: "Mobile" },
										]}
									/>
								</Group>
								<Box h={360}>
									<PreviewFrame
										key={current.type}
										title={`Preview of ${current.name}`}
										src={`${SITE_URL}/preview/module/${current.type}`}
										width={DEVICES[device].width}
										minHeight={360}
										message={{
											source: "tga-admin",
											kind: "module",
											module: { id: `preview-${current.type}`, type: current.type, settings: {}, content: current.defaults },
										}}
									/>
								</Box>
								{current.shared && (
									<Text size="xs" c="dimmed">
										{current.shared === "contactUs"
											? "Phone numbers, emails and offices come from Contact info."
											: current.shared === "news"
												? "Lists the latest news automatically."
												: `The items come from the shared list, edited once for every page that shows it.`}
									</Text>
								)}
								{blocked(current) ? (
									<Alert color="orange" variant="light" icon={<IconAlertTriangle size={16} />}>
										{blocked(current)}
									</Alert>
								) : current.top && !atTop ? (
									<Alert color="yellow" variant="light" icon={<IconAlertTriangle size={16} />}>
										This module carries the navigation bar and belongs at the top of the page. You can add it here and move it first.
									</Alert>
								) : null}
								<Group justify="flex-end" mt="auto">
									<Button variant="default" onClick={onClose}>
										Cancel
									</Button>
									<Button onClick={() => onAdd(current)} disabled={!!blocked(current)}>
										Add {current.name.toLowerCase()} {where}
									</Button>
								</Group>
							</Stack>
						) : (
							<div />
						)}
					</Box>
				)}
			</Stack>
		</Modal>
	);
}
