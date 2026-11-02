"use client"

import { useState } from "react"
import { Alert, Button, PasswordInput, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { notifications } from "@mantine/notifications"
import {
  IconAlertCircle,
  IconArchive,
  IconLock,
  IconMessage,
  IconNews,
  IconUser,
} from "@tabler/icons-react"
import { loginAction } from "@/app/actions/auth.actions"
import classes from "./LoginForm.module.css"

const LOGO = "/office/Logo/tga-global-logo.svg"

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
      username: (value) => (value.trim().length < 1 ? "Enter your username" : null),
      password: (value) => (value.length < 1 ? "Enter your password" : null),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError("")

    try {
      const result = await loginAction(values.username.trim(), values.password)

      if (!result.success) {
        setError(result.error || "Invalid username or password")
        return
      }

      if (!result.data || !result.data.user) {
        setError("Unexpected server response")
        return
      }

      login(result.data.user)

      notifications.show({
        title: "Signed in",
        message: `Welcome back, ${result.data.user.username}`,
        color: "green",
      })

      router.push("/")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={classes.root}>
      <div className={classes.frame}>
        <section className={classes.brand}>
          <img src={LOGO} alt="TGA Global Law Firm" className={classes.logo} />

          <div className={classes.pitch}>
            <div className={classes.eyebrow}>Admin workspace</div>
            <h1 className={classes.headline}>Everything the website publishes, in one place.</h1>
            <p className={classes.lede}>
              Write news and legal updates, keep the archive current and answer messages from
              visitors.
            </p>
            <div className={classes.features}>
              <span className={classes.feature}>
                <IconNews size={15} stroke={1.8} /> News
              </span>
              <span className={classes.feature}>
                <IconArchive size={15} stroke={1.8} /> Archives
              </span>
              <span className={classes.feature}>
                <IconMessage size={15} stroke={1.8} /> Remarks
              </span>
            </div>
          </div>

          <div className={classes.legal}>© {new Date().getFullYear()} TGA Global Law Group</div>
        </section>

        <section className={classes.panel}>
          <div className={classes.card}>
            <img src={LOGO} alt="TGA Global Law Firm" className={classes.cardLogo} />
            <h2 className={classes.title}>Sign in</h2>
            <p className={classes.subtitle}>Use your admin account to continue.</p>

            <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
              <Stack gap="md">
                {error && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" radius="md">
                    {error}
                  </Alert>
                )}

                <TextInput
                  label="Username"
                  placeholder="Your username"
                  autoComplete="username"
                  autoFocus
                  leftSection={<IconUser size={16} stroke={1.6} />}
                  size="md"
                  radius="md"
                  {...form.getInputProps("username")}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  leftSection={<IconLock size={16} stroke={1.6} />}
                  size="md"
                  radius="md"
                  {...form.getInputProps("password")}
                />

                <Button type="submit" fullWidth size="md" radius="xl" color="dark" loading={loading} mt="xs">
                  Sign in
                </Button>
              </Stack>
            </form>

            <p className={classes.foot}>Forgot your password? Ask an administrator to reset it.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
