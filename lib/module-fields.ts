// The form for each module type, as data. One renderer (components/page-builder/SchemaForm) turns
// these into fields, so a new module type only needs an entry here and in the backend catalogue.

import { plainText, type AboutPart, type ModuleType } from "@/lib/page-modules";

type Base = {
	/** Key in the parent object */
	key: string;
	label: string;
	/** Short help under the label */
	hint?: string;
	/** Flagged before publishing when empty */
	required?: boolean;
};

export type Field =
	| (Base & { kind: "text"; placeholder?: string })
	| (Base & { kind: "textarea"; placeholder?: string })
	| (Base & { kind: "rich"; lists?: boolean; minHeight?: number })
	| (Base & { kind: "image" })
	| (Base & { kind: "images" })
	| (Base & { kind: "select"; options: Array<{ value: string; label: string }> })
	| (Base & { kind: "switch" })
	| (Base & { kind: "icon" })
	| (Base & { kind: "link"; placeholder?: string })
	| (Base & { kind: "group"; fields: Field[]; columns?: number })
	| (Base & {
			kind: "list";
			/** "Slide", "Button"… */
			itemLabel: string;
			fields: Field[];
			/** One line for the collapsed row */
			summary: (item: any) => string;
			newItem: () => Record<string, unknown>;
			min?: number;
			max?: number;
	  })
	/** Fields side by side; its children read from the same object */
	| { kind: "row"; key?: undefined; label?: undefined; fields: Field[]; columns?: number };

export interface FormBlock {
	id: string;
	title: string;
	description?: string;
	fields: Field[];
	/** For the about module: the part `content.hiddenParts` hides */
	part?: AboutPart;
}

export interface SubTab {
	id: string;
	label: string;
	/** Count shown on the tab, e.g. the number of slides */
	count?: (content: any) => number;
	blocks: FormBlock[];
	/** "Copy as a new module": the type it becomes and the content it takes */
	copyAs?: { type: ModuleType; label: string; content: (content: any) => any };
}

export interface ModuleForm {
	blocks?: FormBlock[];
	/** Shown as sub-tabs instead of one long form */
	subTabs?: SubTab[];
	/** A short explanation shown above the form */
	note?: string;
}

/* ---------- reusable pieces ---------- */

const text = (key: string, label: string, extra: Partial<Base> & { placeholder?: string } = {}): Field => ({
	kind: "text",
	key,
	label,
	...extra,
});
const area = (key: string, label: string, extra: Partial<Base> = {}): Field => ({
	kind: "textarea",
	key,
	label,
	...extra,
});
const rich = (
	key: string,
	label: string,
	extra: Partial<Base> & { lists?: boolean; minHeight?: number } = {},
): Field => ({
	kind: "rich",
	key,
	label,
	...extra,
});
const image = (key: string, label: string, extra: Partial<Base> = {}): Field => ({
	kind: "image",
	key,
	label,
	...extra,
});
const link = (key: string, label: string, extra: Partial<Base> = {}): Field => ({
	kind: "link",
	key,
	label,
	placeholder: "/news, /#contact or https://…",
	...extra,
});
const row = (...fields: Field[]): Field => ({ kind: "row", fields });

/** Label + title on one line, a description under them: the heading most modules share */
const heading = (description: "plain" | "rich" | "none" = "plain", titleRequired = true): Field[] => [
	row(
		text("label", "Small label", { hint: "The eyebrow above the title" }),
		text("title", "Title", { required: titleRequired }),
	),
	...(description === "plain"
		? [area("description", "Introduction")]
		: description === "rich"
			? [rich("description", "Introduction")]
			: []),
];

const headingBlock = (description: "plain" | "rich" | "none" = "plain", titleRequired = true): FormBlock => ({
	id: "heading",
	title: "Heading",
	fields: heading(description, titleRequired),
});

/* ---------- the forms ---------- */

const milestoneSlides: Field = {
	kind: "list",
	key: "slides",
	label: "Milestones",
	itemLabel: "Milestone",
	min: 1,
	summary: (s) => plainText(s.html),
	newItem: () => ({ html: "", images: [] }),
	fields: [
		rich("html", "Text", { required: true, hint: "Bold words show in green" }),
		{ kind: "images", key: "images", label: "Photos, shown one after another" },
	],
};

const profileFields: Field[] = [
	{ kind: "row", columns: 2, fields: [text("label", "Small label"), text("name", "Name", { required: true })] },
	image("photo", "Portrait", { required: true }),
	rich("bio", "Biography", { minHeight: 220 }),
	{
		kind: "select",
		key: "imageSide",
		label: "Layout",
		options: [
			{ value: "left", label: "Photo left, text right" },
			{ value: "right", label: "Text left, photo right" },
		],
	},
];

const aboutTabs: SubTab[] = [
	{
		id: "intro",
		label: "Introduction & lists",
		blocks: [
			{ id: "intro", title: "Introduction", part: "intro", fields: [...heading("rich")] },
			{
				id: "lists",
				title: "Lists",
				description: "Shown side by side under the introduction. Each bullet becomes one row.",
				part: "lists",
				fields: [
					{
						kind: "list",
						key: "lists",
						label: "Lists",
						itemLabel: "List",
						max: 4,
						summary: (l) => l.title,
						newItem: () => ({ title: "", html: "<ul><li><p></p></li></ul>" }),
						fields: [text("title", "Heading"), rich("html", "Items", { lists: true, minHeight: 180 })],
					},
				],
			},
		],
	},
	{
		id: "milestones",
		label: "Milestones",
		count: (c) => c.milestones?.slides?.length ?? 0,
		copyAs: { type: "milestones", label: "Milestones slideshow", content: (c) => structuredClone(c.milestones) },
		blocks: [
			{
				id: "milestones",
				title: "Milestones slideshow",
				description: "Text on the left, photos on the right. Bold words show in green.",
				part: "milestones",
				fields: [
					{ kind: "group", key: "milestones", label: "", fields: [text("label", "Small label"), milestoneSlides] },
				],
			},
		],
	},
	{
		id: "partner",
		label: "Partners",
		count: (c) => c.partners?.length ?? 0,
		copyAs: {
			type: "profile",
			label: "Profile",
			// The first partner shown on the site
			content: (c) => {
				const { hidden: _hidden, ...first } = structuredClone((c.partners ?? []).find((p: { hidden?: boolean }) => !p.hidden) ?? c.partners?.[0] ?? {});
				return first;
			},
		},
		blocks: [
			{
				id: "partner",
				title: "Partners",
				description: "Shown one after another. Each has its own layout: photo on the left or on the right.",
				part: "partner",
				fields: [
					{
						kind: "list",
						key: "partners",
						label: "Partners",
						itemLabel: "Partner",
						min: 1,
						max: 12,
						summary: (p) => [p.name, p.label].filter(Boolean).join(" · "),
						newItem: () => ({ label: "Partner", name: "", photo: "", bio: "", imageSide: "left" }),
						fields: profileFields,
					},
				],
			},
		],
	},
];

export const moduleForms: Record<ModuleType, ModuleForm> = {
	hero: {
		blocks: [
			{
				id: "slides",
				title: "Slides",
				description: "Rotate every six seconds at the top of the page. Bold words in a statement show in dark navy.",
				fields: [
					text("label", "Small label above the headline"),
					{
						kind: "list",
						key: "slides",
						label: "Slides",
						itemLabel: "Slide",
						min: 1,
						max: 8,
						summary: (s) => s.title,
						newItem: () => ({ title: "", text: "" }),
						fields: [text("title", "Headline", { required: true }), rich("text", "Statement")],
					},
				],
			},
			{
				id: "highlight",
				title: "Highlight",
				description: "The figure in the bottom-right corner of the hero.",
				fields: [
					{
						kind: "group",
						key: "highlight",
						label: "",
						columns: 3,
						fields: [text("value", "Number"), text("word", "Word (shown in green)"), text("caption", "Caption")],
					},
				],
			},
			{
				id: "cta",
				title: "Consultation link",
				description: "The button at the bottom of the hero. Leave the button text empty to hide it.",
				fields: [
					{
						kind: "group",
						key: "cta",
						label: "",
						fields: [row(text("label", "Button text"), text("text", "Line beside it")), link("href", "Links to")],
					},
				],
			},
		],
	},
	statement: {
		blocks: [
			{
				id: "statement",
				title: "Statement",
				description:
					"One large sentence that lights up word by word as visitors scroll; colour key phrases with the swatches.",
				fields: [rich("html", "Text", { required: true, minHeight: 140 })],
			},
		],
	},
	about: { subTabs: aboutTabs },
	aboutCards: {
		subTabs: [
			{
				id: "intro",
				label: "Introduction & cards",
				count: (c) => c.cards?.length ?? 0,
				blocks: [
					{ id: "intro", title: "Introduction", part: "intro", fields: [...heading("rich")] },
					{
						id: "cards",
						title: "Cards",
						description: "Shown under the introduction: the title, the first two lines of the text and a link.",
						part: "cards",
						fields: [
							{
								kind: "list",
								key: "cards",
								label: "Cards",
								itemLabel: "Card",
								max: 8,
								summary: (c) => c.title,
								newItem: () => ({ title: "", html: "", href: "", linkLabel: "View more" }),
								fields: [
									text("title", "Title", { required: true }),
									rich("html", "Text", { hint: "The first two lines show on the card" }),
									row(
										text("linkLabel", "Link text", { placeholder: "View more" }),
										link("href", "Links to", { required: true }),
									),
								],
							},
						],
					},
				],
			},
			...aboutTabs.slice(1),
		],
	},
	stats: { blocks: [headingBlock("plain")] },
	services: {
		blocks: [
			headingBlock("plain"),
			{
				id: "items",
				title: "Services",
				description: "Each row shows its title on the left and the detail on the right.",
				fields: [
					{
						kind: "list",
						key: "items",
						label: "Services",
						itemLabel: "Service",
						summary: (s) => s.title,
						newItem: () => ({ title: "", html: "" }),
						fields: [text("title", "Title", { required: true }), rich("html", "Detail")],
					},
				],
			},
		],
	},
	practices: { blocks: [headingBlock("plain")] },
	partners: {
		blocks: [{ id: "caption", title: "Heading", fields: [text("caption", "Caption above the logos")] }],
	},
	news: {
		blocks: [
			headingBlock("plain"),
			{
				id: "link",
				title: "Link to all news",
				fields: [row(text("linkLabel", "Link text"), link("linkHref", "Link address"))],
			},
		],
	},
	contact: {
		blocks: [headingBlock("plain"), { id: "form", title: "Form", fields: [text("formTitle", "Form title")] }],
	},

	pageHero: {
		blocks: [
			headingBlock("rich"),
			{
				id: "buttons",
				title: "Buttons",
				fields: [
					{
						kind: "list",
						key: "buttons",
						label: "Buttons",
						itemLabel: "Button",
						max: 3,
						summary: (b) => b.label,
						newItem: () => ({ label: "", href: "", variant: "secondary" }),
						fields: [
							row(text("label", "Text", { required: true }), link("href", "Link address", { required: true })),
							{
								kind: "select",
								key: "variant",
								label: "Style",
								options: [
									{ value: "primary", label: "Primary" },
									{ value: "secondary", label: "Secondary" },
								],
							},
						],
					},
				],
			},
		],
	},
	imageIntro: {
		blocks: [
			{
				id: "photo",
				title: "Photo and text",
				fields: [
					image("image", "Photo", { required: true }),
					text("imageAlt", "Photo description", { hint: "Read aloud by screen readers" }),
					rich("html", "Text"),
				],
			},
			{
				id: "figures",
				title: "Key figures",
				fields: [
					{
						kind: "list",
						key: "figures",
						label: "Figures",
						itemLabel: "Figure",
						max: 8,
						summary: (f) => [f.value, f.label].filter(Boolean).join(" · "),
						newItem: () => ({ value: "", label: "" }),
						fields: [row(text("value", "Number", { required: true }), text("label", "Caption"))],
					},
				],
			},
		],
	},
	gallery: {
		blocks: [
			{ ...headingBlock("plain", false), description: "Optional: leave the title empty for a plain strip of photos." },
			{
				id: "photos",
				title: "Photos",
				fields: [
					{ kind: "images", key: "images", label: "Photos, in order", required: true },
					{ kind: "switch", key: "reverse", label: "Scroll the other way" },
				],
			},
		],
	},
	rows: {
		blocks: [
			headingBlock("rich"),
			{
				id: "items",
				title: "Rows",
				fields: [
					{
						kind: "list",
						key: "items",
						label: "Rows",
						itemLabel: "Row",
						summary: (r) => r.title,
						newItem: () => ({ title: "", html: "" }),
						fields: [text("title", "Title", { required: true }), rich("html", "Detail")],
					},
				],
			},
		],
	},
	checklist: {
		blocks: [
			headingBlock("plain"),
			{
				id: "items",
				title: "Checklist",
				fields: [
					rich("intro", "Text above the list"),
					{
						kind: "list",
						key: "items",
						label: "Items",
						itemLabel: "Item",
						summary: (i) => i.text,
						newItem: () => ({ text: "" }),
						fields: [text("text", "Text", { required: true })],
					},
				],
			},
		],
	},
	cards: {
		blocks: [
			headingBlock("plain"),
			{
				id: "items",
				title: "Cards",
				fields: [
					{
						kind: "list",
						key: "items",
						label: "Cards",
						itemLabel: "Card",
						max: 6,
						summary: (c) => c.title,
						newItem: () => ({ icon: "star", title: "", html: "" }),
						fields: [
							{ kind: "icon", key: "icon", label: "Icon" },
							text("title", "Title", { required: true }),
							rich("html", "Text"),
						],
					},
				],
			},
		],
	},
	iconGrid: {
		blocks: [
			headingBlock("plain"),
			{
				id: "items",
				title: "Items",
				fields: [
					{
						kind: "list",
						key: "items",
						label: "Items",
						itemLabel: "Item",
						summary: (c) => c.title,
						newItem: () => ({ icon: "check", title: "" }),
						fields: [{ kind: "icon", key: "icon", label: "Icon" }, text("title", "Title", { required: true })],
					},
				],
			},
		],
	},
	columns: {
		blocks: [
			{
				id: "items",
				title: "Columns",
				fields: [
					{
						kind: "list",
						key: "items",
						label: "Columns",
						itemLabel: "Column",
						min: 1,
						max: 3,
						summary: (c) => c.title,
						newItem: () => ({ icon: "check", title: "", html: "" }),
						fields: [
							{ kind: "icon", key: "icon", label: "Icon" },
							text("title", "Heading", { required: true }),
							rich("html", "Text"),
						],
					},
				],
			},
		],
	},
	disclosure: {
		blocks: [
			{
				id: "disclosure",
				title: "Fine print",
				fields: [
					text("title", "Title"),
					rich("html", "Text", { hint: "Write {year} for the current year", required: true }),
				],
			},
		],
	},

	richText: {
		blocks: [
			{
				id: "text",
				title: "Text",
				fields: [
					row(text("label", "Small label"), text("title", "Title")),
					rich("html", "Text", { lists: true, minHeight: 180, required: true }),
					{
						kind: "select",
						key: "align",
						label: "Alignment",
						options: [
							{ value: "left", label: "Left" },
							{ value: "center", label: "Centred" },
						],
					},
				],
			},
		],
	},
	cta: {
		blocks: [
			{ id: "text", title: "Banner", fields: [text("title", "Headline", { required: true }), rich("html", "Text")] },
			{
				id: "buttons",
				title: "Buttons",
				description: "Leave a button's text empty to hide it.",
				fields: [
					row(text("primaryLabel", "Main button text"), link("primaryHref", "Main button link")),
					row(text("secondaryLabel", "Second button text"), link("secondaryHref", "Second button link")),
				],
			},
		],
	},
	imageText: {
		blocks: [
			{
				id: "text",
				title: "Text",
				fields: [row(text("label", "Small label"), text("title", "Title", { required: true })), rich("html", "Text")],
			},
			{
				id: "photo",
				title: "Photo",
				fields: [
					image("image", "Photo", { required: true }),
					text("imageAlt", "Photo description", { hint: "Read aloud by screen readers" }),
					{
						kind: "select",
						key: "imageSide",
						label: "Photo side",
						options: [
							{ value: "left", label: "Left" },
							{ value: "right", label: "Right" },
						],
					},
				],
			},
			{
				id: "button",
				title: "Button",
				description: "Optional. Leave the text empty for no button.",
				fields: [row(text("buttonLabel", "Button text"), link("buttonHref", "Button link"))],
			},
		],
	},
	quote: {
		blocks: [
			{
				id: "quote",
				title: "Quote",
				fields: [
					rich("html", "Quotation", { required: true }),
					row(text("name", "Name"), text("role", "Role and company")),
					image("photo", "Photo"),
				],
			},
		],
	},
	faq: {
		blocks: [
			headingBlock("plain"),
			{
				id: "items",
				title: "Questions",
				fields: [
					{
						kind: "list",
						key: "items",
						label: "Questions",
						itemLabel: "Question",
						summary: (q) => q.question,
						newItem: () => ({ question: "", html: "" }),
						fields: [text("question", "Question", { required: true }), rich("html", "Answer", { lists: true })],
					},
				],
			},
		],
	},
	video: {
		blocks: [
			headingBlock("plain", false),
			{
				id: "video",
				title: "Video",
				fields: [
					text("url", "Video address", {
						hint: "A YouTube or Vimeo link, e.g. https://www.youtube.com/watch?v=…",
						required: true,
					}),
				],
			},
		],
	},
	figures: {
		blocks: [
			headingBlock("plain"),
			{
				id: "items",
				title: "Figures",
				fields: [
					{
						kind: "list",
						key: "items",
						label: "Figures",
						itemLabel: "Figure",
						max: 8,
						summary: (f) => [f.value, f.label].filter(Boolean).join(" · "),
						newItem: () => ({ value: "", label: "" }),
						fields: [row(text("value", "Number", { required: true }), text("label", "Caption"))],
					},
				],
			},
		],
	},
	profile: { blocks: [{ id: "profile", title: "Profile", fields: profileFields }] },
	milestones: {
		blocks: [
			{ id: "milestones", title: "Milestones slideshow", fields: [text("label", "Small label"), milestoneSlides] },
		],
	},
	team: {
		blocks: [
			headingBlock("plain"),
			{
				id: "members",
				title: "Members",
				fields: [
					{
						kind: "list",
						key: "members",
						label: "Members",
						itemLabel: "Member",
						summary: (m) => [m.name, m.role].filter(Boolean).join(" · "),
						newItem: () => ({ name: "", role: "", photo: "" }),
						fields: [
							row(text("name", "Name", { required: true }), text("role", "Role")),
							image("photo", "Photo", { required: true }),
						],
					},
				],
			},
		],
	},
	spacer: {
		blocks: [
			{
				id: "spacer",
				title: "Spacer",
				fields: [
					{
						kind: "select",
						key: "size",
						label: "Height",
						options: [
							{ value: "sm", label: "Small" },
							{ value: "md", label: "Medium" },
							{ value: "lg", label: "Large" },
						],
					},
					{ kind: "switch", key: "line", label: "Draw a hairline in the middle" },
				],
			},
		],
	},
};

/** Every block of a form, sub-tabs flattened */
export const formBlocks = (form: ModuleForm): FormBlock[] => [
	...(form.blocks ?? []),
	...(form.subTabs ?? []).flatMap((t) => t.blocks),
];

/** Keys a block writes in the module's content, for "reset this part" */
export const blockKeys = (block: FormBlock): string[] =>
	block.fields.flatMap((f) => (f.kind === "row" ? f.fields.map((x) => x.key as string) : [f.key]));

/* ---------- checks before publishing ---------- */

const isEmpty = (field: Field, value: unknown) => {
	if (field.kind === "rich") return !plainText(String(value ?? "")) && !String(value ?? "").includes("<img");
	if (field.kind === "images") return !Array.isArray(value) || value.length === 0;
	return typeof value !== "string" || !value.trim();
};

/** Empty required fields, as readable paths like "Slides › Slide 2 › Headline" */
export function missingFields(fields: Field[], value: any, trail: string[] = []): string[] {
	const out: string[] = [];
	for (const field of fields) {
		if (field.kind === "row") {
			out.push(...missingFields(field.fields, value, trail));
			continue;
		}
		const v = value?.[field.key];
		if (field.kind === "group")
			out.push(...missingFields(field.fields, v, field.label ? [...trail, field.label] : trail));
		else if (field.kind === "list") {
			(Array.isArray(v) ? v : []).forEach((item, i) => {
				if (!item?.hidden) out.push(...missingFields(field.fields, item, [...trail, `${field.itemLabel} ${i + 1}`]));
			});
		} else if (field.required && isEmpty(field, v)) out.push([...trail, field.label].join(" › "));
	}
	return out;
}
