"use client";
import {
	Container,
	Title,
	Text,
	Grid,
	Paper,
	Stack,
	Divider,
	Button,
} from "@mantine/core";
import { useAuth } from "@/contexts/AuthContext";
import PermissionExample from "@/components/PermissionExample";
import { PERMISSION_OPTIONS } from "@/types/permissions";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PermissionsDemoPage() {
	const router = useRouter();

	return (
		<Container size="xl" py="xl">
			<Stack gap="xl">
				<div style={{ display: "flex", justifyContent: "flex-start" }}>
					<Button
						onClick={() => router.back()}
					>
						<ArrowLeft style={{ marginRight: "10px" }} /> Back
					</Button>
				</div>

				<Paper p="xl" withBorder>
					<Title order={2} mb="lg">
						Your Current Permissions
					</Title>
					<UserPermissionsDisplay />
				</Paper>

				<Paper p="xl" withBorder>
					<Title order={2} mb="lg">
						Permissions
					</Title>
					<Text c="dimmed" mb="lg">
						Below are examples of how different permissions control access to
						features.
					</Text>

					<Grid>
						{PERMISSION_OPTIONS.map((permission) => (
							<Grid.Col key={permission.value} span={{ base: 12, md: 6, lg: 4 }}>
								<PermissionExample
									requiredPermission={permission.value}
									title={permission.label}
									description={permission.description}
								/>
							</Grid.Col>
						))}
					</Grid>
				</Paper>
			</Stack>
		</Container>
	);
}

function UserPermissionsDisplay() {
	const { user, hasPermission } = useAuth();

	if (!user) {
		return <Text c="red">Not authenticated</Text>;
	}

	return (
		<Stack gap="md">
			<div>
				<Text fw={500}>User: {user.username}</Text>
				<Text size="sm" c="dimmed">
					Role: {user.role_name}
				</Text>
			</div>

			<Divider />

			<div>
				<Text fw={500} mb="xs">
					Your Permissions:
				</Text>
				<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
					{user.roles?.map((role) => (
						<span
							key={role}
							style={{
								padding: "4px 8px",
								backgroundColor: "#e7f5ff",
								color: "#0066cc",
								borderRadius: "4px",
								fontSize: "12px",
								fontWeight: "500",
							}}
						>
							{role}
						</span>
					)) || (
						<Text size="sm" c="dimmed">
							No permissions assigned
						</Text>
					)}
				</div>
			</div>

			<Divider />

			<div>
				<Text fw={500} mb="xs">
					Permission Check Results:
				</Text>
				<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
					{PERMISSION_OPTIONS.map((permission) => (
						<Text key={permission.value} size="sm">
							{permission.label}: {hasPermission(permission.value) ? "✅" : "❌"}
						</Text>
					))}
				</div>
			</div>
		</Stack>
	);
}
