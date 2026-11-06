"use client";

import { useState, type ReactNode } from "react";
import NextLink from "next/link";
import { ActionIcon, Alert, Button, Group, Menu, Stack, Text } from "@mantine/core";
import {
	IconAlertTriangle,
	IconCopyPlus,
	IconDots,
	IconEye,
	IconEyeOff,
	IconInfoCircle,
	IconNote,
	IconPhone,
	IconRotate,
	IconShare,
} from "@tabler/icons-react";
import { blockKeys, moduleForms, type FormBlock, type SubTab } from "@/lib/module-fields";
import { type AboutPart, type ModuleDefinition, type PageModule } from "@/lib/page-modules";
import { useConfirm } from "./context";
import { Block, Fields, type Update } from "./fields";
import { withKeys } from "./model";
import { PillMenuTarget, PillTab } from "./ModuleTabs";
import { PartnersManager, PracticesManager, StatsManager } from "./SharedLists";
import classes from "./page-builder.module.css";

const pick = (source: any, keys: string[]) => Object.fromEntries(keys.filter((k) => k in (source ?? {})).map((k) => [k, structuredClone(source[k])]));

function SharedNote({ children }: { children: ReactNode }) {
	return (
		<Alert variant="light" color="teal" radius="lg" icon={<IconShare size={16} />}>
			{children}
		</Alert>
	);
}

/** The shared list a module shows, managed in place */
function SharedSection({ def }: { def?: ModuleDefinition }) {
	switch (def?.shared) {
		case "stats":
		case "practices":
		case "partners":
			return (
				<Stack gap="md">
					<SharedNote>
						The items below are a shared list: changes save immediately and apply everywhere the list is used, on every page. The heading
						above is part of this module and publishes with the page.
					</SharedNote>
					{def.shared === "stats" ? <StatsManager compact /> : def.shared === "practices" ? <PracticesManager compact /> : <PartnersManager compact />}
				</Stack>
			);
		case "contactUs":
			return (
				<SharedNote>
					<Group justify="space-between" gap="sm">
						<span>Phone numbers, emails and office addresses come from the shared contact details.</span>
						<Button component={NextLink} href="/contact" size="xs" variant="white" leftSection={<IconPhone size={14} />}>
							Edit contact info
						</Button>
					</Group>
				</SharedNote>
			);
		case "news":
			return (
				<SharedNote>
					The newest stories and resources appear here automatically, with the latest featured. Publish news from{" "}
					<NextLink href="/news">News</NextLink>.
				</SharedNote>
			);
		default:
			return null;
	}
}

export function ModuleEditor({
	module,
	def,
	name,
	warnings,
	update,
	replaceContent,
	onCopyAs,
}: {
	module: PageModule;
	def?: ModuleDefinition;
	name: string;
	/** The module's actions menu, given its target */
	menu: (target: ReactNode) => ReactNode;
	warnings: string[];
	update: Update;
	/** Content changes the editors must reload for (resets) */
	replaceContent: (fn: (content: any) => any) => void;
	onSettings: () => void;
	onPreview: () => void;
	onToggleHidden: () => void;
	onCopyAs: (copy: NonNullable<SubTab["copyAs"]>) => void;
}) {
	const form = moduleForms[module.type];
	const confirm = useConfirm();
	const [subTab, setSubTab] = useState(form?.subTabs?.[0]?.id ?? "");
	const s = module.settings;
	const hiddenParts: AboutPart[] = module.content?.hiddenParts ?? [];

	const partsOf = (blocks: FormBlock[]) => blocks.map((b) => b.part).filter(Boolean) as AboutPart[];
	const togglePart = (parts: AboutPart[]) => {
		const allHidden = parts.every((p) => hiddenParts.includes(p));
		update((c) => {
			const current: AboutPart[] = c.hiddenParts ?? [];
			return { ...c, hiddenParts: allHidden ? current.filter((p) => !parts.includes(p)) : [...new Set([...current, ...parts])] };
		});
	};
	const resetBlocks = async (blocks: FormBlock[], label: string) => {
		const ok = await confirm({
			title: `Reset ${label.toLowerCase()}?`,
			message: `${label} goes back to the catalogue's starting content. The rest of the module stays as it is, and you can undo this until you publish.`,
			confirmLabel: "Reset",
		});
		if (ok && def) replaceContent((c) => ({ ...c, ...withKeys(pick(def.defaults, blocks.flatMap(blockKeys))) }));
	};

	const partMenu = (blocks: FormBlock[], label: string, copyAs?: SubTab["copyAs"], target?: ReactNode) => {
		const parts = partsOf(blocks);
		const hidden = parts.length > 0 && parts.every((p) => hiddenParts.includes(p));
		return (
			<Menu position="bottom-end" withinPortal width={240}>
				<Menu.Target>
					{target ?? (
						<ActionIcon variant="subtle" color="gray" aria-label={`Actions for ${label}`}>
							<IconDots size={18} />
						</ActionIcon>
					)}
				</Menu.Target>
				<Menu.Dropdown>
					{parts.length > 0 && (
						<Menu.Item leftSection={hidden ? <IconEye size={14} /> : <IconEyeOff size={14} />} onClick={() => togglePart(parts)}>
							{hidden ? "Show this part" : "Hide this part"}
						</Menu.Item>
					)}
					<Menu.Item leftSection={<IconRotate size={14} />} onClick={() => resetBlocks(blocks, label)} disabled={!def}>
						Reset this part to defaults
					</Menu.Item>
					{copyAs && (
						<Menu.Item leftSection={<IconCopyPlus size={14} />} onClick={() => onCopyAs(copyAs)}>
							Copy as a new {copyAs.label} module
						</Menu.Item>
					)}
				</Menu.Dropdown>
			</Menu>
		);
	};

	const renderBlocks = (blocks: FormBlock[], withMenus: boolean) =>
		blocks.map((block) => (
			<Block
				key={block.id}
				title={block.title}
				description={block.description}
				hidden={!!block.part && hiddenParts.includes(block.part)}
				menu={withMenus ? partMenu([block], block.title) : undefined}
			>
				<Fields fields={block.fields} value={module.content} update={update} path={module.id} />
			</Block>
		));

	return (
		<Stack gap="lg" id="module-panel" role="tabpanel" aria-labelledby={`module-tab-${module.id}`}>
			{/* The module's actions live in its tab menu; only what needs attention shows here */}
			{s.note && (
				<Alert variant="light" color="yellow" radius="md" icon={<IconNote size={16} />} title="Note for editors">
					{s.note}
				</Alert>
			)}
			{warnings.map((w) => (
				<Alert key={w} variant="light" color="orange" radius="md" icon={<IconAlertTriangle size={16} />}>
					{w}
				</Alert>
			))}
			{module.hidden && (
				<Alert variant="light" color="gray" radius="md" icon={<IconEyeOff size={16} />}>
					This module is hidden: it keeps its content here but is left off the public page.
				</Alert>
			)}

			{form?.note && (
				<Alert variant="light" color="gray" radius="lg" icon={<IconInfoCircle size={16} />}>
					{form.note}
				</Alert>
			)}

			{form?.subTabs ? (
				<>
					<div role="tablist" aria-label={`Parts of ${name}`} className={classes.tabs}>
						{form.subTabs.map((tab) => {
							const parts = partsOf(tab.blocks);
							const hidden = parts.length > 0 && parts.every((p) => hiddenParts.includes(p));
							const count = tab.count?.(module.content);
							return (
								<PillTab
									key={tab.id}
									id={`part-tab-${tab.id}`}
									active={subTab === tab.id}
									dimmed={hidden}
									onSelect={() => setSubTab(tab.id)}
									icons={hidden ? <IconEyeOff size={14} aria-label="Hidden" /> : undefined}
									label={count !== undefined ? `${tab.label} · ${count}` : tab.label}
									menu={partMenu(tab.blocks, tab.label, tab.copyAs, <PillMenuTarget label={`Actions for ${tab.label}`} />)}
									style={{ paddingLeft: 8 }}
								/>
							);
						})}
					</div>
					{/* All parts stay mounted so their editors keep their place when switching */}
					{form.subTabs.map((tab) => (
						<Stack key={tab.id} gap="lg" display={subTab === tab.id ? undefined : "none"} role="tabpanel" aria-labelledby={`part-tab-${tab.id}`}>
							{renderBlocks(tab.blocks, tab.blocks.length > 1)}
						</Stack>
					))}
				</>
			) : (
				renderBlocks(form?.blocks ?? [], (form?.blocks?.length ?? 0) > 0)
			)}

			<SharedSection def={def} />
		</Stack>
	);
}
