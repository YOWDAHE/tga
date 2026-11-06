"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import NextLink from "next/link";
import {
	ActionIcon,
	Alert,
	Box,
	Button,
	FileButton,
	Group,
	Menu,
	Paper,
	Stack,
	Text,
	Tooltip,
	Transition,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	IconArrowBackUp,
	IconArrowForwardUp,
	IconDots,
	IconDownload,
	IconExternalLink,
	IconHistory,
	IconLayoutGridAdd,
	IconPhone,
	IconPresentation,
	IconRestore,
	IconTrash,
	IconUpload,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { publishPage } from "@/app/actions/pages.actions";
import { PageHeader } from "@/components/admin-ui";
import { arrayMove } from "@/components/Sortable";
import type { SubTab } from "@/lib/module-fields";
import {
	SITE_URL,
	pageKeys,
	pageNames,
	pagePaths,
	plainText,
	type ModuleCatalogue,
	type ModuleDefinition,
	type ModuleType,
	type PageKey,
	type PageLayout,
	type PageModule,
} from "@/lib/page-modules";
import { AddModuleModal, type Removed } from "./AddModuleModal";
import { ConfirmProvider, IconsContext, useConfirm } from "./context";
import type { Update } from "./fields";
import { LinkPagesContext, staticPages, type LinkPage } from "./LinkPicker";
import { ModuleEditor } from "./ModuleEditor";
import { ModuleMenu, ModuleTabs, type MenuState, type ModuleAction } from "./ModuleTabs";
import {
	checkPage,
	clean,
	copyModule,
	createModule,
	fingerprint,
	insertAt,
	moduleName,
	parseImport,
	prepare,
	sameModules,
	withKeys,
} from "./model";
import { HistoryDrawer, PreviewDrawer, PublishModal, type Conflict, type PreviewState } from "./Panels";
import { SettingsModal } from "./SettingsModal";
import {
	PartnersManager,
	PracticesManager,
	SharedListsProvider,
	StatsManager,
	type Partner,
	type Practice,
	type Stat,
} from "./SharedLists";
import { useDrafts } from "./useDrafts";
import classes from "./page-builder.module.css";

type View = PageKey | "shared";

const DRAFT_KEY = (key: PageKey) => `tga-pages:draft:${key}`;
const CLIPBOARD_KEY = "tga-pages:clipboard";

// Browser storage can be full or blocked; the builder works without it
const storage = {
	get<T>(key: string): T | null {
		try {
			const raw = localStorage.getItem(key);
			return raw ? (JSON.parse(raw) as T) : null;
		} catch {
			return null;
		}
	},
	set(key: string, value: unknown) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			/* full or blocked */
		}
	},
	remove(key: string) {
		try {
			localStorage.removeItem(key);
		} catch {
			/* blocked */
		}
	},
};

interface SavedDraft {
	modules: PageModule[];
	baseUpdatedAt: string | null;
	savedAt: number;
}

const notify = (title: string, message: ReactNode, color = "green") => notifications.show({ title, message, color });
const otherPage = (key: PageKey): PageKey => (key === "home" ? "about" : "home");
const sectionUrl = (key: PageKey, anchor: string) =>
	`${SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")}${pagePaths[key] === "/" ? "/" : pagePaths[key]}#${anchor}`;

export interface PageBuilderProps {
	catalogue: ModuleCatalogue | null;
	layouts: Record<PageKey, PageLayout | null>;
	initialStats: Stat[];
	initialPractices: Practice[];
	initialPartners: Partner[];
}

export default function PageBuilder(props: PageBuilderProps) {
	return (
		<ConfirmProvider>
			<SharedListsProvider
				initialStats={props.initialStats}
				initialPractices={props.initialPractices}
				initialPartners={props.initialPartners}
			>
				<IconsContext.Provider value={props.catalogue?.icons ?? []}>
					<Builder {...props} />
				</IconsContext.Provider>
			</SharedListsProvider>
		</ConfirmProvider>
	);
}

function Builder({ catalogue, layouts }: PageBuilderProps) {
	const confirm = useConfirm();
	const defList = useMemo(() => catalogue?.modules ?? [], [catalogue]);
	const defs = useMemo(
		() => Object.fromEntries(defList.map((d) => [d.type, d])) as Partial<Record<ModuleType, ModuleDefinition>>,
		[defList],
	);

	const emptyLayout = (key: PageKey): PageLayout => ({ key, modules: [], updatedAt: null, updatedBy: null });
	const [published, setPublished] = useState<Record<PageKey, PageLayout>>(() => ({
		home: layouts.home ?? emptyLayout("home"),
		about: layouts.about ?? emptyLayout("about"),
	}));
	const { drafts, change, replace, undo, redo, canUndo, canRedo, epoch } = useDrafts({
		home: (layouts.home?.modules ?? []).map(prepare),
		about: (layouts.about?.modules ?? []).map(prepare),
	});

	const [view, setView] = useState<View>("home");
	const page: PageKey = view === "shared" ? "home" : view;
	const [active, setActive] = useState<Record<PageKey, string | null>>(() => ({
		home: layouts.home?.modules[0]?.id ?? null,
		about: layouts.about?.modules[0]?.id ?? null,
	}));
	const [addAt, setAddAt] = useState<{ page: PageKey; index: number } | null>(null);
	const [settingsFor, setSettingsFor] = useState<{ id: string; focus: "name" | "settings" } | null>(null);
	const [preview, setPreview] = useState<PreviewState>({ open: false });
	const [previewWide, setPreviewWide] = useState(false);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [publishOpen, setPublishOpen] = useState(false);
	const [publishing, setPublishing] = useState(false);
	const [conflict, setConflict] = useState<Conflict | null>(null);
	const [clipboard, setClipboard] = useState<PageModule | null>(null);
	const [removed, setRemoved] = useState<Removed[]>([]);
	const [offers, setOffers] = useState<Partial<Record<PageKey, SavedDraft>>>({});
	const [hydrated, setHydrated] = useState(false);

	const loaded = (key: PageKey) => layouts[key] !== null;
	const dirty = useMemo(
		() =>
			Object.fromEntries(
				pageKeys.map((k) => [k, loaded(k) && !sameModules(drafts[k], published[k].modules)]),
			) as Record<PageKey, boolean>,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[drafts, published],
	);

	/* ---------- browser storage: clipboard, autosaved drafts ---------- */

	useEffect(() => {
		setClipboard(storage.get<PageModule>(CLIPBOARD_KEY));
		const found: Partial<Record<PageKey, SavedDraft>> = {};
		for (const key of pageKeys) {
			const saved = storage.get<SavedDraft>(DRAFT_KEY(key));
			if (saved && Array.isArray(saved.modules) && loaded(key) && !sameModules(saved.modules, published[key].modules))
				found[key] = saved;
			else storage.remove(DRAFT_KEY(key));
		}
		setOffers(found);
		setHydrated(true);
		// Another tab copying a module makes it pasteable here too
		const onStorage = (e: StorageEvent) =>
			e.key === CLIPBOARD_KEY && setClipboard(storage.get<PageModule>(CLIPBOARD_KEY));
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Keep unpublished drafts in the browser, so a closed tab or a crash loses nothing. A page with a
	// pending "restore?" offer isn't written until the offer is answered.
	useEffect(() => {
		if (!hydrated) return;
		const timer = setTimeout(() => {
			for (const key of pageKeys) {
				if (offers[key] || !loaded(key)) continue;
				if (dirty[key])
					storage.set(DRAFT_KEY(key), {
						modules: clean(drafts[key]),
						baseUpdatedAt: published[key].updatedAt,
						savedAt: Date.now(),
					});
				else storage.remove(DRAFT_KEY(key));
			}
		}, 600);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [drafts, dirty, offers, hydrated, published]);

	// Leaving with unpublished changes asks first
	useEffect(() => {
		if (!dirty.home && !dirty.about) return;
		const warn = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [dirty.home, dirty.about]);

	// Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z, unless a text field has focus (it has its own undo)
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
			const key = e.key.toLowerCase();
			if (key !== "z" && key !== "y") return;
			const el = e.target as HTMLElement | null;
			if (el && (el.isContentEditable || el.closest("input, textarea, select, [contenteditable='true']"))) return;
			e.preventDefault();
			if (key === "y" || e.shiftKey) redo();
			else undo();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [undo, redo]);

	/* ---------- editing helpers ---------- */

	const setModules = useCallback(
		(key: PageKey, fn: (modules: PageModule[]) => PageModule[], coalesce?: string) =>
			change((d) => ({ ...d, [key]: fn(d[key]) }), coalesce),
		[change],
	);
	const updateModule = (key: PageKey, id: string, fn: (m: PageModule) => PageModule, coalesce?: string) =>
		setModules(key, (list) => list.map((m) => (m.id === id ? fn(m) : m)), coalesce);
	const select = (key: PageKey, id: string | null) => setActive((a) => ({ ...a, [key]: id }));
	const nameOf = (m: PageModule) => moduleName(m, defs);
	const singleBlocked = (def: ModuleDefinition | undefined, list: PageModule[], pageName: string, except?: string) =>
		def?.single && list.some((x) => x.type === def.type && x.id !== except)
			? `${pageName} already has a ${def.name.toLowerCase()}; only one makes sense per page.`
			: null;

	/** Puts a module into a page at `index`, opens its tab and says so */
	const place = (key: PageKey, index: number, m: PageModule, message?: string) => {
		setModules(key, (list) => insertAt(list, Math.min(index, list.length), m));
		select(key, m.id);
		if (defs[m.type]?.top && index !== 0)
			notify(
				"Added below the top",
				`${nameOf(m)} carries the navigation bar and belongs first on the page. Use Move › Move to first.`,
				"yellow",
			);
		else if (message) notify("Done", message);
	};

	const copyToClipboard = (m: PageModule) => {
		const copy = clean(m);
		setClipboard(copy);
		storage.set(CLIPBOARD_KEY, copy);
		notify("Module copied", `Paste “${nameOf(m)}” on either page from a module's menu or the Add module gallery.`);
	};

	const paste = (key: PageKey, index: number) => {
		if (!clipboard || !defs[clipboard.type]) return;
		const blocked = singleBlocked(defs[clipboard.type], drafts[key], pageNames[key]);
		if (blocked) return notify("Can't paste", blocked, "orange");
		place(key, index, copyModule(prepare(clipboard), drafts[key]), `Pasted “${nameOf(clipboard)}”.`);
		setAddAt(null);
	};

	const removeModule = async (key: PageKey, m: PageModule) => {
		const ok = await confirm({
			title: `Remove “${nameOf(m)}”?`,
			message: (
				<>
					The {defs[m.type]?.name.toLowerCase() ?? "module"} and its content leave the {pageNames[key]} draft. Until you
					publish you can undo this, or bring it back from <b>Add module › Recently removed</b>.
					{defs[m.type]?.shared && " The shared list it shows is not affected."}
				</>
			),
		});
		if (!ok) return;
		const list = drafts[key];
		const index = list.findIndex((x) => x.id === m.id);
		setModules(key, (l) => l.filter((x) => x.id !== m.id));
		setRemoved((r) => [{ module: clean(m), page: key, at: Date.now() }, ...r].slice(0, 20));
		if (active[key] === m.id) select(key, list[index + 1]?.id ?? list[index - 1]?.id ?? null);
	};

	const act = async (key: PageKey, m: PageModule, action: ModuleAction) => {
		const list = drafts[key];
		const index = list.findIndex((x) => x.id === m.id);
		const other = otherPage(key);
		const move = (to: number) =>
			setModules(key, (l) =>
				arrayMove(
					l,
					l.findIndex((x) => x.id === m.id),
					to,
				),
			);
		switch (action) {
			case "rename":
				return setSettingsFor({ id: m.id, focus: "name" });
			case "settings":
				return setSettingsFor({ id: m.id, focus: "settings" });
			case "toggleHidden":
				return updateModule(key, m.id, (x) => ({ ...x, hidden: !x.hidden || undefined }));
			case "duplicate": {
				if (singleBlocked(defs[m.type], list, pageNames[key])) return;
				return place(key, index + 1, copyModule(m, list, `${nameOf(m)} (copy)`));
			}
			case "addAbove":
				return setAddAt({ page: key, index });
			case "addBelow":
				return setAddAt({ page: key, index: index + 1 });
			case "moveLeft":
				return move(Math.max(0, index - 1));
			case "moveRight":
				return move(Math.min(list.length - 1, index + 1));
			case "moveFirst":
				return move(0);
			case "moveLast":
				return move(list.length - 1);
			case "moveToOther":
			case "copyToOther": {
				const blocked = singleBlocked(defs[m.type], drafts[other], pageNames[other]);
				if (blocked) return notify("Can't do that", blocked, "orange");
				const copy = copyModule(m, drafts[other]);
				// A moved module keeps its id when the other page doesn't use it, so History reads naturally
				const moved =
					action === "moveToOther" && !drafts[other].some((x) => x.id === m.id) ? { ...copy, id: m.id } : copy;
				change((d) => ({
					...d,
					[other]: [...d[other], moved],
					...(action === "moveToOther" ? { [key]: d[key].filter((x) => x.id !== m.id) } : {}),
				}));
				if (action === "moveToOther" && active[key] === m.id)
					select(key, list[index + 1]?.id ?? list[index - 1]?.id ?? null);
				select(other, moved.id);
				return notifications.show({
					title: action === "moveToOther" ? `Moved to ${pageNames[other]}` : `Copied to ${pageNames[other]}`,
					message: (
						<>
							“{nameOf(m)}” is now the last module of the {pageNames[other]} draft.{" "}
							<Button size="compact-xs" variant="light" onClick={() => setView(other)}>
								Go there
							</Button>
						</>
					),
					color: "green",
				});
			}
			case "copy":
				return copyToClipboard(m);
			case "pasteAbove":
				return paste(key, index);
			case "pasteBelow":
				return paste(key, index + 1);
			case "revert": {
				const original = published[key].modules.find((x) => x.id === m.id);
				if (!original) return;
				if (
					await confirm({
						title: `Undo changes to “${nameOf(m)}”?`,
						message: "The module goes back to how it is on the live site.",
						confirmLabel: "Undo changes",
					})
				)
					replace((d) => ({
						...d,
						[key]: d[key].map((x) => (x.id === m.id ? prepare(structuredClone(original)) : x)),
					}));
				return;
			}
			case "reset": {
				const def = defs[m.type];
				if (!def) return;
				const ok = await confirm({
					title: `Reset “${nameOf(m)}”?`,
					message:
						"Its content goes back to the catalogue's starting text and photos. Its name and settings stay. You can undo this until you publish.",
					confirmLabel: "Reset content",
				});
				if (ok)
					replace((d) => ({
						...d,
						[key]: d[key].map((x) => (x.id === m.id ? { ...x, content: withKeys(structuredClone(def.defaults)) } : x)),
					}));
				return;
			}
			case "viewOnSite":
				if (m.settings.anchor) window.open(sectionUrl(key, m.settings.anchor), "_blank", "noopener,noreferrer");
				return;
			case "copyLink":
				if (!m.settings.anchor) return;
				try {
					await navigator.clipboard.writeText(sectionUrl(key, m.settings.anchor));
					notify("Link copied", sectionUrl(key, m.settings.anchor));
				} catch {
					notify("Couldn't copy", sectionUrl(key, m.settings.anchor), "orange");
				}
				return;
			case "preview":
				return setPreview({ open: true, focusId: m.id });
			case "remove":
				return removeModule(key, m);
		}
	};

	/* ---------- derived ---------- */

	const modules = drafts[page];
	const activeModule = modules.find((m) => m.id === active[page]) ?? modules[0] ?? null;
	// Two unnamed modules of one type ("Photo strip", "Photo strip") get their title or link name added
	const names = useMemo(() => {
		const base = modules.map((m) => moduleName(m, defs));
		return Object.fromEntries(
			modules.map((m, i) => {
				if (m.name?.trim() || base.filter((b) => b === base[i]).length < 2) return [m.id, base[i]];
				const hint = plainText(m.content?.title ?? "") || m.settings.anchor || plainText(m.content?.label ?? "");
				return [
					m.id,
					hint
						? `${base[i]} · ${hint.length > 24 ? `${hint.slice(0, 23)}…` : hint}`
						: `${base[i]} ${base.slice(0, i + 1).filter((b) => b === base[i]).length}`,
				];
			}),
		);
	}, [modules, defs]);
	const checks = useMemo(() => checkPage(page, modules, defs), [page, modules, defs]);
	const warningsById = useMemo(() => {
		const out: Record<string, string[]> = {};
		for (const c of checks) if (c.moduleId && c.level === "warning") (out[c.moduleId] ??= []).push(c.message);
		return out;
	}, [checks]);
	const changedIds = useMemo(() => {
		const before = new Map(published[page].modules.map((m) => [m.id, fingerprint([m])]));
		return new Set(modules.filter((m) => before.get(m.id) !== fingerprint([m])).map((m) => m.id));
	}, [modules, published, page]);

	const cleanModules = useMemo(() => clean(modules), [modules]);
	const summary = useMemo(() => {
		const before = new Set(published[page].modules.map((m) => m.id));
		const now = new Set(modules.map((m) => m.id));
		const added = modules.filter((m) => !before.has(m.id)).length;
		const gone = published[page].modules.filter((m) => !now.has(m.id)).length;
		const edited = [...changedIds].filter((id) => before.has(id)).length;
		const orderChanged =
			modules
				.filter((m) => before.has(m.id))
				.map((m) => m.id)
				.join() !==
			published[page].modules
				.filter((m) => now.has(m.id))
				.map((m) => m.id)
				.join();
		const parts = [
			edited && `${edited} module${edited === 1 ? "" : "s"} changed`,
			added && `${added} added`,
			gone && `${gone} removed`,
			orderChanged && "new order",
		].filter(Boolean);
		return parts.length ? parts.join(", ").replace(/^./, (c) => c.toUpperCase()) : "No changes";
	}, [modules, published, page, changedIds]);

	const menuState = (key: PageKey, m: PageModule): MenuState => {
		const list = drafts[key];
		const other = otherPage(key);
		return {
			index: list.findIndex((x) => x.id === m.id),
			count: list.length,
			otherPageName: pageNames[other],
			hasClipboard: !!clipboard && !!defs[clipboard.type],
			duplicateBlocked: defs[m.type]?.single ? "Only one per page" : null,
			otherBlocked: singleBlocked(defs[m.type], drafts[other], pageNames[other]),
			changed: changedIds.has(m.id),
			isNew: !published[key].modules.some((x) => x.id === m.id),
			hasAnchor: !!m.settings.anchor,
		};
	};
	const menuFor = (key: PageKey) => (m: PageModule, target: ReactNode) => (
		<ModuleMenu module={m} state={menuState(key, m)} act={(a) => act(key, m, a)} target={target} />
	);

	/* ---------- whole-page actions ---------- */

	const discard = async (key: PageKey) => {
		const ok = await confirm({
			title: `Discard changes to ${pageNames[key]}?`,
			message: "The draft goes back to the published page. You can still undo this while the page is open.",
			confirmLabel: "Discard changes",
		});
		if (!ok) return;
		replace((d) => ({ ...d, [key]: published[key].modules.map((m) => prepare(structuredClone(m))) }));
	};

	const publish = async (note: string, force: boolean) => {
		const key = page;
		setPublishing(true);
		try {
			const result = await publishPage(key, {
				modules: clean(drafts[key]),
				note: note.trim() || undefined,
				...(force ? {} : { baseUpdatedAt: published[key].updatedAt }),
			});
			if (result.success) {
				setPublished((p) => ({ ...p, [key]: result.data }));
				storage.remove(DRAFT_KEY(key));
				setConflict(null);
				setPublishOpen(false);
				return notify("Published", `${pageNames[key]} is live.`);
			}
			if (result.status === 409 && result.data)
				return setConflict({ message: result.error, theirs: result.data as PageLayout });
			notify("Not published", result.error, "red");
		} finally {
			setPublishing(false);
		}
	};

	const loadTheirs = () => {
		if (!conflict) return;
		const theirs = conflict.theirs;
		setPublished((p) => ({ ...p, [page]: theirs }));
		replace((d) => ({ ...d, [page]: theirs.modules.map((m) => prepare(m)) }));
		setConflict(null);
		setPublishOpen(false);
		notify("Loaded", `You're now editing the version ${theirs.updatedBy ?? "someone else"} published.`);
	};

	const exportPage = () => {
		const data = { page, name: pageNames[page], exportedAt: new Date().toISOString(), modules: clean(modules) };
		const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
		const a = document.createElement("a");
		a.href = url;
		a.download = `${page}-page-${dayjs().format("YYYY-MM-DD-HHmm")}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const importPage = async (file: File | null) => {
		if (!file) return;
		const parsed = parseImport(
			await file.text(),
			defList.map((d) => d.type),
		);
		if ("error" in parsed) return notify("Can't import", parsed.error, "red");
		const ok = await confirm({
			title: `Replace the ${pageNames[page]} draft?`,
			message: `The draft becomes the ${parsed.modules.length} modules in “${file.name}”. Nothing is published until you publish, and you can undo this.`,
			confirmLabel: "Import",
			danger: false,
		});
		if (!ok) return;
		replace((d) => ({ ...d, [page]: parsed.modules }));
		select(page, parsed.modules[0]?.id ?? null);
	};

	const answerOffer = (key: PageKey, restore: boolean) => {
		const offer = offers[key];
		if (restore && offer) {
			const restored = offer.modules.map((m) => prepare(m));
			replace((d) => ({ ...d, [key]: restored }));
			select(key, restored[0]?.id ?? null);
			setView(key);
		} else storage.remove(DRAFT_KEY(key));
		setOffers((o) => ({ ...o, [key]: undefined }));
	};

	const restoreVersion = async (label: string, list: PageModule[]) => {
		const ok = await confirm({
			title: "Restore this version into the draft?",
			message: `${label} replaces your draft of ${pageNames[page]}. Publish to make it live again; until then you can undo this.`,
			confirmLabel: "Restore",
			danger: false,
		});
		if (!ok) return;
		const restored = list.map((m) => prepare(structuredClone(m)));
		replace((d) => ({ ...d, [page]: restored }));
		select(page, restored[0]?.id ?? null);
		setHistoryOpen(false);
		notify("Restored into the draft", "Review it, then publish.");
	};

	const copyAs = (m: PageModule, copy: NonNullable<SubTab["copyAs"]>) => {
		const def = defs[copy.type];
		if (!def) return;
		const fresh: PageModule = { ...createModule(def), content: withKeys(clean(copy.content(m.content))) };
		const index = modules.findIndex((x) => x.id === m.id);
		place(page, index + 1, fresh, `A new ${def.name.toLowerCase()} module now follows “${nameOf(m)}”.`);
	};

	const openFromPreview = (id: string) => {
		const key = pageKeys.find((k) => drafts[k].some((m) => m.id === id));
		if (!key) return;
		setView(key);
		select(key, id);
	};

	/* ---------- render ---------- */

	const dot = <span className={classes.dot} aria-label="Unsaved changes" />;
	const pageLabel = (key: PageKey) => (
		<>
			{pageNames[key]}
			<span className={classes.pageCount}>{drafts[key].length}</span>
			{dirty[key] && dot}
		</>
	);
	const target = addAt ? drafts[addAt.page] : [];
	const where =
		!addAt || addAt.index >= target.length ? "at the end" : `above “${moduleName(target[addAt.index], defs)}”`;
	const settingsModule = settingsFor ? (modules.find((m) => m.id === settingsFor.id) ?? null) : null;
	const sideBySide = preview.open && !previewWide;
	const dirtyPages = pageKeys.filter((k) => dirty[k]);
	const barPage: PageKey | null = view === "shared" ? (dirtyPages[0] ?? null) : dirty[page] ? page : null;
	const hiddenCount = modules.filter((m) => m.hidden).length;

	// Every page the link picker offers; sections come from the drafts, so a module added a moment ago is linkable
	const linkPages = useMemo<LinkPage[]>(
		() => [
			...pageKeys.map((key) => ({
				name: pageNames[key],
				path: pagePaths[key],
				sections: drafts[key].map((m) => ({
					id: m.settings?.anchor || m.id,
					name: moduleName(m, defs),
					title: plainText(m.content?.title || m.content?.label || m.content?.name || "").slice(0, 60),
					hidden: m.hidden,
				})),
			})),
			...staticPages,
		],
		[drafts, defs],
	);

	return (
		<LinkPagesContext.Provider value={linkPages}>
			<Box
				p={{ base: "sm", sm: "lg" }}
				maw={sideBySide ? undefined : 1100}
				style={sideBySide ? { marginRight: "min(50vw, 960px)" } : undefined}
			>
				<PageHeader
					eyebrow="Website"
					title="Website pages"
					description="Build the home and about pages from modules: add, reorder, hide or move sections, edit their content, preview the draft and publish when it's ready."
					actions={
						<Button
							component="a"
							href={SITE_URL || "/"}
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

				{/* The pages as big titles; the one being edited is in full ink */}
				<div role="tablist" aria-label="Pages" className={classes.pageTitles}>
					{(["home", "about", "shared"] as View[]).map((key) => (
						<button
							key={key}
							type="button"
							role="tab"
							aria-selected={view === key}
							data-active={view === key || undefined}
							className={classes.pageTitle}
							onClick={() => setView(key)}
						>
							{key === "shared" ? "Shared lists" : pageLabel(key)}
						</button>
					))}
				</div>

				{pageKeys.map((key) =>
					offers[key] ? (
						<Alert
							key={key}
							mb="md"
							color="blue"
							variant="light"
							radius="lg"
							icon={<IconRestore size={18} />}
							title={`Unsaved draft of ${pageNames[key]}`}
						>
							<Text size="sm">
								You left changes unpublished {dayjs(offers[key]!.savedAt).format("D MMM [at] HH:mm")}.
								{offers[key]!.baseUpdatedAt !== published[key].updatedAt &&
									` The page has been published since${published[key].updatedBy ? ` by ${published[key].updatedBy}` : ""}; restoring and publishing would replace that.`}
							</Text>
							<Group gap="xs" mt="sm">
								<Button size="xs" onClick={() => answerOffer(key, true)}>
									Restore draft
								</Button>
								<Button size="xs" variant="default" onClick={() => answerOffer(key, false)}>
									Discard it
								</Button>
							</Group>
						</Alert>
					) : null,
				)}

				{!catalogue && (
					<Alert mb="md" color="orange" variant="light" radius="lg">
						The module catalogue couldn't be loaded, so new modules can't be added right now. Existing modules can still
						be edited.
					</Alert>
				)}

				{view === "shared" ? (
					<Stack gap="lg">
						<Text size="sm" c="dimmed" maw={680}>
							These lists are shared: the Statistics, Practice areas and Partner logos modules show them on whichever
							pages use those modules. Changes save immediately.
						</Text>
						<StatsManager />
						<PracticesManager />
						<PartnersManager />
						<Paper withBorder p={{ base: "md", sm: "xl" }}>
							<Group justify="space-between" gap="sm">
								<div>
									<Text fw={600} fz="lg">
										Contact details
									</Text>
									<Text size="sm" c="dimmed">
										Phone numbers, emails and offices shown by the Contact form module and the site footer.
									</Text>
								</div>
								<Button component={NextLink} href="/contact" variant="default" leftSection={<IconPhone size={16} />}>
									Edit contact info
								</Button>
							</Group>
						</Paper>
					</Stack>
				) : !loaded(page) ? (
					<Alert color="red" variant="light" radius="lg" title={`${pageNames[page]} couldn't be loaded`}>
						Reload the page to try again. If it keeps failing, check that your account can manage the homepage.
					</Alert>
				) : (
					<Stack gap="lg" pb={barPage ? 90 : 0}>
						<Group justify="space-between" gap="sm">
							<Text size="sm" c="dimmed">
								{modules.length} module{modules.length === 1 ? "" : "s"}
								{hiddenCount ? ` · ${hiddenCount} hidden` : ""}
								{published[page].updatedAt
									? ` · published ${dayjs(published[page].updatedAt).format("D MMM YYYY, HH:mm")}${published[page].updatedBy ? ` by ${published[page].updatedBy}` : ""}`
									: " · not published from the builder yet"}
							</Text>
							<Group gap="xs">
								<Button
									variant="default"
									leftSection={<IconPresentation size={16} />}
									onClick={() => setPreview({ open: true })}
								>
									Preview
								</Button>
								<Button variant="default" leftSection={<IconHistory size={16} />} onClick={() => setHistoryOpen(true)}>
									History
								</Button>
								<Menu position="bottom-end" withinPortal width={230}>
									<Menu.Target>
										<ActionIcon variant="default" size={36} aria-label="More page actions">
											<IconDots size={18} />
										</ActionIcon>
									</Menu.Target>
									<Menu.Dropdown>
										<Menu.Item
											leftSection={<IconExternalLink size={14} />}
											component="a"
											href={`${SITE_URL}${pagePaths[page]}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											Open the live page
										</Menu.Item>
										<Menu.Item leftSection={<IconDownload size={14} />} onClick={exportPage}>
											Export draft as JSON
										</Menu.Item>
										<FileButton onChange={importPage} accept="application/json,.json">
											{(p) => (
												<Menu.Item leftSection={<IconUpload size={14} />} {...p} closeMenuOnClick>
													Import from JSON…
												</Menu.Item>
											)}
										</FileButton>
										<Menu.Divider />
										<Menu.Item
											leftSection={<IconTrash size={14} />}
											color="red"
											disabled={!dirty[page]}
											onClick={() => discard(page)}
										>
											Discard all changes
										</Menu.Item>
									</Menu.Dropdown>
								</Menu>
							</Group>
						</Group>

						<ModuleTabs
							modules={modules}
							defs={defs}
							activeId={activeModule?.id ?? null}
							names={names}
							changed={changedIds}
							warnings={Object.fromEntries(Object.entries(warningsById).map(([id, w]) => [id, w[0]]))}
							onSelect={(id) => select(page, id)}
							onMove={(from, to) => setModules(page, (l) => arrayMove(l, from, to))}
							onAdd={() => setAddAt({ page, index: modules.length })}
							menuFor={menuFor(page)}
						/>

						{activeModule ? (
							<ModuleEditor
								key={`${activeModule.id}:${epoch}`}
								module={activeModule}
								def={defs[activeModule.type]}
								name={names[activeModule.id]}
								menu={(t) => menuFor(page)(activeModule, t)}
								warnings={warningsById[activeModule.id] ?? []}
								update={
									((fn, coalesce) =>
										updateModule(
											page,
											activeModule.id,
											(m) => ({ ...m, content: fn(m.content) }),
											coalesce && `${page}:${coalesce}`,
										)) as Update
								}
								replaceContent={(fn) =>
									replace((d) => ({
										...d,
										[page]: d[page].map((m) => (m.id === activeModule.id ? { ...m, content: fn(m.content) } : m)),
									}))
								}
								onSettings={() => setSettingsFor({ id: activeModule.id, focus: "settings" })}
								onPreview={() => setPreview({ open: true, focusId: activeModule.id })}
								onToggleHidden={() => act(page, activeModule, "toggleHidden")}
								onCopyAs={(copy) => copyAs(activeModule, copy)}
							/>
						) : (
							<Paper withBorder p="xl" ta="center">
								<Stack align="center" gap="xs">
									<IconLayoutGridAdd size={32} color="var(--mantine-color-gray-5)" />
									<Text fw={600}>{pageNames[page]} has no modules</Text>
									<Text size="sm" c="dimmed">
										Add a page title or hero first, then the sections below it.
									</Text>
									<Button mt="xs" onClick={() => setAddAt({ page, index: 0 })} disabled={!catalogue}>
										Add a module
									</Button>
								</Stack>
							</Paper>
						)}
					</Stack>
				)}

				<Transition mounted={!!barPage} transition="slide-up" duration={180}>
					{(styles) => (
						<Paper
							style={styles}
							className={classes.bar}
							p="sm"
							pl="lg"
							radius="xl"
							bg="dark.8"
							c="white"
							shadow="lg"
							mt="lg"
						>
							<Group justify="space-between" gap="sm">
								<Text size="sm" fw={500}>
									{barPage && view === "shared"
										? `Unsaved changes to ${dirtyPages.map((k) => pageNames[k]).join(" and ")}`
										: `Unsaved changes to ${barPage ? pageNames[barPage] : ""}`}
									{view !== "shared" && dirty[otherPage(page)] && (
										<Text span size="xs" c="gray.5">
											{" "}
											· {pageNames[otherPage(page)]} too
										</Text>
									)}
								</Text>
								{view === "shared" ? (
									<Button color="teal" radius="xl" onClick={() => barPage && setView(barPage)}>
										Review {barPage ? pageNames[barPage] : ""}
									</Button>
								) : (
									<Group gap="xs">
										<Tooltip label="Undo (⌘Z)">
											<ActionIcon
												className={classes.barIcon}
												variant="subtle"
												color="gray.3"
												size="lg"
												onClick={undo}
												disabled={!canUndo}
												aria-label="Undo"
											>
												<IconArrowBackUp size={18} />
											</ActionIcon>
										</Tooltip>
										<Tooltip label="Redo (⇧⌘Z)">
											<ActionIcon
												className={classes.barIcon}
												variant="subtle"
												color="gray.3"
												size="lg"
												onClick={redo}
												disabled={!canRedo}
												aria-label="Redo"
											>
												<IconArrowForwardUp size={18} />
											</ActionIcon>
										</Tooltip>
										<Button variant="subtle" color="gray.3" radius="xl" onClick={() => discard(page)}>
											Discard
										</Button>
										<Button
											variant="subtle"
											color="gray.3"
											radius="xl"
											leftSection={<IconPresentation size={16} />}
											onClick={() => setPreview({ open: true })}
										>
											Preview
										</Button>
										<Button color="teal" radius="xl" onClick={() => (setConflict(null), setPublishOpen(true))}>
											Publish
										</Button>
									</Group>
								)}
							</Group>
						</Paper>
					)}
				</Transition>

				<AddModuleModal
					opened={!!addAt}
					onClose={() => setAddAt(null)}
					defs={defList}
					modules={target}
					pageName={addAt ? pageNames[addAt.page] : ""}
					where={where}
					atTop={addAt?.index === 0}
					clipboard={clipboard && defs[clipboard.type] ? clipboard : null}
					removed={removed}
					onAdd={(def) => {
						if (!addAt) return;
						place(addAt.page, addAt.index, createModule(def));
						setAddAt(null);
					}}
					onPaste={() => addAt && paste(addAt.page, addAt.index)}
					onRestore={(entry) => {
						if (!addAt) return;
						const list = drafts[addAt.page];
						const blocked = singleBlocked(defs[entry.module.type], list, pageNames[addAt.page]);
						if (blocked) return notify("Can't restore here", blocked, "orange");
						const back = list.some((x) => x.id === entry.module.id)
							? copyModule(prepare(entry.module), list)
							: prepare(entry.module);
						place(addAt.page, addAt.index, back, `“${nameOf(back)}” is back.`);
						setRemoved((r) => r.filter((x) => x !== entry));
						setAddAt(null);
					}}
				/>

				<SettingsModal
					module={settingsModule}
					def={settingsModule ? defs[settingsModule.type] : undefined}
					others={modules}
					nameOf={(m) => names[m.id] ?? nameOf(m)}
					pagePath={pagePaths[page]}
					focus={settingsFor?.focus ?? "settings"}
					onClose={() => setSettingsFor(null)}
					onSave={(patch) => {
						if (settingsModule)
							updateModule(page, settingsModule.id, (m) => ({ ...m, name: patch.name, settings: patch.settings }));
						setSettingsFor(null);
					}}
				/>

				<PreviewDrawer
					page={page}
					state={preview}
					modules={cleanModules}
					onClose={() => setPreview({ open: false })}
					onSelect={openFromPreview}
					onBackToDraft={() => setPreview({ open: true })}
					wide={previewWide}
					onWideChange={setPreviewWide}
				/>

				<HistoryDrawer
					page={page}
					opened={historyOpen}
					onClose={() => setHistoryOpen(false)}
					onPreview={(label, list) => {
						setHistoryOpen(false);
						setPreview({ open: true, version: { label, modules: list } });
					}}
					onRestore={restoreVersion}
				/>

				<PublishModal
					opened={publishOpen}
					page={page}
					checks={checks}
					summary={summary}
					conflict={conflict}
					publishing={publishing}
					onClose={() => setPublishOpen(false)}
					onPublish={publish}
					onLoadTheirs={loadTheirs}
					onJump={(id) => {
						setPublishOpen(false);
						select(page, id);
					}}
				/>
			</Box>
		</LinkPagesContext.Provider>
	);
}
