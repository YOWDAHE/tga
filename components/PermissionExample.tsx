"use client";

import { useAuth } from "@/contexts/AuthContext";
import { UserPermission } from "@/types/permissions";
import { Card, Text, Group, Badge, Button } from "@mantine/core";

interface PermissionExampleProps {
	requiredPermission: UserPermission;
	title: string;
	description: string;
}

export default function PermissionExample({
	requiredPermission,
	title,
	description,
}: PermissionExampleProps) {
	const { hasPermission, user } = useAuth();

	const canAccess = hasPermission(requiredPermission);

	return (
		<Card shadow="sm" padding="lg" radius="md" withBorder>
			<Group justify="space-between" mb="xs">
				<Text fw={500}>{title}</Text>
				<Badge color={canAccess ? "green" : "red"}>
					{canAccess ? "Access Granted" : "Access Denied"}
				</Badge>
			</Group>

			<Text size="sm" c="dimmed" mb="md">
				{description}
			</Text>

			<Text size="sm" mb="md">
				Required permission: <Badge variant="light">{requiredPermission}</Badge>
			</Text>

			<Text size="sm" c="dimmed">
				Your roles: {user?.roles?.join(", ") || "None"}
			</Text>

			{!canAccess && (
				<Button variant="light" color="red" mt="md" fullWidth disabled>
					No Permission
				</Button>
			)}
		</Card>
	);
}
