"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  Paper,
  Group,
  Text,
  ActionIcon,
  Badge,
  Button,
  Modal,
  TextInput,
  PasswordInput,
  Stack,
  Checkbox,
  Avatar,
  Tabs,
  SimpleGrid,
  Textarea,
  Title,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useForm } from "@mantine/form"
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconCalendar,
  IconActivity,
  IconUser,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { updateUser, deleteUser, createUser, updateUserRoles } from "@/app/actions/user.actions"
import { PERMISSION_OPTIONS, UserPermission, getPermissionLabel } from "@/types/permissions"

interface User {
  id: number
  username: string
  email: string
  phone_number: string
  password_hash?: string
  role_name?: string
  roles?: UserPermission[]
  createdAt: string | Date
  updatedAt: string | Date
}

interface AuditLog {
  id: number
  tableName: string
  action: "INSERT" | "UPDATE" | "DELETE"
  description: string
  oldData?: any
  newData?: any
  user_id: number
  changedBy?: string
  ipAddress?: string
  userAgent?: string
  changeTimestamp: string | Date
}

type Props = {
  users: User[]
  auditLogs: AuditLog[]
  currentUsersPage: number
  currentAuditPage: number
  usersTotalPages: number
  auditTotalPages: number
}

// Utility function to format audit log data in a human-friendly way
const formatAuditData = (data: any): string => {
  if (!data || typeof data !== 'object') {
    return data?.toString() || 'N/A';
  }

  // Remove createdAt and updatedAt fields
  const { createdAt, updatedAt, id, ...cleanData } = data;
  
  if (Object.keys(cleanData).length === 0) {
    return 'No data';
  }

  return Object.entries(cleanData)
    .map(([key, value]) => {
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');

      let formattedValue = value;
      if (typeof value === 'boolean') {
        formattedValue = value ? 'Yes' : 'No';
      } else if (Array.isArray(value)) {
        formattedValue = value.length > 0 ? value.join(', ') : 'None';
      } else if (value === null || value === undefined) {
        formattedValue = 'N/A';
      } else if (typeof value === 'string' && value.length > 50) {
        formattedValue = value.substring(0, 50) + '...';
      }

      return `${formattedKey}: ${formattedValue}`;
    })
    .join('\n');
};

const UsersManagement = ({ users: initialUsers, auditLogs: initialAuditLogs, currentUsersPage, currentAuditPage, usersTotalPages, auditTotalPages }: Props) => {
  const [users, setUsers] = useState<User[]>(
    initialUsers.map((user) => ({
      ...user,
      createdAt: typeof user.createdAt === "string" ? new Date(user.createdAt) : user.createdAt,
      updatedAt: typeof user.updatedAt === "string" ? new Date(user.updatedAt) : user.updatedAt,
    }))
  )
  const [logs, setLogs] = useState<AuditLog[]>(
    initialAuditLogs.map((log) => ({
      ...log,
      changeTimestamp: typeof log.changeTimestamp === "string" ? new Date(log.changeTimestamp) : log.changeTimestamp,
    }))
  )

  // Update state when props change (for pagination)
  useEffect(() => {
    setUsers(
      initialUsers.map((user) => ({
        ...user,
        createdAt: typeof user.createdAt === "string" ? new Date(user.createdAt) : user.createdAt,
        updatedAt: typeof user.updatedAt === "string" ? new Date(user.updatedAt) : user.updatedAt,
      }))
    )
  }, [initialUsers])

  useEffect(() => {
    setLogs(
      initialAuditLogs.map((log) => ({
        ...log,
        changeTimestamp: typeof log.changeTimestamp === "string" ? new Date(log.changeTimestamp) : log.changeTimestamp,
      }))
    )
  }, [initialAuditLogs])
  const [activeTab, setActiveTab] = useState<string | null>("users")
  const [loading, setLoading] = useState(false)

  // Router for pagination
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pagination functions
  const handleUsersPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= usersTotalPages) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('usersPage', newPage.toString())
      router.push(`/users?${params.toString()}`)
    }
  }

  const handleAuditPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= auditTotalPages) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('auditPage', newPage.toString())
      router.push(`/users?${params.toString()}`)
    }
  }

  // Modal states
  const [userModalOpened, { open: openUserModal, close: closeUserModal }] = useDisclosure(false)
  const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false)
  const [logModalOpened, { open: openLogModal, close: closeLogModal }] = useDisclosure(false)

  // Editing states
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [viewingLog, setViewingLog] = useState<AuditLog | null>(null)

  const userForm = useForm({
    initialValues: {
      username: "",
      email: "",
      phone_number: "",
      password: "",
      confirmPassword: "",
      role_name: "",
      roles: [] as UserPermission[],
    },
    validate: {
      username: (value) => {
        if (!editingUser && value.length < 3) {
          return "Username must be at least 3 characters";
        }
        return null;
      },
      email: (value) => {
        if (!editingUser && !/^\S+@\S+$/.test(value)) {
          return "Invalid email";
        }
        return null;
      },
      phone_number: (value) => {
        if (!editingUser && value.length < 10) {
          return "Phone number must be at least 10 digits";
        }
        return null;
      },
      password: (value) => {
        if (!editingUser && value.length < 6) {
          return "Password must be at least 6 characters";
        }
        return null;
      },
      confirmPassword: (value, values) => {
        if (!editingUser && value !== values.password) {
          return "Passwords do not match";
        }
        return null;
      },
      role_name: (value) => (value.trim() ? null : "Role is required"),
    },
  })

  const handleSubmitUser = async (values: typeof userForm.values) => {
    setLoading(true)
    try {
      if (editingUser) {
        console.log("Updating user");
        // For updates, only allow role_name and roles to be changed
        const updateData = {
          id: editingUser.id,
          role_name: values.role_name,
          roles: values.roles,
        }
        
        const result = await updateUserRoles(updateData)
        if (result.success) {
          setUsers((prev) =>
            prev.map((user) =>
              user.id === editingUser.id
                ? {
                    ...user,
                    role_name: values.role_name,
                    roles: values.roles,
                    updatedAt: new Date(),
                  }
                : user,
            ),
          )
          notifications.show({
            title: "Success",
            message: "User updated successfully",
            color: "green",
          })
        } else {
          notifications.show({
            title: "Error",
            message: result.error || "Failed to update user",
            color: "red",
          })
        }
      } else {
        
        const createData = {
          username: values.username,
          email: values.email,
          phone_number: values.phone_number,
          password: values.password,
          role_name: values.role_name,
          roles: values.roles,
        }
        
        const result = await createUser(createData)
        if (result.success) {
          console.log("User created successfully ", result, result.data, result.success);
          const newUser: User = {
            id: result.data.id,
            username: values.username,
            email: values.email,
            phone_number: values.phone_number,
            // password_hash: `hashed_${values.password}`,
            role_name: values.role_name,
            roles: values.roles,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          console.log("New user:", newUser);
          setUsers((prev) => [...prev, newUser])

          // Add audit log entry for user creation (For UI)
          const newLog: AuditLog = {
            id: Date.now(),
            tableName: "users",
            action: "INSERT",
            description: `Created new user account: ${values.username}`,
            oldData: null,
            newData: {
              username: values.username,
              email: values.email,
              role_name: values.role_name,
              roles: values.roles,
            },
            user_id: 1,
            changedBy: "admin",
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0 (Admin Dashboard)",
            changeTimestamp: new Date(),
          }
          console.log("New log:", newLog);
          setLogs((prev) => [newLog, ...prev])

          notifications.show({
            title: "Success",
            message: "User created successfully",
            color: "green",
          })
        } else {
          notifications.show({
            title: "Error",
            message: result.error || "Failed to create user",
            color: "red",
          })
        }
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An unexpected error occurred",
        color: "red",
      })
    } finally {
      setLoading(false)
      handleCloseUserModal()
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    userForm.setValues({
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      password: "",
      confirmPassword: "",
      role_name: user.role_name || "",
      roles: user.roles || [],
    })
    openUserModal()
  }

  const handleDeleteUser = async (id: number) => {
    const user = users.find((u) => u.id === id)
    if (!user) return

    setLoading(true)
    try {
      const result = await deleteUser(id)
      if (result.success) {
        setUsers((prev) => prev.filter((user) => user.id !== id))

        // Add audit log entry for user deletion
        const newLog: AuditLog = {
          id: Date.now(),
          tableName: "users",
          action: "DELETE",
          description: `Deleted user account: ${user.username}`,
          oldData: {
            username: user.username,
            email: user.email,
            role_name: user.role_name,
            roles: user.roles,
          },
          newData: null,
          user_id: 1, // Current admin user
          changedBy: "admin",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Admin Dashboard)",
          changeTimestamp: new Date(),
        }
        setLogs((prev) => [newLog, ...prev])

        notifications.show({
          title: "Success",
          message: "User deleted successfully",
          color: "red",
        })
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Failed to delete user",
          color: "red",
        })
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An unexpected error occurred",
        color: "red",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewUser = (user: User) => {
    setViewingUser(user)
    openViewModal()
  }

  const handleViewLog = (log: AuditLog) => {
    setViewingLog(log)
    openLogModal()
  }

  const handleCloseUserModal = () => {
    closeUserModal()
    setEditingUser(null)
    userForm.reset()
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    userForm.reset()
    openUserModal()
  }

  const getRoleBadge = (role: string) => {
    // Generate a color based on role name for consistency
    const colors = ["blue", "green", "orange", "red", "purple", "cyan", "pink", "yellow"]
    const colorIndex = role.length % colors.length
    return (
      <Badge color={colors[colorIndex]} variant="light">
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getActionBadge = (action: string) => {
    const colors = {
      INSERT: "green",
      UPDATE: "orange",
      DELETE: "red",
    }
    return (
      <Badge color={colors[action as keyof typeof colors] || "gray"} variant="light" size="sm">
        {action}
      </Badge>
    )
  }

  const formatDate = (date: string | Date) => {
    if (typeof date === "string") {
      const time = new Date(date).toLocaleTimeString();
      const dateString = new Date(date).toLocaleDateString();
      return `${dateString} ${time}`;
    }
    const time = date.toLocaleTimeString();
    const dateString = date.toLocaleDateString();
    return `${dateString} ${time}`;
  }

  return (
    <div style={{ padding: "24px" }}>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Users Management</Title>
          <Text c="gray.6" size="sm" mt="xs">
            Manage user accounts, roles, permissions, and monitor system activity
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreateUser} disabled={loading}>
          Add New User
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="users" leftSection={<IconUser size={16} />}>
            Users ({users.length})
          </Tabs.Tab>
          <Tabs.Tab value="logs" leftSection={<IconActivity size={16} />}>
            Audit Logs ({logs.length})
          </Tabs.Tab>
        </Tabs.List>

        {/* Users Tab */}
        <Tabs.Panel value="users" pt="md">
          <Group justify="space-between" mb="md">
            <Text fw={500} size="lg">
              User Management
            </Text>
            <Group>
              {usersTotalPages > 1 && (
                <Text size="sm" c="dimmed">
                  Page {currentUsersPage} of {usersTotalPages}
                </Text>
              )}
              <Button onClick={handleCreateUser} disabled={loading}>
                Add New User
              </Button>
            </Group>
          </Group>

          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Permissions</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl">
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Text fw={500} size="sm">
                          {user.username}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.phone_number}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {user.role_name || "No Role"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {user.roles?.slice(0, 2).map((permission) => (
                          <Badge key={permission} size="xs" variant="light">
                            {getPermissionLabel(permission).replace(" Management", "")}
                          </Badge>
                        ))}
                        {user.roles && user.roles.length > 2 && (
                          <Badge size="xs" variant="outline">
                            +{user.roles.length - 2}
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>{formatDate(user.createdAt)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleViewUser(user)}
                          disabled={loading}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="orange"
                          onClick={() => handleEditUser(user)}
                          disabled={loading}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
          
          {/* Users Pagination Controls */}
          {usersTotalPages > 1 && (
            <Group justify="center" mt="md">
              <Button
                variant="light"
                onClick={() => handleUsersPageChange(currentUsersPage - 1)}
                disabled={currentUsersPage <= 1}
                leftSection={<IconChevronLeft size={16} />}
              >
                Previous
              </Button>
              
              <Group gap="xs">
                {/* Show first page */}
                {currentUsersPage > 3 && (
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleUsersPageChange(1)}
                  >
                    1
                  </Button>
                )}
                
                {/* Show ellipsis if needed */}
                {currentUsersPage > 4 && (
                  <Text size="sm" c="dimmed">...</Text>
                )}
                
                {/* Show pages around current page */}
                {Array.from({ length: usersTotalPages }, (_, i) => i + 1)
                  .filter(page => page >= Math.max(1, currentUsersPage - 1) && page <= Math.min(usersTotalPages, currentUsersPage + 1))
                  .map((page) => (
                    <Button
                      key={page}
                      variant={page === currentUsersPage ? "filled" : "light"}
                      size="sm"
                      onClick={() => handleUsersPageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                
                {/* Show ellipsis if needed */}
                {currentUsersPage < usersTotalPages - 3 && (
                  <Text size="sm" c="dimmed">...</Text>
                )}
                
                {/* Show last page */}
                {currentUsersPage < usersTotalPages - 2 && (
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleUsersPageChange(usersTotalPages)}
                  >
                    {usersTotalPages}
                  </Button>
                )}
              </Group>
              
              <Button
                variant="light"
                onClick={() => handleUsersPageChange(currentUsersPage + 1)}
                disabled={currentUsersPage >= usersTotalPages}
                rightSection={<IconChevronRight size={16} />}
              >
                Next
              </Button>
            </Group>
          )}
        </Tabs.Panel>

        {/* Audit Logs Tab */}
        <Tabs.Panel value="logs" pt="md">
          <Group justify="space-between" mb="md">
            <Text fw={500} size="lg">
              Audit Logs
            </Text>
            {auditTotalPages > 1 && (
              <Text size="sm" c="dimmed">
                Page {currentAuditPage} of {auditTotalPages}
              </Text>
            )}
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Table</Table.Th>
                  <Table.Th>Action</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>IP Address</Table.Th>
                  <Table.Th>Timestamp</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logs.map((log) => (
                  <Table.Tr key={log.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl">
                          {log.changedBy?.charAt(0).toUpperCase() || "U"}
                        </Avatar>
                        <Text fw={500} size="sm">
                          {log.changedBy || "Unknown"}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline" size="sm">
                        {log.tableName}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{getActionBadge(log.action)}</Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={2} maw={300}>
                        {log.description}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {log.ipAddress || "N/A"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{formatDate(log.changeTimestamp)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleViewLog(log)}
                        disabled={loading}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
          
          {/* Pagination Controls */}
          {auditTotalPages > 1 && (
            <Group justify="center" mt="md">
              <Button
                variant="light"
                onClick={() => handleAuditPageChange(currentAuditPage - 1)}
                disabled={currentAuditPage <= 1}
                leftSection={<IconChevronLeft size={16} />}
              >
                Previous
              </Button>
              
              <Group gap="xs">
                {/* Show first page */}
                {currentAuditPage > 3 && (
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleAuditPageChange(1)}
                  >
                    1
                  </Button>
                )}
                
                {/* Show ellipsis if needed */}
                {currentAuditPage > 4 && (
                  <Text size="sm" c="dimmed">...</Text>
                )}
                
                {/* Show pages around current page */}
                {Array.from({ length: auditTotalPages }, (_, i) => i + 1)
                  .filter(page => page >= Math.max(1, currentAuditPage - 1) && page <= Math.min(auditTotalPages, currentAuditPage + 1))
                  .map((page) => (
                    <Button
                      key={page}
                      variant={page === currentAuditPage ? "filled" : "light"}
                      size="sm"
                      onClick={() => handleAuditPageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                
                {/* Show ellipsis if needed */}
                {currentAuditPage < auditTotalPages - 3 && (
                  <Text size="sm" c="dimmed">...</Text>
                )}
                
                {/* Show last page */}
                {currentAuditPage < auditTotalPages - 2 && (
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => handleAuditPageChange(auditTotalPages)}
                  >
                    {auditTotalPages}
                  </Button>
                )}
              </Group>
              
              <Button
                variant="light"
                onClick={() => handleAuditPageChange(currentAuditPage + 1)}
                disabled={currentAuditPage >= auditTotalPages}
                rightSection={<IconChevronRight size={16} />}
              >
                Next
              </Button>
            </Group>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* User Modal */}
      <Modal
        opened={userModalOpened}
        onClose={handleCloseUserModal}
        title={editingUser ? "Edit User" : "Create New User"}
        size="lg"
      >
        <form onSubmit={userForm.onSubmit(handleSubmitUser)}>
          <Stack>
            {/* {!editingUser && ( */}
              <Stack>
                <TextInput
                  label="Username"
                  placeholder="Enter username"
                  required
                  disabled={!!editingUser}
                  {...userForm.getInputProps("username")}
                />

                <TextInput
                  label="Email"
                  placeholder="Enter email address"
                  required
                  disabled={!!editingUser}
                  {...userForm.getInputProps("email")}
                />

                <TextInput
                  label="Phone Number"
                  placeholder="Enter phone number"
                  required
                  disabled={!!editingUser}
                  {...userForm.getInputProps("phone_number")}
                />
              </Stack>
            {/* )} */}

            <TextInput
              label="Role"
              placeholder="Enter role name"
              {...userForm.getInputProps("role_name")}
            />

            <div>
              <Text fw={500} size="sm" mb="xs">
                Permissions
              </Text>
              <Stack gap="sm">
                {PERMISSION_OPTIONS.map((permission) => (
                  <Paper
                    key={permission.value}
                    withBorder
                    p="md"
                    radius="sm"
                    style={{ position: "relative" }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <div style={{ flex: 1 }}>
                        <Text fw={500} size="sm">
                          {permission.label}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {permission.description}
                        </Text>
                      </div>
                      <Checkbox
                        checked={userForm.values.roles.includes(permission.value)}
                        onChange={(event) => {
                          const isChecked = event.currentTarget.checked;
                          const currentRoles = userForm.values.roles;
                          if (isChecked) {
                            userForm.setFieldValue("roles", [
                              ...currentRoles,
                              permission.value,
                            ]);
                          } else {
                            userForm.setFieldValue(
                              "roles",
                              currentRoles.filter((p) => p !== permission.value)
                            );
                          }
                        }}
                      />
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </div>

            {!editingUser && (
              <Stack>
                <PasswordInput
                  label="Password"
                  placeholder="Enter password"
                  required
                  {...userForm.getInputProps("password")}
                />

                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm password"
                  required
                  {...userForm.getInputProps("confirmPassword")}
                />
              </Stack>
            )}

            {editingUser && (
              <Stack>
                <PasswordInput
                  label="Password"
                  placeholder="Password cannot be changed"
                  disabled
                  value="••••••••"
                />
              </Stack>
            )}

            {editingUser && (
              <Text size="sm" c="dimmed" ta="center">
                Only role and permissions can be updated for existing users
              </Text>
            )}

            <Group justify="flex-end">
              <Button variant="light" onClick={handleCloseUserModal} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={closeViewModal}
        title="User Details"
        size="md"
      >
        {viewingUser && (
          <Stack>
            <Group>
              <Avatar size="lg" radius="xl">
                {viewingUser.username.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Text fw={500} size="lg">
                  {viewingUser.username}
                </Text>
                <Text size="sm" c="dimmed">
                  {viewingUser.email}
                </Text>
              </div>
            </Group>

            <SimpleGrid cols={2}>
              <div>
                <Text fw={500} size="sm">
                  Phone Number
                </Text>
                <Text size="sm" c="dimmed">
                  {viewingUser.phone_number}
                </Text>
              </div>
              <div>
                <Text fw={500} size="sm">
                  Role
                </Text>
                <Text size="sm" c="dimmed">
                  {viewingUser.role_name || "No Role"}
                </Text>
              </div>
            </SimpleGrid>

            <div>
              <Text fw={500} size="sm" mb="xs">
                Permissions
              </Text>
              <Group gap="xs">
                {viewingUser.roles && viewingUser.roles.length > 0 ?
                  viewingUser.roles.map((permission) => (
                    <Badge key={permission} variant="light">
                      {getPermissionLabel(permission)}
                    </Badge>
                  ))
                :	<Text size="sm" c="dimmed">
                    No permissions assigned
                  </Text>
                }
              </Group>
            </div>

            <Group>
              <IconCalendar size={16} />
              <Text size="sm">
                Last Updated: {formatDate(viewingUser.updatedAt)}
              </Text>
            </Group>

            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  closeViewModal();
                  handleEditUser(viewingUser);
                }}
                disabled={loading}
              >
                Edit User
              </Button>
              <Button variant="light" onClick={closeViewModal}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* View Log Modal */}
      <Modal
        opened={logModalOpened}
        onClose={closeLogModal}
        title="Audit Log Details"
        size="lg"
      >
        {viewingLog && (
          <Stack>
            <Group justify="space-between">
              <Group>
                <Avatar size="md" radius="xl">
                  {viewingLog.changedBy?.charAt(0).toUpperCase() || "U"}
                </Avatar>
                <div>
                  <Text fw={500}>{viewingLog.changedBy || "Unknown User"}</Text>
                  <Text size="sm" c="dimmed">
                    User ID: {viewingLog.user_id}
                  </Text>
                </div>
              </Group>
              <Group>
                <Badge variant="outline">{viewingLog.tableName}</Badge>
                {getActionBadge(viewingLog.action)}
              </Group>
            </Group>

            <div>
              <Text fw={500} mb="xs">
                Description
              </Text>
              <Paper withBorder p="md" bg="gray.0">
                <Text size="sm">{viewingLog.description}</Text>
              </Paper>
            </div>

            {viewingLog.oldData && (
              <div>
                <Text fw={500} mb="xs">
                  Previous Data
                </Text>
                <Paper withBorder p="md" bg="red.0">
                  <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                    {formatAuditData(viewingLog.oldData)}
                  </Text>
                </Paper>
              </div>
            )}

            {viewingLog.newData && (
              <div>
                <Text fw={500} mb="xs">
                  New Data
                </Text>
                <Paper withBorder p="md" bg="green.0">
                  <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                    {formatAuditData(viewingLog.newData)}
                  </Text>
                </Paper>
                <Text size="sm" c="dark" fw={500} mt="xs">
                  Updated at: {formatDate(viewingLog.changeTimestamp)}
                </Text>
              </div>
            )}

            <Group justify="flex-end">
              <Button variant="light" onClick={closeLogModal}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}

export default UsersManagement
