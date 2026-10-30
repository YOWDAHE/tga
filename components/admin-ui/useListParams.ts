"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * List filters live in the URL so the server page can fetch the right slice.
 * Every change except paging goes back to page 1.
 */
export function useListParams() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [pending, startTransition] = useTransition();

	const update = (changes: Record<string, string | null | undefined>) => {
		const params = new URLSearchParams(searchParams.toString());
		for (const [key, value] of Object.entries(changes)) {
			if (value) params.set(key, value);
			else params.delete(key);
		}
		if (!("page" in changes)) params.delete("page");
		const qs = params.toString();
		startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
	};

	return { params: searchParams, update, pending };
}
