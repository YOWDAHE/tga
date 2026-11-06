"use client";

import { useCallback, useRef, useState } from "react";
import type { PageKey, PageModule } from "@/lib/page-modules";

export type Drafts = Record<PageKey, PageModule[]>;

interface History {
	past: Drafts[];
	present: Drafts;
	future: Drafts[];
}

const LIMIT = 100;
// Keystrokes in one field within this window become one undo step
const COALESCE_MS = 1200;

/**
 * Both pages' drafts with undo/redo. One history covers both pages, because moving a module to the
 * other page changes two drafts in one step.
 */
export function useDrafts(initial: Drafts) {
	const [history, setHistory] = useState<History>({ past: [], present: initial, future: [] });
	// Bumped whenever content changes under the editors (undo, discard, restore…), so rich-text
	// editors, which read their value once, remount with the new text
	const [epoch, setEpoch] = useState(0);
	const last = useRef<{ key: string; at: number } | null>(null);

	const change = useCallback((fn: (drafts: Drafts) => Drafts, coalesce?: string) => {
		const now = Date.now();
		const merge = !!coalesce && last.current?.key === coalesce && now - last.current.at < COALESCE_MS;
		last.current = coalesce ? { key: coalesce, at: now } : null;
		setHistory((h) => {
			const next = fn(h.present);
			if (next === h.present) return h;
			if (merge) return { ...h, present: next, future: [] };
			return { past: [...h.past, h.present].slice(-LIMIT), present: next, future: [] };
		});
	}, []);

	/** Replaces drafts from outside the editors (discard, restore, import…): one undo step, editors reload */
	const replace = useCallback(
		(fn: (drafts: Drafts) => Drafts) => {
			change(fn);
			setEpoch((e) => e + 1);
		},
		[change]
	);

	const undo = useCallback(() => {
		last.current = null;
		setHistory((h) =>
			h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h
		);
		setEpoch((e) => e + 1);
	}, []);

	const redo = useCallback(() => {
		last.current = null;
		setHistory((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h));
		setEpoch((e) => e + 1);
	}, []);

	return {
		drafts: history.present,
		change,
		replace,
		undo,
		redo,
		canUndo: history.past.length > 0,
		canRedo: history.future.length > 0,
		epoch,
	};
}
