"use client"

import { useState } from "react"
import { Paper, TextInput, PasswordInput, Button, Title, Text, Container, Stack, Alert, Group } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { notifications } from "@mantine/notifications"
import { IconAlertCircle, IconLogin } from "@tabler/icons-react"
import { loginAction } from "@/app/actions/auth.actions"

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const form = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (value) => (value.length < 1 ? "Username is required" : null),
      password: (value) => (value.length < 1 ? "Password is required" : null),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
			setLoading(true);
			setError("");

			try {
				const result = await loginAction(values.username, values.password);

				if (!result.success) {
					setError(result.error || "Invalid username or password");
					setLoading(false);
					return;
				}

				if (!result.data || !result.data.user) {
					setError("Unexpected server response");
					setLoading(false);
					return;
				}

				login(result.data.user);

				notifications.show({
					title: "Success",
					message: `Welcome back, ${result.data.user.username}!`,
					color: "green",
				});

				router.push("/");
			} catch (error) {
				setError("An error occurred during login");
			} finally {
				setLoading(false);
			}
		};
  

  return (
    <Container size={420} my={40}>
      <Title ta="center" fw={900} style={{ fontFamily: "Greycliff CF, var(--mantine-font-family)" }}>
        Welcome back!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Sign in to your admin account
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && (
              <Alert icon={<IconAlertCircle size="1rem" />} title="Login Failed" color="red">
                {error}
              </Alert>
            )}

            <TextInput
              label="Username"
              placeholder="Enter your username"
              required
              {...form.getInputProps("username")}
            />

            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              required
              {...form.getInputProps("password")}
            />

            <Button type="submit" fullWidth mt="xl" loading={loading} leftSection={<IconLogin size={16} />}>
              Sign in
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
