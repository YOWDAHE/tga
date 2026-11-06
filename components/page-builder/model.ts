// Pure helpers for page drafts: list keys, cleaning, comparison, module creation and the checks
// shown before publishing.

import { formBlocks, missingFields, moduleForms } from "@/lib/module-fields";
import {
	anchorPattern,
	newModuleId,
	type ModuleDefinition,
	type ModuleType,
	type PageKey,
	type PageModule,
} from "@/lib/page-modules";

/* ---------- list keys ---------- */

// List items carry a local `_key` in the draft so their rows (and the editors inside) keep their own
// state while items move. It never leaves the admin: clean() strips it before publish, preview and export.
// Random rather than counted: a counter restarts on reload while keys already in the draft (restored,
// pasted, kept in undo history) don't, and a repeated key mixes up two rows.
const isPlain = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
export const newKey = () => `k${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

export function withKeys<T>(value: T): T {
	if (Array.isArray(value)) {
		const seen = new Set<string>();
		return value.map((item) => {
			if (!isPlain(item)) return withKeys(item);
			// A key already used in this list (a copy that kept its original's) gets a fresh one
			const key = typeof item._key === "string" && !seen.has(item._key) ? item._key : newKey();
			seen.add(key);
			return { ...withKeys(item), _key: key };
		}) as T;
	}
	if (isPlain(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withKeys(v)])) as T;
	return value;
}

/** Fresh keys everywhere, for copies that sit beside their original */
export const rekey = <T,>(value: T): T => withKeys(clean(value));

/** A copy of a list item, beside its original: fresh keys inside and its own key */
export const copyItem = <T extends Record<string, any>>(item: T): T & { _key: string } => ({ ...rekey(item), _key: newKey() });

export function clean<T>(value: T): T {
	if (Array.isArray(value)) return value.map(clean) as T;
	if (isPlain(value))
		return Object.fromEntries(
			Object.entries(value)
				.filter(([k]) => k !== "_key")
				.map(([k, v]) => [k, clean(v)])
		) as T;
	return value;
}

/* ---------- comparison ---------- */

// The backend trims settings to known, non-empty keys; compare drafts the same way so editing a
// field and changing it back doesn't leave the page "unsaved"
const normalSettings = (s: PageModule["settings"] = {}) => ({
	anchor: s.anchor?.trim() || undefined,
	tone: s.tone && s.tone !== "auto" ? s.tone : undefined,
	visibleOn: s.visibleOn && s.visibleOn !== "all" ? s.visibleOn : undefined,
	showFrom: s.showFrom || undefined,
	showUntil: s.showUntil || undefined,
	note: s.note?.trim() || undefined,
});

const stable = (value: unknown): string => {
	if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
	if (isPlain(value))
		return `{${Object.keys(value)
			.filter((k) => value[k] !== undefined)
			.sort()
			.map((k) => `${JSON.stringify(k)}:${stable(value[k])}`)
			.join(",")}}`;
	return JSON.stringify(value ?? null);
};

export const fingerprint = (modules: PageModule[]) =>
	stable(
		clean(modules).map((m) => ({
			id: m.id,
			type: m.type,
			name: m.name?.trim() || undefined,
			hidden: m.hidden || undefined,
			settings: normalSettings(m.settings),
			content: m.content,
		}))
	);

export const sameModules = (a: PageModule[], b: PageModule[]) => fingerprint(a) === fingerprint(b);

/* ---------- modules ---------- */

export const moduleName = (m: PageModule, defs: Partial<Record<ModuleType, ModuleDefinition>>) =>
	m.name?.trim() || defs[m.type]?.name || m.type;

/** Ready for the draft: settings present, list keys added */
export const prepare = (m: PageModule): PageModule => ({ ...m, settings: { ...(m.settings ?? {}) }, content: withKeys(m.content ?? {}) });

export const createModule = (def: ModuleDefinition): PageModule => ({
	id: newModuleId(def.type),
	type: def.type,
	settings: {},
	content: withKeys(structuredClone(def.defaults)),
});

/**
 * A copy of a module for `target` (the page it lands on): a new id, and its link name kept only
 * when that page doesn't use it already.
 */
export function copyModule(m: PageModule, target: PageModule[], rename?: string): PageModule {
	const anchors = new Set(target.map((x) => x.settings.anchor).filter(Boolean));
	const anchor = m.settings.anchor && !anchors.has(m.settings.anchor) ? m.settings.anchor : undefined;
	return {
		...clean(m),
		id: newModuleId(m.type),
		...(rename !== undefined ? { name: rename } : {}),
		settings: { ...m.settings, anchor },
		content: rekey(m.content),
	};
}

export const insertAt = <T,>(list: T[], index: number, ...items: T[]) => [...list.slice(0, index), ...items, ...list.slice(index)];

/* ---------- checks before publishing ---------- */

export interface Check {
	level: "warning" | "info";
	message: string;
	moduleId?: string;
}

export function checkPage(page: PageKey, modules: PageModule[], defs: Partial<Record<ModuleType, ModuleDefinition>>): Check[] {
	const out: Check[] = [];
	const visible = modules.filter((m) => !m.hidden);
	if (modules.length === 0) out.push({ level: "warning", message: "The page has no modules: visitors will see an empty page." });
	else if (visible.length === 0) out.push({ level: "warning", message: "Every module is hidden: visitors will see an empty page." });

	const firstVisible = visible[0];
	visible.forEach((m) => {
		if (defs[m.type]?.top && m !== firstVisible)
			out.push({ level: "warning", moduleId: m.id, message: `${moduleName(m, defs)} carries the navigation bar and belongs at the top of the page.` });
	});
	if (firstVisible && !defs[firstVisible.type]?.top && visible.some((m) => defs[m.type]?.top) === false)
		out.push({ level: "info", message: "No hero or page title at the top: the page opens straight into its first section." });

	const anchors = new Map<string, string>();
	for (const m of modules) {
		const anchor = m.settings.anchor?.trim();
		if (!anchor) continue;
		if (!anchorPattern.test(anchor))
			out.push({ level: "warning", moduleId: m.id, message: `${moduleName(m, defs)}: the link name "${anchor}" may only use lowercase letters, numbers and dashes.` });
		if (anchors.has(anchor))
			out.push({ level: "warning", moduleId: m.id, message: `${moduleName(m, defs)} and ${anchors.get(anchor)} both use the link name "${anchor}".` });
		anchors.set(anchor, moduleName(m, defs));
	}

	for (const m of visible) {
		const form = moduleForms[m.type];
		if (!form) continue;
		const hiddenParts: string[] = m.type === "about" || m.type === "aboutCards" ? (m.content.hiddenParts ?? []) : [];
		const missing = formBlocks(form)
			.filter((b) => !b.part || !hiddenParts.includes(b.part))
			.flatMap((b) => missingFields(b.fields, m.content));
		if (missing.length)
			out.push({
				level: "warning",
				moduleId: m.id,
				message: `${moduleName(m, defs)}: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ` and ${missing.length - 3} more` : ""} ${missing.length === 1 ? "is" : "are"} empty.`,
			});
		if (m.settings.showFrom && m.settings.showUntil && Date.parse(m.settings.showFrom) > Date.parse(m.settings.showUntil))
			out.push({ level: "warning", moduleId: m.id, message: `${moduleName(m, defs)} is scheduled to end before it starts.` });
		if (m.settings.showUntil && Date.parse(m.settings.showUntil) < Date.now())
			out.push({ level: "info", moduleId: m.id, message: `${moduleName(m, defs)}'s schedule has ended, so it no longer shows.` });
	}

	const singles = new Map<ModuleType, number>();
	for (const m of modules) if (defs[m.type]?.single) singles.set(m.type, (singles.get(m.type) ?? 0) + 1);
	singles.forEach((count, type) => {
		if (count > 1) out.push({ level: "warning", message: `The page has ${count} "${defs[type]?.name}" modules; only one makes sense.` });
	});
	if (page === "home" && !modules.some((m) => m.type === "contact" && !m.hidden))
		out.push({ level: "info", message: "The home page has no visible contact form; links to /#contact won't find it." });
	return out;
}

/* ---------- import ---------- */

/** Checks an imported file: a list of modules (or { modules }) with known types */
export function parseImport(text: string, types: ModuleType[]): { modules: PageModule[] } | { error: string } {
	let data: any;
	try {
		data = JSON.parse(text);
	} catch {
		return { error: "The file isn't valid JSON." };
	}
	const list = Array.isArray(data) ? data : data?.modules;
	if (!Array.isArray(list)) return { error: "The file must contain a list of modules." };
	const ids = new Set<string>();
	const modules: PageModule[] = [];
	for (const [i, m] of list.entries()) {
		if (!isPlain(m) || !types.includes(m.type)) return { error: `Module ${i + 1} has an unknown type "${m?.type}".` };
		if (!isPlain(m.content)) return { error: `Module ${i + 1} (${m.type}) has no content.` };
		const id = typeof m.id === "string" && m.id && !ids.has(m.id) ? m.id : newModuleId(m.type);
		ids.add(id);
		modules.push(prepare({ id, type: m.type, name: typeof m.name === "string" ? m.name : undefined, hidden: !!m.hidden, settings: isPlain(m.settings) ? m.settings : {}, content: m.content }));
	}
	return { modules };
}
