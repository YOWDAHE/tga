"use client";

import { forwardRef, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { ActionIcon, Box, Menu, Text, Tooltip, UnstyledButton } from "@mantine/core";
import {
	IconAlertTriangle,
	IconArrowBarLeft,
	IconArrowBarRight,
	IconArrowLeft,
	IconArrowRight,
	IconArrowsExchange,
	IconClipboard,
	IconClipboardCopy,
	IconClock,
	IconCopy,
	IconDeviceDesktop,
	IconDeviceMobile,
	IconDots,
	IconExternalLink,
	IconEye,
	IconEyeOff,
	IconGripVertical,
	IconLink,
	IconPencil,
	IconPlus,
	IconPresentation,
	IconRestore,
	IconRotate,
	IconRowInsertBottom,
	IconRowInsertTop,
	IconSettings,
	IconSwitchHorizontal,
	IconTrash,
} from "@tabler/icons-react";
import { SortableList, useSortableItem } from "@/components/Sortable";
import { scheduleState, type ModuleDefinition, type PageModule } from "@/lib/page-modules";
import classes from "./page-builder.module.css";

export type ModuleAction =
	| "rename"
	| "settings"
	| "toggleHidden"
	| "duplicate"
	| "addAbove"
	| "addBelow"
	| "moveLeft"
	| "moveRight"
	| "moveFirst"
	| "moveLast"
	| "moveToOther"
	| "copyToOther"
	| "copy"
	| "pasteAbove"
	| "pasteBelow"
	| "revert"
	| "reset"
	| "viewOnSite"
	| "copyLink"
	| "preview"
	| "remove";

/* ---------- a pill tab with its own menu ---------- */

/** A pill like the admin's pill tabs, but with room for a drag grip and an actions menu beside the label */
export function PillTab({
	active,
	dimmed,
	label,
	icons,
	onSelect,
	menu,
	grip,
	style,
	rootRef,
	onPointerDown,
	controls,
	id,
}: {
	active: boolean;
	dimmed?: boolean;
	label: ReactNode;
	icons?: ReactNode;
	onSelect: () => void;
	menu?: ReactNode;
	grip?: ReactNode;
	style?: CSSProperties;
	rootRef?: (el: HTMLElement | null) => void;
	onPointerDown?: (e: any) => void;
	controls?: string;
	id?: string;
}) {
	// Arrow keys move between tabs, as in any tab list
	const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
		if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
		const list = e.currentTarget.closest('[role="tablist"]');
		const tabs = Array.from(list?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
		const i = tabs.indexOf(e.currentTarget);
		const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : i + (e.key === "ArrowRight" ? 1 : -1);
		tabs[(next + tabs.length) % tabs.length]?.focus();
		e.preventDefault();
	};

	return (
		<Box
			ref={rootRef}
			className={classes.pill}
			data-active={active || undefined}
			data-dimmed={dimmed || undefined}
			style={style}
			onPointerDown={onPointerDown}
		>
			{grip}
			<UnstyledButton
				role="tab"
				id={id}
				aria-selected={active}
				aria-controls={controls}
				tabIndex={active ? 0 : -1}
				className={classes.pillLabel}
				onClick={onSelect}
				onKeyDown={onKeyDown}
			>
				{icons}
				<span className={classes.pillText}>{label}</span>
			</UnstyledButton>
			{menu}
		</Box>
	);
}

/** The ⋯ button that opens a pill's menu */
// Menu.Target hands its child a ref and click handlers, so pass them through
export const PillMenuTarget = forwardRef<HTMLButtonElement, { label: string }>(function PillMenuTarget({ label, ...rest }, ref) {
	return (
		<ActionIcon ref={ref} {...rest} size="sm" variant="transparent" className={classes.pillMenu} aria-label={label}>
			<IconDots size={16} />
		</ActionIcon>
	);
});

/* ---------- the module menu ---------- */

export interface MenuState {
	index: number;
	count: number;
	otherPageName: string;
	hasClipboard: boolean;
	/** Why it can't be duplicated / copied / moved there (single modules), or null */
	duplicateBlocked: string | null;
	otherBlocked: string | null;
	changed: boolean;
	isNew: boolean;
	hasAnchor: boolean;
}

export function ModuleMenu({
	module,
	state,
	act,
	target,
}: {
	module: PageModule;
	state: MenuState;
	act: (action: ModuleAction) => void;
	target: ReactNode;
}) {
	const { index, count } = state;
	const first = index === 0;
	const last = index === count - 1;
	const viewBlocked = module.hidden ? "Hidden modules aren't on the site" : !state.hasAnchor ? "Give it a link name in Section settings first" : null;
	return (
		<Menu position="bottom-end" withinPortal width={250} shadow="md">
			<Menu.Target>{target}</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item leftSection={<IconPencil size={14} />} onClick={() => act("rename")}>
					Rename
				</Menu.Item>
				<Menu.Item leftSection={<IconSettings size={14} />} onClick={() => act("settings")}>
					Section settings
				</Menu.Item>
				<Menu.Item leftSection={module.hidden ? <IconEye size={14} /> : <IconEyeOff size={14} />} onClick={() => act("toggleHidden")}>
					{module.hidden ? "Show on the site" : "Hide from the site"}
				</Menu.Item>
				<Menu.Item leftSection={<IconCopy size={14} />} disabled={!!state.duplicateBlocked} onClick={() => act("duplicate")}>
					Duplicate
					{state.duplicateBlocked && (
						<Text size="xs" c="dimmed">
							{state.duplicateBlocked}
						</Text>
					)}
				</Menu.Item>

				<Menu.Divider />
				<Menu.Item leftSection={<IconRowInsertTop size={14} />} onClick={() => act("addAbove")}>
					Add module above
				</Menu.Item>
				<Menu.Item leftSection={<IconRowInsertBottom size={14} />} onClick={() => act("addBelow")}>
					Add module below
				</Menu.Item>
				<Menu.Sub position="left-start" offset={2}>
					<Menu.Sub.Target>
						<Menu.Sub.Item leftSection={<IconArrowsExchange size={14} />} disabled={count < 2}>
							Move
						</Menu.Sub.Item>
					</Menu.Sub.Target>
					<Menu.Sub.Dropdown>
						<Menu.Item leftSection={<IconArrowLeft size={14} />} disabled={first} onClick={() => act("moveLeft")}>
							Move left
						</Menu.Item>
						<Menu.Item leftSection={<IconArrowRight size={14} />} disabled={last} onClick={() => act("moveRight")}>
							Move right
						</Menu.Item>
						<Menu.Item leftSection={<IconArrowBarLeft size={14} />} disabled={first} onClick={() => act("moveFirst")}>
							Move to first
						</Menu.Item>
						<Menu.Item leftSection={<IconArrowBarRight size={14} />} disabled={last} onClick={() => act("moveLast")}>
							Move to last
						</Menu.Item>
					</Menu.Sub.Dropdown>
				</Menu.Sub>
				<Menu.Item leftSection={<IconSwitchHorizontal size={14} />} disabled={!!state.otherBlocked} onClick={() => act("moveToOther")}>
					Move to {state.otherPageName}
				</Menu.Item>
				<Menu.Item leftSection={<IconCopy size={14} />} disabled={!!state.otherBlocked} onClick={() => act("copyToOther")}>
					Copy to {state.otherPageName}
				</Menu.Item>
				{state.otherBlocked && (
					<Menu.Label style={{ whiteSpace: "normal", textTransform: "none", letterSpacing: 0 }}>{state.otherBlocked}</Menu.Label>
				)}

				<Menu.Divider />
				<Menu.Item leftSection={<IconClipboardCopy size={14} />} onClick={() => act("copy")}>
					Copy module
				</Menu.Item>
				<Menu.Item leftSection={<IconClipboard size={14} />} disabled={!state.hasClipboard} onClick={() => act("pasteAbove")}>
					Paste above
				</Menu.Item>
				<Menu.Item leftSection={<IconClipboard size={14} />} disabled={!state.hasClipboard} onClick={() => act("pasteBelow")}>
					Paste below
				</Menu.Item>

				<Menu.Divider />
				<Menu.Item leftSection={<IconPresentation size={14} />} onClick={() => act("preview")}>
					Preview this module
				</Menu.Item>
				<Menu.Item leftSection={<IconExternalLink size={14} />} disabled={!!viewBlocked} onClick={() => act("viewOnSite")}>
					View on the live site
					{viewBlocked && (
						<Text size="xs" c="dimmed">
							{viewBlocked}
						</Text>
					)}
				</Menu.Item>
				<Menu.Item leftSection={<IconLink size={14} />} disabled={!state.hasAnchor} onClick={() => act("copyLink")}>
					Copy link to this section
				</Menu.Item>

				<Menu.Divider />
				<Menu.Item leftSection={<IconRestore size={14} />} disabled={!state.changed || state.isNew} onClick={() => act("revert")}>
					Undo changes since publishing
				</Menu.Item>
				<Menu.Item leftSection={<IconRotate size={14} />} onClick={() => act("reset")}>
					Reset content to defaults
				</Menu.Item>
				<Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => act("remove")}>
					Remove from page
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}

/* ---------- the row of module tabs ---------- */

function ModuleTab({
	module,
	def,
	name,
	active,
	changed,
	warning,
	onSelect,
	menu,
}: {
	module: PageModule;
	def?: ModuleDefinition;
	name: string;
	active: boolean;
	changed: boolean;
	warning: string | null;
	onSelect: () => void;
	menu: (target: ReactNode) => ReactNode;
}) {
	const { itemProps, handle, isDragging } = useSortableItem(module.id);
	const schedule = scheduleState(module.settings);
	const visibleOn = module.settings.visibleOn;
	const icons = (
		<>
			{module.hidden && <IconEyeOff size={14} aria-label="Hidden" />}
			{schedule && (
				<Tooltip label={schedule === "upcoming" ? "Scheduled: not showing yet" : schedule === "ended" ? "Schedule ended: not showing" : "Scheduled"}>
					<IconClock size={14} aria-label="Scheduled" color={schedule === "live" ? undefined : "var(--mantine-color-orange-6)"} />
				</Tooltip>
			)}
			{visibleOn && visibleOn !== "all" && (
				<Tooltip label={visibleOn === "desktop" ? "Desktop only" : "Phones and tablets only"}>
					{visibleOn === "desktop" ? <IconDeviceDesktop size={14} aria-label="Desktop only" /> : <IconDeviceMobile size={14} aria-label="Phones and tablets only" />}
				</Tooltip>
			)}
			{warning && (
				<Tooltip label={warning} multiline w={260}>
					<IconAlertTriangle size={14} color="var(--mantine-color-yellow-6)" aria-label={warning} />
				</Tooltip>
			)}
		</>
	);
	return (
		<PillTab
			id={`module-tab-${module.id}`}
			controls="module-panel"
			rootRef={itemProps.ref}
			style={{ ...itemProps.style, cursor: isDragging ? "grabbing" : undefined }}
			// The whole pill drags with the pointer; the keyboard drags with the grip
			onPointerDown={handle.listeners?.onPointerDown as ((e: any) => void) | undefined}
			active={active}
			dimmed={module.hidden}
			onSelect={onSelect}
			icons={icons}
			label={
				<>
					{name}
					{changed && <span className={classes.dot} aria-label="Unsaved changes" />}
				</>
			}
			grip={
				<span
					ref={handle.ref}
					{...handle.attributes}
					{...handle.listeners}
					className={classes.pillGrip}
					aria-label={`Drag to reorder ${name}. Press space, then the arrow keys`}
					aria-roledescription="sortable"
				>
					<IconGripVertical size={13} />
				</span>
			}
			menu={menu(<PillMenuTarget label={`Actions for ${name}`} />)}
		/>
	);
}

export function ModuleTabs({
	modules,
	defs,
	activeId,
	names,
	changed,
	warnings,
	onSelect,
	onMove,
	onAdd,
	menuFor,
}: {
	modules: PageModule[];
	defs: Partial<Record<string, ModuleDefinition>>;
	activeId: string | null;
	names: Record<string, string>;
	changed: Set<string>;
	warnings: Record<string, string>;
	onSelect: (id: string) => void;
	onMove: (from: number, to: number) => void;
	onAdd: () => void;
	menuFor: (module: PageModule, target: ReactNode) => ReactNode;
}) {
	const list = useRef<HTMLDivElement>(null);
	return (
		<SortableList ids={modules.map((m) => m.id)} layout="grid" onMove={onMove}>
			<div ref={list} role="tablist" aria-label="Modules on this page" className={classes.tabs}>
				{modules.map((m) => (
					<ModuleTab
						key={m.id}
						module={m}
						def={defs[m.type]}
						name={names[m.id]}
						active={m.id === activeId}
						changed={changed.has(m.id)}
						warning={warnings[m.id] ?? null}
						onSelect={() => onSelect(m.id)}
						menu={(target) => menuFor(m, target)}
					/>
				))}
				<UnstyledButton className={classes.addPill} onClick={onAdd} aria-label="Add a module">
					<IconPlus size={16} />
					<span>Add module</span>
				</UnstyledButton>
			</div>
		</SortableList>
	);
}
