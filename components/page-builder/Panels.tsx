"use client";

import { useEffect, useState } from "react";
import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Drawer,
	Group,
	Loader,
	Modal,
	SegmentedControl,
	Stack,
	Switch,
	Text,
	Textarea,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import {
	IconAlertTriangle,
	IconArrowsMaximize,
	IconArrowsMinimize,
	IconExternalLink,
	IconHistory,
	IconInfoCircle,
	IconPresentation,
	IconRestore,
	IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { fetchPageRevision, fetchPageRevisions } from "@/app/actions/pages.actions";
import { SITE_URL, pageNames, pagePaths, type PageKey, type PageLayout, type PageModule, type PageRevision } from "@/lib/page-modules";
import type { Check } from "./model";
import { DEVICES, PreviewFrame, type Device } from "./PreviewFrame";

/* ---------- live preview ---------- */

export interface PreviewState {
	open: boolean;
	focusId?: string;
	/** A past version shown instead of the draft */
	version?: { label: string; modules: PageModule[] };
}

export function PreviewDrawer({
	page,
	state,
	modules,
	onClose,
	onSelect,
	onBackToDraft,
	wide,
	onWideChange,
}: {
	page: PageKey;
	state: PreviewState;
	/** The draft, cleaned */
	modules: PageModule[];
	onClose: () => void;
	onSelect: (id: string) => void;
	onBackToDraft: () => void;
	/** Full width, or beside the editor */
	wide: boolean;
	onWideChange: (wide: boolean) => void;
}) {
	const [device, setDevice] = useState<Device>("desktop");
	const [showHidden, setShowHidden] = useState(true);
	const shown = state.version?.modules ?? modules;

	return (
		<Drawer
			opened={state.open}
			onClose={onClose}
			position="right"
			size={wide ? "100%" : "min(50vw, 960px)"}
			// Beside the editor it's a panel, not a dialog: the page stays usable behind it
			withOverlay={wide}
			lockScroll={wide}
			trapFocus={wide}
			closeOnClickOutside={false}
			withCloseButton={false}
			padding={0}
			styles={{ body: { height: "100%", display: "flex", flexDirection: "column" } }}
			shadow="xl"
		>
			<Group justify="space-between" gap="xs" p="sm" pl="md" style={{ borderBottom: "1px solid var(--admin-line)" }}>
				<Group gap="xs">
					<IconPresentation size={18} />
					<Text fw={600}>{state.version ? state.version.label : `Preview · ${pageNames[page]} draft`}</Text>
					{state.version && (
						<Button size="compact-xs" variant="light" onClick={onBackToDraft}>
							Back to the draft
						</Button>
					)}
				</Group>
				<Group gap="xs">
					<SegmentedControl
						size="xs"
						radius="xl"
						value={device}
						onChange={(v) => setDevice(v as Device)}
						data={(Object.keys(DEVICES) as Device[]).map((d) => ({ value: d, label: DEVICES[d].label }))}
					/>
					<Switch size="xs" label="Show hidden" checked={showHidden} onChange={(e) => setShowHidden(e.currentTarget.checked)} />
					<Tooltip label={wide ? "Show beside the editor" : "Full width"}>
						<ActionIcon variant="subtle" color="gray" onClick={() => onWideChange(!wide)} aria-label={wide ? "Show beside the editor" : "Full width"}>
							{wide ? <IconArrowsMinimize size={18} /> : <IconArrowsMaximize size={18} />}
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Open the live page">
						<ActionIcon
							component="a"
							href={`${SITE_URL}${pagePaths[page]}`}
							target="_blank"
							rel="noopener noreferrer"
							variant="subtle"
							color="gray"
							aria-label="Open the live page"
						>
							<IconExternalLink size={18} />
						</ActionIcon>
					</Tooltip>
					<ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close the preview">
						<IconX size={18} />
					</ActionIcon>
				</Group>
			</Group>
			<Text size="xs" c="dimmed" px="md" pt={6}>
				{state.version ? "A published version, as it was." : "Updates as you edit. Click a section in the preview to open it in the editor."}
			</Text>
			<Box p="sm" style={{ flex: 1, minHeight: 0 }}>
				{state.open && (
					<PreviewFrame
						title={`Preview of ${pageNames[page]}`}
						src={`${SITE_URL}/preview/page/${page}`}
						width={DEVICES[device].width}
						onSelect={state.version ? undefined : onSelect}
						message={{ source: "tga-admin", kind: "page", page, modules: shown, showHidden, focusId: state.focusId }}
					/>
				)}
			</Box>
		</Drawer>
	);
}

/* ---------- history ---------- */

export function HistoryDrawer({
	page,
	opened,
	onClose,
	onPreview,
	onRestore,
}: {
	page: PageKey;
	opened: boolean;
	onClose: () => void;
	onPreview: (label: string, modules: PageModule[]) => void;
	onRestore: (label: string, modules: PageModule[]) => void;
}) {
	const [list, setList] = useState<PageRevision[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState<number | null>(null);

	useEffect(() => {
		if (!opened) return;
		setList(null);
		setError(null);
		fetchPageRevisions(page).then((r) => (r.success ? setList(r.data) : setError(r.error)));
	}, [opened, page]);

	const load = async (rev: PageRevision, then: (label: string, modules: PageModule[]) => void) => {
		setBusy(rev.id);
		try {
			const r = await fetchPageRevision(page, rev.id);
			if (!r.success) return setError(r.error);
			then(`Version of ${dayjs(rev.createdAt).format("D MMM YYYY, HH:mm")}`, r.data.modules);
		} finally {
			setBusy(null);
		}
	};

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			size="md"
			title={
				<Group gap="xs">
					<IconHistory size={18} />
					<Text fw={600}>{pageNames[page]} · published versions</Text>
				</Group>
			}
		>
			<Text size="sm" c="dimmed" mb="md">
				Every publish is kept. Preview a version, or restore it into the draft and publish it again.
			</Text>
			{error && (
				<Alert color="red" variant="light" mb="md">
					{error}
				</Alert>
			)}
			{!list && !error && <Loader size="sm" color="gray" />}
			{list?.length === 0 && (
				<Text size="sm" c="dimmed">
					Nothing published yet. The first publish also keeps the page as it was before.
				</Text>
			)}
			<Stack gap="xs">
				{list?.map((rev, i) => (
					<Box key={rev.id} p="sm" style={{ border: "1px solid var(--admin-line)", borderRadius: 12 }}>
						<Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
							<div style={{ minWidth: 0 }}>
								<Group gap={6}>
									<Text size="sm" fw={600}>
										{dayjs(rev.createdAt).format("D MMM YYYY, HH:mm")}
									</Text>
									{i === 0 && (
										<Badge size="xs" color="teal" variant="light">
											Live
										</Badge>
									)}
								</Group>
								<Text size="xs" c="dimmed">
									{rev.createdBy ?? "Unknown"} · {rev.moduleCount} modules{rev.hiddenCount ? `, ${rev.hiddenCount} hidden` : ""}
								</Text>
								{rev.note && (
									<Text size="sm" mt={4} style={{ wordBreak: "break-word" }}>
										“{rev.note}”
									</Text>
								)}
							</div>
						</Group>
						<Group gap="xs" mt="xs">
							<Button size="compact-sm" variant="default" loading={busy === rev.id} onClick={() => load(rev, onPreview)} leftSection={<IconPresentation size={14} />}>
								Preview
							</Button>
							<Button size="compact-sm" variant="default" loading={busy === rev.id} onClick={() => load(rev, onRestore)} leftSection={<IconRestore size={14} />}>
								Restore into draft
							</Button>
						</Group>
					</Box>
				))}
			</Stack>
		</Drawer>
	);
}

/* ---------- publishing ---------- */

export interface Conflict {
	message: string;
	theirs: PageLayout;
}

export function PublishModal({
	opened,
	page,
	checks,
	summary,
	conflict,
	publishing,
	onClose,
	onPublish,
	onLoadTheirs,
	onJump,
}: {
	opened: boolean;
	page: PageKey;
	checks: Check[];
	/** "3 modules changed, 1 added" */
	summary: string;
	conflict: Conflict | null;
	publishing: boolean;
	onClose: () => void;
	onPublish: (note: string, force: boolean) => void;
	onLoadTheirs: () => void;
	onJump: (moduleId: string) => void;
}) {
	const [note, setNote] = useState("");
	useEffect(() => {
		if (opened) setNote("");
	}, [opened]);
	const warnings = checks.filter((c) => c.level === "warning");

	return (
		<Modal opened={opened} onClose={onClose} radius="lg" size="lg" title={<Text fw={600}>Publish {pageNames[page]}</Text>}>
			{conflict ? (
				<Stack>
					<Alert color="orange" variant="light" icon={<IconAlertTriangle size={16} />} title="Someone else published first">
						{conflict.message}
						{conflict.theirs.updatedAt && ` (${dayjs(conflict.theirs.updatedAt).format("D MMM, HH:mm")})`}. Publishing yours replaces their
						changes; loading theirs replaces your draft.
					</Alert>
					<Group justify="flex-end">
						<Button variant="default" onClick={onLoadTheirs}>
							Load their version
						</Button>
						<Button color="orange" loading={publishing} onClick={() => onPublish(note, true)}>
							Publish mine anyway
						</Button>
					</Group>
				</Stack>
			) : (
				<Stack>
					<Text size="sm" c="dimmed">
						{summary}. Visitors see the new page straight away; every published version is kept in History.
					</Text>
					{checks.length > 0 && (
						<Stack gap={6}>
							<Text size="sm" fw={600}>
								{warnings.length ? `Worth a look before publishing (${warnings.length})` : "Notes"}
							</Text>
							{checks.map((c, i) => (
								<UnstyledButton
									key={i}
									onClick={() => c.moduleId && onJump(c.moduleId)}
									disabled={!c.moduleId}
									p="xs"
									style={{ borderRadius: 10, background: c.level === "warning" ? "var(--mantine-color-orange-0)" : "var(--admin-chip)" }}
								>
									<Group gap="xs" wrap="nowrap" align="flex-start">
										{c.level === "warning" ? (
											<IconAlertTriangle size={16} color="var(--mantine-color-orange-6)" style={{ flexShrink: 0, marginTop: 2 }} />
										) : (
											<IconInfoCircle size={16} color="var(--mantine-color-gray-6)" style={{ flexShrink: 0, marginTop: 2 }} />
										)}
										<Text size="sm">{c.message}</Text>
									</Group>
								</UnstyledButton>
							))}
						</Stack>
					)}
					<Textarea
						label="What changed?"
						description="Optional; shown in History"
						placeholder="e.g. New FAQ section, summit photos"
						autosize
						minRows={2}
						maxLength={300}
						value={note}
						onChange={(e) => setNote(e.currentTarget.value)}
						data-autofocus
					/>
					<Group justify="flex-end">
						<Button variant="default" onClick={onClose}>
							Cancel
						</Button>
						<Button color="teal" loading={publishing} onClick={() => onPublish(note, false)}>
							{warnings.length ? "Publish anyway" : "Publish"}
						</Button>
					</Group>
				</Stack>
			)}
		</Modal>
	);
}
