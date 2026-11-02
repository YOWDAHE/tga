"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, Popover, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBrandLinkedin } from "@tabler/icons-react";
import { del, get } from "@/lib/axiosWrapper";
import { formatDate } from "./admin-ui";

interface LinkedInStatus {
	configured: boolean;
	connected: boolean;
	accountName: string | null;
	accountUrn: string | null;
	accessTokenExpiresAt: string | null;
	refreshTokenExpiresAt: string | null;
	connectedBy: string | null;
}

const DAY = 24 * 60 * 60 * 1000;

// The connection lasts until the refresh token expires (about a year), or the access token when there is none
const connectionEnd = (status: LinkedInStatus) => status.refreshTokenExpiresAt ?? status.accessTokenExpiresAt;

export default function LinkedInConnection() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<LinkedInStatus | null>(null);
	const [disconnecting, setDisconnecting] = useState(false);

	const load = () =>
		get("/social/linkedin")
			.then((res) => setStatus(res.data.data))
			.catch(() => setStatus(null));

	useEffect(() => {
		load();
	}, []);

	// Result of the LinkedIn approval page, passed back by the callback route
	useEffect(() => {
		const connected = searchParams.get("linkedin") === "connected";
		const error = searchParams.get("linkedin_error");
		if (!connected && !error) return;
		// Fixed id so the message shows once even when the effect runs twice
		notifications.show({
			id: "linkedin-connection",
			...(connected ?
				{ title: "LinkedIn connected", message: "New articles will be posted to the company page.", color: "green" }
			:	{ title: "LinkedIn not connected", message: error, color: "red" }),
		});
		router.replace(pathname);
	}, [searchParams, pathname, router]);

	const disconnect = async () => {
		setDisconnecting(true);
		try {
			await del("/social/linkedin");
			await load();
		} catch (error: any) {
			notifications.show({ title: "Error", message: error.message || "Failed to disconnect LinkedIn", color: "red" });
		} finally {
			setDisconnecting(false);
		}
	};

	const end = status && connectionEnd(status);
	const expiresSoon = !!end && new Date(end).getTime() - Date.now() < 30 * DAY;
	const dot =
		!status?.connected ? "#a1a1aa"
		: expiresSoon ? "#f59e0b"
		: "#22c55e";

	return (
		<Popover width={300} position="bottom-end" shadow="md" withArrow>
			<Popover.Target>
				<Button
					variant="default"
					leftSection={<IconBrandLinkedin size={16} />}
					rightSection={<span style={{ width: 8, height: 8, borderRadius: 4, background: dot }} />}
				>
					LinkedIn
				</Button>
			</Popover.Target>
			<Popover.Dropdown>
				{!status ?
					<Text size="sm" c="dimmed">
						Couldn't load the LinkedIn connection.
					</Text>
				: status.connected ?
					<Stack gap="xs">
						<Text size="sm">
							New articles are posted to <b>{status.accountName || status.accountUrn}</b>.
						</Text>
						<Text size="xs" c={expiresSoon ? "orange" : "dimmed"}>
							{status.connectedBy && `Connected by ${status.connectedBy}. `}
							{end && `Reconnect before ${formatDate(end)}.`}
						</Text>
						{status.configured && (
							<Button component="a" href="/office/api/social/linkedin/connect" size="xs" variant="light">
								Reconnect
							</Button>
						)}
						<Button size="xs" variant="subtle" color="red" loading={disconnecting} onClick={disconnect}>
							Disconnect
						</Button>
					</Stack>
				: !status.configured ?
					<Text size="sm" c="dimmed">
						LinkedIn app credentials are not set on the server (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET,
						LINKEDIN_REDIRECT_URI).
					</Text>
				:	<Stack gap="xs">
						<Text size="sm">
							{status.accountUrn ? "The LinkedIn connection has expired." : "LinkedIn is not connected."} Sign in as an
							administrator of the company page to post new articles there.
						</Text>
						<Button component="a" href="/office/api/social/linkedin/connect" size="xs">
							Connect LinkedIn
						</Button>
					</Stack>
				}
			</Popover.Dropdown>
		</Popover>
	);
}
