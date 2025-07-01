"use client"

import { useState } from "react"
import { Textarea, Group, Button, Stack, Text } from "@mantine/core"
import { IconBold, IconItalic, IconUnderline, IconList, IconListNumbers, IconLink } from "@tabler/icons-react"

interface SimpleRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  rows?: number
}

export default function SimpleRichTextEditor({
  value,
  onChange,
  label,
  placeholder = "Enter content...",
  rows = 8,
}: SimpleRichTextEditorProps) {
  const [selectedText, setSelectedText] = useState("")

  const insertFormatting = (before: string, after = "") => {
    const textarea = document.querySelector('textarea[data-rich-text="true"]') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newValue)

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const formatButtons = [
    { icon: IconBold, label: "Bold", before: "**", after: "**" },
    { icon: IconItalic, label: "Italic", before: "*", after: "*" },
    { icon: IconUnderline, label: "Underline", before: "<u>", after: "</u>" },
    { icon: IconList, label: "Bullet List", before: "- ", after: "" },
    { icon: IconListNumbers, label: "Numbered List", before: "1. ", after: "" },
    { icon: IconLink, label: "Link", before: "[", after: "](url)" },
  ]

  return (
    <Stack gap="xs">
      {label && (
        <Text size="sm" fw={500}>
          {label}
        </Text>
      )}

      <Group gap="xs" mb="xs">
        {formatButtons.map((button) => (
          <Button
            key={button.label}
            variant="light"
            size="xs"
            leftSection={<button.icon size={14} />}
            onClick={() => insertFormatting(button.before, button.after)}
          >
            {button.label}
          </Button>
        ))}
      </Group>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        data-rich-text="true"
        styles={{
          input: {
            fontFamily: "monospace",
            fontSize: "14px",
          },
        }}
      />

      <Text size="xs" c="dimmed">
        Use **bold**, *italic*, <u>underline</u>, - for bullets, 1. for numbers, [text](url) for links
      </Text>
    </Stack>
  )
}
