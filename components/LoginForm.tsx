"use client"

import { useState } from "react"
import { 
  Paper, 
  TextInput, 
  PasswordInput, 
  Button, 
  Title, 
  Text, 
  Container, 
  Stack, 
  Alert, 
  Box,
  rem,
  useMantineTheme
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { notifications } from "@mantine/notifications"
import { 
  IconAlertCircle, 
  IconLogin, 
  IconUser, 
  IconLock
} from "@tabler/icons-react"
import { loginAction } from "@/app/actions/auth.actions"
import Image from "next/image"

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()
  const theme = useMantineTheme()

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
    <Box
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.primary[9]} 0%, ${theme.colors.primary[4]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
      }}
    >
      <Container size={420} style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo/Brand Section */}
        <Box ta="center" mb={40}>
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <IconUser size={40} color="white" />
          </Box>
          <Title 
            order={1} 
            ta="center" 
            fw={600} 
            size={rem(32)}
            style={{ 
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              marginBottom: theme.spacing.xs
            }}
          >
            Welcome Back
          </Title>
          <Text 
            c="white" 
            size="lg" 
            ta="center" 
            opacity={0.9}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          >
            Sign in to your admin dashboard
          </Text>
        </Box>

        {/* Login Form */}
        <Paper 
          withBorder 
          shadow="xl" 
          p={40} 
          radius="lg"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: theme.shadows.xl,
          }}
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              {error && (
                <Alert 
                  icon={<IconAlertCircle size="1rem" />} 
                  title="Login Failed" 
                  color="red"
                  variant="light"
                  radius="md"
                >
                  {error}
                </Alert>
              )}

              <TextInput
                label="Username"
                placeholder="Enter your username"
                required
                leftSection={<IconUser size={16} />}
                size="md"
                radius="md"
                styles={{
                  input: {
                    borderColor: theme.colors.gray[3],
                    '&:focus': {
                      borderColor: theme.colors.primary[6],
                    }
                  }
                }}
                {...form.getInputProps("username")}
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                required
                leftSection={<IconLock size={16} />}
                size="md"
                radius="md"
                styles={{
                  input: {
                    borderColor: theme.colors.gray[3],
                    '&:focus': {
                      borderColor: theme.colors.primary[6],
                    }
                  }
                }}
                {...form.getInputProps("password")}
              />

              <Button 
                type="submit" 
                fullWidth 
                size="md"
                radius="md"
                loading={loading} 
                leftSection={<IconLogin size={18} />}
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary[6]} 0%, ${theme.colors.primary[4]} 100%)`,
                  border: 'none',
                  boxShadow: theme.shadows.md,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows.lg,
                  }
                }}
              >
                Sign In
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Background decorative elements */}
        <Box
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(40px)',
            zIndex: -1,
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(30px)',
            zIndex: -1,
          }}
        />
      </Container>
    </Box>
  )
}
