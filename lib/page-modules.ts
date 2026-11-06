// Pages built from modules: the admin's copy of the contract in tga-backend/src/lib/page-modules.ts.
// The backend serves the catalogue (names, descriptions, defaults) from GET /landing/modules; this
// file only carries the shapes and the small helpers the page builder shares.

import { convertToApiUrl } from "@/lib/utils";

export type PageKey = "home" | "about";
export const pageKeys: PageKey[] = ["home", "about"];
export const pageNames: Record<PageKey, string> = { home: "Home page", about: "About us" };
export const pagePaths: Record<PageKey, string> = { home: "/", about: "/about-us" };

export type Tone = "auto" | "plain" | "muted" | "navy";
export type AboutPart = "intro" | "lists" | "cards" | "milestones" | "partner";

export interface ModuleSettings {
	/** Section id for links, e.g. "services" makes /#services scroll here */
	anchor?: string;
	/** Background band; "auto" keeps the module's own look */
	tone?: Tone;
	visibleOn?: "all" | "desktop" | "mobile";
	/** ISO dates; outside this window the module is left out */
	showFrom?: string | null;
	showUntil?: string | null;
	/** Admin-only note */
	note?: string;
}

export interface PageModule<C = any> {
	id: string;
	type: ModuleType;
	name?: string;
	hidden?: boolean;
	settings: ModuleSettings;
	content: C;
}

type Hideable = { hidden?: boolean };
type Icon = string;

/** A portrait beside a name and biography; `imageSide` puts the portrait left or right of the text */
export type PartnerProfile = { label: string; name: string; photo: string; bio: string; imageSide?: "left" | "right" } & Hideable;

export interface ModuleContent {
	hero: {
		label: string;
		slides: Array<{ title: string; text: string } & Hideable>;
		highlight: { value: string; word: string; caption: string };
		/** The consultation link at the bottom of the hero; no label hides it */
		cta?: { label: string; text: string; href: string };
	};
	statement: { html: string };
	about: {
		label: string;
		title: string;
		description: string;
		lists: Array<{ title: string; html: string } & Hideable>;
		milestones: { label: string; slides: Array<{ html: string; images: string[] } & Hideable> };
		partners: PartnerProfile[];
		hiddenParts?: AboutPart[];
	};
	aboutCards: {
		label: string;
		title: string;
		description: string;
		cards: Array<{ title: string; html: string; href: string; linkLabel: string } & Hideable>;
		milestones: { label: string; slides: Array<{ html: string; images: string[] } & Hideable> };
		partners: PartnerProfile[];
		hiddenParts?: AboutPart[];
	};
	stats: { label: string; title: string; description: string };
	services: {
		label: string;
		title: string;
		description: string;
		items: Array<{ title: string; html: string } & Hideable>;
	};
	practices: { label: string; title: string; description: string };
	partners: { caption: string };
	news: { label: string; title: string; description: string; linkLabel: string; linkHref: string };
	contact: { label: string; title: string; description: string; formTitle: string };

	pageHero: {
		label: string;
		title: string;
		description: string;
		buttons: Array<{ label: string; href: string; variant: "primary" | "secondary" } & Hideable>;
	};
	imageIntro: {
		image: string;
		imageAlt: string;
		html: string;
		figures: Array<{ value: string; label: string } & Hideable>;
	};
	gallery: { label: string; title: string; description: string; images: string[]; reverse: boolean };
	rows: { label: string; title: string; description: string; items: Array<{ title: string; html: string } & Hideable> };
	checklist: {
		label: string;
		title: string;
		description: string;
		intro: string;
		items: Array<{ text: string } & Hideable>;
	};
	cards: {
		label: string;
		title: string;
		description: string;
		items: Array<{ icon: Icon; title: string; html: string } & Hideable>;
	};
	iconGrid: {
		label: string;
		title: string;
		description: string;
		items: Array<{ icon: Icon; title: string } & Hideable>;
	};
	columns: { items: Array<{ icon: Icon; title: string; html: string } & Hideable> };
	disclosure: { title: string; html: string };

	richText: { label: string; title: string; html: string; align: "left" | "center" };
	cta: {
		title: string;
		html: string;
		primaryLabel: string;
		primaryHref: string;
		secondaryLabel: string;
		secondaryHref: string;
	};
	imageText: {
		label: string;
		title: string;
		html: string;
		image: string;
		imageAlt: string;
		imageSide: "left" | "right";
		buttonLabel: string;
		buttonHref: string;
	};
	quote: { html: string; name: string; role: string; photo: string };
	faq: {
		label: string;
		title: string;
		description: string;
		items: Array<{ question: string; html: string } & Hideable>;
	};
	video: { label: string; title: string; description: string; url: string };
	figures: {
		label: string;
		title: string;
		description: string;
		items: Array<{ value: string; label: string } & Hideable>;
	};
	profile: Omit<PartnerProfile, "hidden">;
	milestones: { label: string; slides: Array<{ html: string; images: string[] } & Hideable> };
	team: {
		label: string;
		title: string;
		description: string;
		members: Array<{ name: string; role: string; photo: string } & Hideable>;
	};
	spacer: { size: "sm" | "md" | "lg"; line: boolean };
}

export type ModuleType = keyof ModuleContent;

export type ModuleCategory = "Firm sections" | "Page sections" | "Text" | "Media" | "People" | "Layout";
export type SharedList = "stats" | "practices" | "partners" | "contactUs" | "news";

export interface ModuleDefinition<T extends ModuleType = ModuleType> {
	type: T;
	name: string;
	description: string;
	category: ModuleCategory;
	keywords: string[];
	shared?: SharedList;
	single?: boolean;
	top?: boolean;
	toneable?: boolean;
	defaults: ModuleContent[T];
}

export interface ModuleCatalogue {
	pages: Array<{ key: PageKey; name: string; path: string }>;
	modules: ModuleDefinition[];
	icons: string[];
}

/** A page as the admin edits it */
export interface PageLayout {
	key: PageKey;
	modules: PageModule[];
	updatedAt: string | null;
	updatedBy: string | null;
}

export interface PageRevision {
	id: number;
	note: string | null;
	createdBy: string | null;
	createdAt: string;
	moduleCount: number;
	hiddenCount: number;
}

/* ---------- helpers ---------- */

/** The public site; it shares this domain in production, so an empty value means "same origin" */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

/** Origin preview frames must post from */
export const siteOrigin = () => {
	if (typeof window === "undefined") return "";
	try {
		return SITE_URL ? new URL(SITE_URL).origin : window.location.origin;
	} catch {
		return window.location.origin;
	}
};

/** Images that ship with the public site ("/Images/…") load from the site; uploads go through the proxy */
export const imageSrc = (url: string) =>
	url.startsWith("/") && !url.startsWith("/office/") && !url.startsWith("/landing/")
		? `${SITE_URL}${url}`
		: convertToApiUrl(url);

export const plainText = (html: string) =>
	(html ?? "")
		.replace(/<\/(p|li|h\d)>|<br\s*\/?>/g, " ")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/\s+/g, " ")
		.trim();

export const anchorPattern = /^[a-z0-9][a-z0-9-]{0,59}$/;

export const slugify = (text: string) =>
	text
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);

export const newModuleId = (type: ModuleType) => `${type}-${Math.random().toString(36).slice(2, 9)}`;

/** Whether a scheduled module shows today */
export const scheduleState = (s: ModuleSettings): "live" | "upcoming" | "ended" | null => {
	if (!s.showFrom && !s.showUntil) return null;
	const now = Date.now();
	if (s.showFrom && Date.parse(s.showFrom) > now) return "upcoming";
	if (s.showUntil && Date.parse(s.showUntil) < now) return "ended";
	return "live";
};
