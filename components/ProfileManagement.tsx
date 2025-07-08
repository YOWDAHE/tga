"use client";

import { useState, useEffect } from "react";
import {
  Title,
  Button,
  TextInput,
  Text,
  Stack,
  Group,
  Avatar,
  Card,
  PasswordInput,
  Badge,
  Divider,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
	IconUser,
	IconMail,
	IconPhone,
	IconKey,
	IconShield,
	IconEdit,
	IconCheck,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import {
	updateProfile,
	changePassword,
	getProfile,
} from "@/app/actions/profile.actions";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

const permissionLabels = {
  NEWS_CRUD: "News Management",
  ARCHIVES_CRUD: "Archives Management",
  CATEGORY_CRUD: "Category Management",
  HOMEPAGE_CRUD: "Homepage Management",
  USER_CRUD: "User Management",
  REMARKS_CRUD: "Remarks Management",
};

export default function ProfileManagement() {
	const { user, updateUser } = useAuth();
	const [isEditing, setIsEditing] = useState(false);
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [loading, setLoading] = useState(false);

  const profileForm = useForm({
    initialValues: {
      username: user?.username || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
			role_name: user?.role_name || "",
    },
    validate: {
			username: (value) =>
				value.length < 3 ? "Username must be at least 3 characters" : null,
			email: (value) =>
				value && !/^\S+@\S+$/.test(value) ? "Invalid email" : null,
			phone_number: (value) =>
				value && value.length < 10 ?
					"Phone number must be at least 10 digits"
				:	null,
    },
	});

  const passwordForm = useForm({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
			currentPassword: (value) => {
				if (!value) return "Current password is required";
				if (value.length < 1) return "Current password is required";
				return null;
			},
			newPassword: (value) => {
				if (!value) return "New password is required";
				if (value.length < 6) return "New password must be at least 6 characters";
				return null;
			},
			confirmPassword: (value, values) => {
				if (!value) return "Please confirm your new password";
				if (value !== values.newPassword) return "Passwords do not match";
				return null;
			},
    },
	});

  // Update form values when user data changes
	useEffect(() => {
    if (user) {
      profileForm.setValues({
        username: user.username,
        email: user.email || "",
        phone_number: user.phone_number || "",
				role_name: user.role_name || "",
			});
    }
	}, [user]);

	const handleProfileSubmit = async (values: typeof profileForm.values) => {
		try {
			setLoading(true);
			console.log(values);
			const result = await updateProfile({
				username: values.username,
				email: values.email,
				phone_number: values.phone_number,
			});

			if (result.success) {
				// Update local user state
				updateUser(result.data);
				setIsEditing(false);
      notifications.show({
        title: "Success",
        message: "Profile updated successfully",
        color: "green",
				});
			} else {
				notifications.show({
					title: "Error",
					message: result.error || "Failed to update profile",
					color: "red",
				});
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
		} finally {
			setLoading(false);
		}
	};

	const handlePasswordSubmit = async (values: typeof passwordForm.values) => {
		try {
			setLoading(true);
			const result = await changePassword({
				currentPassword: values.currentPassword,
				newPassword: values.newPassword,
			});

			if (result.success) {
				setIsChangingPassword(false);
				passwordForm.reset();
      notifications.show({
        title: "Success",
        message: "Password changed successfully",
        color: "green",
				});
			} else {
				// Check if it's a current password error
				if (result.error?.toLowerCase().includes("current password") || 
					result.error?.toLowerCase().includes("incorrect")) {
					passwordForm.setFieldError("currentPassword", "Current password is incorrect");
					notifications.show({
						title: "Error",
						message: "Current password is incorrect. Please try again.",
						color: "red",
					});
				} else {
					notifications.show({
						title: "Error",
						message: result.error || "Failed to change password",
						color: "red",
					});
				}
			}
		} catch (error: any) {
			notifications.show({
				title: "Error",
				message: error.message || "An unexpected error occurred",
				color: "red",
			});
		} finally {
			setLoading(false);
		}
	};

  const handleCancelEdit = () => {
		setIsEditing(false);
    profileForm.setValues({
      username: user?.username || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
			role_name: user?.role_name || "",
		});
	};

  const handleCancelPasswordChange = () => {
		setIsChangingPassword(false);
		passwordForm.reset();
		// Clear any field errors
		passwordForm.setFieldError("currentPassword", null);
		passwordForm.setFieldError("newPassword", null);
		passwordForm.setFieldError("confirmPassword", null);
	};

  if (!user) {
    return (
      <div style={{ padding: "24px" }}>
        <Text>Please log in to view your profile.</Text>
      </div>
		);
  }

  return (
    <div style={{ padding: "24px" }}>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>My Profile</Title>
          <Text c="gray.6" size="sm" mt="xs">
            Manage your personal information and account settings
          </Text>
        </div>
      </Group>

      <Stack gap="lg">
        {/* Profile Information Card */}
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" mb="md">
            <Group>
              <Avatar size="lg" radius="xl" color="blue">
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Title order={3} size="h4">
                  Profile Information
                </Title>
                <Text size="sm" c="dimmed">
                  Update your personal details
                </Text>
              </div>
            </Group>
            {!isEditing && (
							<Button
								leftSection={<IconEdit size={16} />}
								onClick={() => setIsEditing(true)}
							>
                Edit Profile
              </Button>
            )}
          </Group>

					{isEditing ?
            <form onSubmit={profileForm.onSubmit(handleProfileSubmit)}>
              <Stack>
                <TextInput
                  label="Username"
                  placeholder="Enter username"
                  leftSection={<IconUser size={16} />}
                  required
                  {...profileForm.getInputProps("username")}
                />

                <TextInput
                  label="Email"
                  placeholder="Enter email address"
                  leftSection={<IconMail size={16} />}
                  {...profileForm.getInputProps("email")}
                />

                <TextInput
                  label="Phone Number"
                  placeholder="Enter phone number"
                  leftSection={<IconPhone size={16} />}
                  {...profileForm.getInputProps("phone_number")}
                />

                <Group justify="flex-end">
									<Button variant="light" onClick={handleCancelEdit} disabled={loading}>
                    Cancel
                  </Button>
									<Button
										type="submit"
										leftSection={<IconCheck size={16} />}
										loading={loading}
									>
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            </form>
					:	<Stack gap="md">
              <Group>
                <IconUser size={16} color="var(--mantine-color-gray-6)" />
                <div>
                  <Text size="sm" c="dimmed">
                    Username
                  </Text>
                  <Text fw={500}>{user.username}</Text>
                </div>
              </Group>

              <Group>
                <IconMail size={16} color="var(--mantine-color-gray-6)" />
                <div>
                  <Text size="sm" c="dimmed">
                    Email
                  </Text>
                  <Text fw={500}>{user.email || "Not provided"}</Text>
                </div>
              </Group>

              <Group>
                <IconPhone size={16} color="var(--mantine-color-gray-6)" />
                <div>
                  <Text size="sm" c="dimmed">
                    Phone Number
                  </Text>
                  <Text fw={500}>{user.phone_number || "Not provided"}</Text>
                </div>
              </Group>

              <Group>
                <Text size="sm" c="dimmed">
                  Role
                </Text>
                <Badge variant="light" color="blue">
									{user.role_name || "User"}
                </Badge>
              </Group>
            </Stack>
					}
        </Card>

        {/* Permissions Card */}
        <Card withBorder padding="lg" radius="md">
          <Group mb="md">
            <IconShield size={20} color="var(--mantine-color-blue-6)" />
            <div>
							<Title
								order={3}
								size="h4"
								style={{ display: "flex", alignItems: "center", gap: "8px" }}
							>
                Permissions & Access
								<Link href="/permissions-demo">
									<ExternalLink size={16} />
								</Link>
              </Title>
              <Text size="sm" c="dimmed">
                Your current permissions and access levels
              </Text>
            </div>
          </Group>

          <Stack gap="sm">
            <div>
              <Text size="sm" c="dimmed" mb="xs">
                Current Role
              </Text>
              <Badge size="lg" variant="light" color="blue">
								{user.role_name || "User"}
              </Badge>
            </div>

            <Divider />

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                Permissions ({user.roles?.length || 0})
              </Text>
              <Group gap="xs">
								{user.roles && user.roles.length > 0 ?
                  user.roles.map((permission) => (
                    <Badge key={permission} variant="light" color="green">
											{permissionLabels[permission as keyof typeof permissionLabels] ||
												permission}
                    </Badge>
                  ))
								:	<Text size="sm" c="dimmed">
                    No permissions assigned
                  </Text>
								}
              </Group>
            </div>
          </Stack>
        </Card>

        {/* Security Card */}
        <Card withBorder padding="lg" radius="md">
          <Group justify="space-between" mb="md">
            <Group>
              <IconKey size={20} color="var(--mantine-color-orange-6)" />
              <div>
                <Title order={3} size="h4">
                  Security Settings
                </Title>
                <Text size="sm" c="dimmed">
                  Manage your password and security preferences
                </Text>
              </div>
            </Group>
            {!isChangingPassword && (
							<Button
								leftSection={<IconKey size={16} />}
								onClick={() => setIsChangingPassword(true)}
							>
                Change Password
              </Button>
            )}
          </Group>

					{isChangingPassword ?
            <form onSubmit={passwordForm.onSubmit(handlePasswordSubmit)}>
              <Stack>
                <PasswordInput
                  label="Current Password"
                  placeholder="Enter current password"
									description="Enter your current password to verify your identity"
                  required
                  {...passwordForm.getInputProps("currentPassword")}
									onChange={(e) => {
										passwordForm.setFieldValue("currentPassword", e.currentTarget.value);
										// Clear error when user starts typing
										if (passwordForm.errors.currentPassword) {
											passwordForm.setFieldError("currentPassword", null);
										}
									}}
                />

                <PasswordInput
                  label="New Password"
                  placeholder="Enter new password"
									description="Must be at least 6 characters long"
                  required
                  {...passwordForm.getInputProps("newPassword")}
                />

                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Confirm new password"
									description="Re-enter your new password to confirm"
                  required
                  {...passwordForm.getInputProps("confirmPassword")}
                />

								<Text size="xs" c="dimmed" ta="center">
									For security reasons, you must enter your current password to change it
								</Text>

                <Group justify="flex-end">
									<Button
										variant="light"
										onClick={handleCancelPasswordChange}
										disabled={loading}
									>
                    Cancel
                  </Button>
									<Button
										type="submit"
										leftSection={<IconCheck size={16} />}
										loading={loading}
									>
                    Update Password
                  </Button>
                </Group>
              </Stack>
            </form>
					:	<Stack gap="sm">
              <Group>
                <Text size="sm" c="dimmed">
                  Password
                </Text>
                <Text size="sm">••••••••••</Text>
              </Group>
              <Text size="xs" c="dimmed">
                Keep your password secure and change it regularly
              </Text>
            </Stack>
					}
        </Card>
      </Stack>
    </div>
	);
}
