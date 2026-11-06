"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";

/* ---------- confirmations ---------- */

type ConfirmOptions = { title: string; message: ReactNode; confirmLabel?: string; danger?: boolean };

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => true);

/** `await confirm({...})` anywhere under the provider; resolves true when the admin confirms */
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
	const [options, setOptions] = useState<ConfirmOptions | null>(null);
	const resolver = useRef<((ok: boolean) => void) | null>(null);

	const confirm = useCallback((next: ConfirmOptions) => {
		resolver.current?.(false);
		setOptions(next);
		return new Promise<boolean>((resolve) => {
			resolver.current = resolve;
		});
	}, []);

	const close = (ok: boolean) => {
		resolver.current?.(ok);
		resolver.current = null;
		setOptions(null);
	};

	return (
		<ConfirmContext.Provider value={confirm}>
			{children}
			<Modal opened={options !== null} onClose={() => close(false)} title={options?.title} size="sm" radius="lg">
				<Stack>
					<Text size="sm" component="div">
						{options?.message}
					</Text>
					<Group justify="flex-end">
						<Button variant="default" onClick={() => close(false)}>
							Cancel
						</Button>
						<Button color={options?.danger === false ? undefined : "red"} onClick={() => close(true)} data-autofocus>
							{options?.confirmLabel ?? "Remove"}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</ConfirmContext.Provider>
	);
}

/* ---------- builder-wide values ---------- */

export const IconsContext = createContext<string[]>([]);
