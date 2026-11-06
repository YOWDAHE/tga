"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Loader, Stack, Text } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { IconRefresh } from "@tabler/icons-react";
import { siteOrigin } from "@/lib/page-modules";

export const DEVICES = {
	desktop: { label: "Desktop", width: 1280 },
	tablet: { label: "Tablet", width: 820 },
	mobile: { label: "Mobile", width: 390 },
} as const;
export type Device = keyof typeof DEVICES;

type Status = "loading" | "ready" | "unavailable";

/**
 * A page of the public site in an iframe, scaled down to fit. Speaks the preview protocol: waits for
 * the frame's `ready`, then posts `message` (and again whenever it changes, debounced). Frames that
 * never say ready — the site is down, or its preview routes aren't deployed — get a friendly notice.
 */
export function PreviewFrame({
	src,
	width,
	message,
	onSelect,
	title,
	minHeight = 400,
}: {
	src: string;
	/** The device width the page lays out at */
	width: number;
	message: object | null;
	/** The admin clicked a module in the preview */
	onSelect?: (id: string) => void;
	title: string;
	minHeight?: number;
}) {
	const frame = useRef<HTMLIFrameElement>(null);
	const { ref: box, width: boxWidth, height: boxHeight } = useElementSize();
	const [status, setStatus] = useState<Status>("loading");
	const [reload, setReload] = useState(0);
	const latest = useRef(message);
	latest.current = message;
	const onSelectRef = useRef(onSelect);
	onSelectRef.current = onSelect;

	const post = () => {
		const target = frame.current?.contentWindow;
		if (target && latest.current) target.postMessage(latest.current, siteOrigin());
	};

	// Messages from the frame: only from the site's origin and from this very frame
	useEffect(() => {
		const origin = siteOrigin();
		const listen = (event: MessageEvent) => {
			if (event.origin !== origin || event.source !== frame.current?.contentWindow) return;
			const data = event.data;
			if (!data || data.source !== "tga-preview") return;
			if (data.kind === "ready") {
				setStatus("ready");
				post();
			} else if (data.kind === "select" && typeof data.id === "string") onSelectRef.current?.(data.id);
		};
		window.addEventListener("message", listen);
		return () => window.removeEventListener("message", listen);
	}, []);

	// A new address or a manual retry starts over
	useEffect(() => {
		setStatus("loading");
		const timer = setTimeout(() => setStatus((s) => (s === "ready" ? s : "unavailable")), 12000);
		return () => clearTimeout(timer);
	}, [src, reload]);

	// Re-post the draft as it changes, at most a few times a second
	useEffect(() => {
		if (status !== "ready") return;
		const timer = setTimeout(post, 250);
		return () => clearTimeout(timer);
	}, [message, status]);

	const scale = boxWidth ? Math.min(1, boxWidth / width) : 1;
	const height = Math.max(minHeight, boxHeight);

	return (
		<Box ref={box} pos="relative" h="100%" mih={minHeight} style={{ overflow: "hidden", borderRadius: 12, background: "#f4f5f7" }}>
			{boxWidth > 0 && (
				<iframe
					key={`${src}#${reload}`}
					ref={frame}
					src={src}
					title={title}
					onLoad={() =>
						// A page that loads but never says "ready" isn't a preview page (e.g. a 404)
						setTimeout(() => setStatus((s) => (s === "ready" ? s : "unavailable")), 4000)
					}
					style={{
						position: "absolute",
						top: 0,
						left: Math.max(0, (boxWidth - width * scale) / 2),
						width,
						height: height / scale,
						border: 0,
						background: "white",
						transform: `scale(${scale})`,
						transformOrigin: "0 0",
						boxShadow: width < boxWidth ? "0 0 0 1px var(--admin-line), 0 20px 50px -30px rgba(15,23,42,.4)" : undefined,
						visibility: status === "unavailable" ? "hidden" : undefined,
					}}
				/>
			)}
			{status !== "ready" && (
				<Stack
					pos="absolute"
					inset={0}
					align="center"
					justify="center"
					gap="xs"
					p="lg"
					ta="center"
					style={{ background: status === "loading" ? "rgba(244,245,247,.85)" : "#f4f5f7", pointerEvents: status === "loading" ? "none" : undefined }}
				>
					{status === "loading" ? (
						<>
							<Loader size="sm" color="gray" />
							<Text size="sm" c="dimmed">
								Loading the preview…
							</Text>
						</>
					) : (
						<>
							<Text fw={600}>The live preview isn’t available</Text>
							<Text size="sm" c="dimmed" maw={360}>
								The public site didn’t answer from {src.replace(/^https?:\/\//, "")}. It may be offline or not updated yet; your
								edits are safe either way.
							</Text>
							<Button size="xs" variant="default" leftSection={<IconRefresh size={14} />} onClick={() => setReload((r) => r + 1)}>
								Try again
							</Button>
						</>
					)}
				</Stack>
			)}
		</Box>
	);
}
