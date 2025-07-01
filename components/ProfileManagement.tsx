"use client"

import { useState } from "react"
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
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconUser, IconMail, IconPhone, IconKey, IconShield, IconEdit, IconCheck } from "@tabler/icons-react"
import { useAuth } from "@/contexts/AuthContext"

const permissionLabels = {
  NEWS_CRUD: "News Management",
  ARCHIVES_CRUD: "Archives Management",
  CATEGORY_CRUD: "Category Management",
  HOMEPAGE_CRUD: "Homepage Management",
  USER_CRUD: "User Management",
  REMARKS_CRUD: "Remarks Management",
}

const roleOptions = [
  { value: "Administrator", label: "Administrator" },
  { value: "Editor", label: "Editor" },
  { value: "Content Manager", label: "Content Manager" },
  { value: "Moderator", label: "Moderator" },
  { value: "Viewer", label: "Viewer" },
]

export default function ProfileManagement() {
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const profileForm = useForm({
    initialValues: {
      username: user?.username || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
      role: user?.role || "",
    },
    validate: {
      username: (value) => (value.length < 3 ? "Username must be at least 3 characters" : null),
      email: (value) => (value && !/^\S+@\S+$/.test(value) ? "Invalid email" : null),
      phone_number: (value) => (value && value.length < 10 ? "Phone number must be at least 10 digits" : null),
      role: (value) => (value.length < 1 ? "Role is required" : null),
    },
  })

  const passwordForm = useForm({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      currentPassword: (value) => (value.length < 1 ? "Current password is required" : null),
      newPassword: (value) => (value.length < 6 ? "New password must be at least 6 characters" : null),
      confirmPassword: (value, values) => (value !== values.newPassword ? "Passwords do not match" : null),
    },
  })

  // Update form values when user data changes
  useState(() => {
    if (user) {
      profileForm.setValues({
        username: user.username,
        email: user.email || "",
        phone_number: user.phone_number || "",
        role: user.role || "",
      })
    }
  })

  const handleProfileSubmit = (values: typeof profileForm.values) => {
    // Simulate API call delay
    setTimeout(() => {
      updateUser(values)
      setIsEditing(false)
      notifications.show({
        title: "Success",
        message: "Profile updated successfully",
        color: "green",
      })
    }, 500)
  }

  const handlePasswordSubmit = (values: typeof passwordForm.values) => {
    // Simulate API call delay
    setTimeout(() => {
      setIsChangingPassword(false)
      passwordForm.reset()
      notifications.show({
        title: "Success",
        message: "Password changed successfully",
        color: "green",
      })
    }, 500)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    profileForm.setValues({
      username: user?.username || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
      role: user?.role || "",
    })
  }

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false)
    passwordForm.reset()
  }

  if (!user) {
    return (
      <div style={{ padding: "24px" }}>
        <Text>Please log in to view your profile.</Text>
      </div>
    )
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
              <Button leftSection={<IconEdit size={16} />} onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </Group>

          {isEditing ? (
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

                <Select
                  label="Role"
                  placeholder="Select your role"
                  data={roleOptions}
                  {...profileForm.getInputProps("role")}
                />

                <Group justify="flex-end">
                  <Button variant="light" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" leftSection={<IconCheck size={16} />}>
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            </form>
          ) : (
            <Stack gap="md">
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
                  {user.role || "User"}
                </Badge>
              </Group>

              <Group>
                <Text size="sm" c="dimmed">
                  User ID
                </Text>
                <Badge variant="light">{user.id}</Badge>
              </Group>
            </Stack>
          )}
        </Card>

        {/* Permissions Card */}
        <Card withBorder padding="lg" radius="md">
          <Group mb="md">
            <IconShield size={20} color="var(--mantine-color-blue-6)" />
            <div>
              <Title order={3} size="h4">
                Permissions & Access
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
                {user.role || "User"}
              </Badge>
            </div>

            <Divider />

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                Permissions ({user.roles?.length || 0})
              </Text>
              <Group gap="xs">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((permission) => (
                    <Badge key={permission} variant="light" color="green">
                      {permissionLabels[permission as keyof typeof permissionLabels] || permission}
                    </Badge>
                  ))
                ) : (
                  <Text size="sm" c="dimmed">
                    No permissions assigned
                  </Text>
                )}
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
              <Button leftSection={<IconKey size={16} />} onClick={() => setIsChangingPassword(true)}>
                Change Password
              </Button>
            )}
          </Group>

          {isChangingPassword ? (
            <form onSubmit={passwordForm.onSubmit(handlePasswordSubmit)}>
              <Stack>
                <PasswordInput
                  label="Current Password"
                  placeholder="Enter current password"
                  required
                  {...passwordForm.getInputProps("currentPassword")}
                />

                <PasswordInput
                  label="New Password"
                  placeholder="Enter new password"
                  required
                  {...passwordForm.getInputProps("newPassword")}
                />

                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  required
                  {...passwordForm.getInputProps("confirmPassword")}
                />

                <Group justify="flex-end">
                  <Button variant="light" onClick={handleCancelPasswordChange}>
                    Cancel
                  </Button>
                  <Button type="submit" leftSection={<IconCheck size={16} />}>
                    Update Password
                  </Button>
                </Group>
              </Stack>
            </form>
          ) : (
            <Stack gap="sm">
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
          )}
        </Card>
      </Stack>
    </div>
  )
}
