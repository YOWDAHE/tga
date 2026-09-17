"use client";

import { useState, useEffect } from "react";
import {
  Title,
  Button,
  TextInput,
  Paper,
  Stack,
  Group,
  Switch,
  Select,
  Textarea,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { DateTimePicker } from "@mantine/dates";
import { IconArrowLeft } from "@tabler/icons-react";
import RichTextEditorField from "./RichTextEditorField";
import { useRouter } from "next/navigation";
import { createLegalUpdate, updateLegalUpdate } from "@/app/actions/legal-updates.actions";
import { LegalUpdate } from "@/types/legal-updates";
import { useAuth } from "@/contexts/AuthContext";

const CONTENT_TYPE_OPTIONS = [
  { value: "alert", label: "Client Alert" },
  { value: "analysis", label: "Analysis" },
  { value: "guide", label: "Guide" },
  { value: "update", label: "Legal Update" },
];

interface LegalUpdatesFormProps {
  legalUpdateToEdit?: LegalUpdate | null;
  categories?: Array<{ value: string; label: string }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function LegalUpdatesForm({
  legalUpdateToEdit,
  categories = [],
}: LegalUpdatesFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm({
    initialValues: {
      title: "",
      slug: "",
      summary: "",
      content_type: "update",
      category_id: "",
      author: "",
      seo_keywords: "",
      meta_description: "",
      featured: false,
      published: false,
      published_date: new Date() as Date | null,
      notify_subscribers: true,
    },
  });

  useEffect(() => {
    if (legalUpdateToEdit) {
      form.setValues({
        title: legalUpdateToEdit.title,
        slug: legalUpdateToEdit.slug,
        summary: legalUpdateToEdit.summary || "",
        content_type: legalUpdateToEdit.content_type,
        category_id: legalUpdateToEdit.category_id ? String(legalUpdateToEdit.category_id) : "",
        author: legalUpdateToEdit.author || "",
        seo_keywords: legalUpdateToEdit.seo_keywords || "",
        meta_description: legalUpdateToEdit.meta_description || "",
        featured: legalUpdateToEdit.featured,
        published: legalUpdateToEdit.published,
        published_date: legalUpdateToEdit.published_date ? new Date(legalUpdateToEdit.published_date) : new Date(),
        notify_subscribers: legalUpdateToEdit.notify_subscribers,
      });
      setContent(legalUpdateToEdit.content);
      setSlugTouched(true);
    }
  }, [legalUpdateToEdit]);

  const handleTitleChange = (value: string) => {
    form.setFieldValue("title", value);
    if (!slugTouched) {
      form.setFieldValue("slug", slugify(value));
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!content.trim() || content === "<p></p>") {
      notifications.show({ title: "Validation error", message: "Content is required", color: "red" });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...values,
        content,
        slug: values.slug || slugify(values.title),
        category_id: values.category_id ? parseInt(values.category_id) : null,
        created_by: user?.username || "admin",
      };

      const result = legalUpdateToEdit
        ? await updateLegalUpdate({ id: legalUpdateToEdit.id, ...submitData })
        : await createLegalUpdate(submitData);

      if (result.success) {
        const emailInfo = result.data?.emailNotification;
        const emailMsg = emailInfo
          ? ` (${emailInfo.emailsSent} subscriber emails sent)`
          : "";
        notifications.show({
          title: "Success",
          message: `${legalUpdateToEdit ? "Legal update updated" : "Legal update created"} successfully${emailMsg}`,
          color: "green",
        });
        router.push("/legal-updates");
      } else {
        notifications.show({
          title: "Error",
          message: result.error || "Something went wrong",
          color: "red",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper p="md" withBorder>
      <Group mb="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.push("/legal-updates")}
          disabled={loading}
        >
          Back
        </Button>
        <Title order={2}>{legalUpdateToEdit ? "Edit Legal Update" : "Create Legal Update"}</Title>
      </Group>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Title"
              placeholder="Enter title"
              required
              value={form.values.title}
              onChange={(e) => handleTitleChange(e.currentTarget.value)}
              disabled={loading}
            />
            <TextInput
              label="Slug"
              placeholder="url-friendly-slug"
              required
              {...form.getInputProps("slug")}
              onChange={(e) => {
                setSlugTouched(true);
                form.setFieldValue("slug", e.currentTarget.value);
              }}
              disabled={loading}
            />
          </SimpleGrid>
          <Textarea
            label="Summary"
            placeholder="Brief excerpt for list cards and emails"
            rows={3}
            {...form.getInputProps("summary")}
            disabled={loading}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Content Type"
              data={CONTENT_TYPE_OPTIONS}
              {...form.getInputProps("content_type")}
              disabled={loading}
            />
            <Select
              label="Practice Area (Category)"
              placeholder="Select category"
              data={categories}
              clearable
              {...form.getInputProps("category_id")}
              disabled={loading}
            />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Author"
              placeholder="Attorney or author name"
              {...form.getInputProps("author")}
              disabled={loading}
            />
            <TextInput
              label="SEO Keywords"
              placeholder="comma, separated, keywords"
              {...form.getInputProps("seo_keywords")}
              disabled={loading}
            />
          </SimpleGrid>
          <RichTextEditorField
            label="Content"
            value={content}
            onChange={setContent}
            disabled={loading}
          />
          <Textarea
            label="Meta Description"
            placeholder="SEO meta description (max 300 chars)"
            maxLength={300}
            {...form.getInputProps("meta_description")}
            disabled={loading}
          />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Switch
              label="Featured"
              description="Pin this update at the top of the public list"
              {...form.getInputProps("featured", { type: "checkbox" })}
              disabled={loading}
            />
            <Switch
              label="Published"
              description="Make visible on the public website"
              {...form.getInputProps("published", { type: "checkbox" })}
              disabled={loading}
            />
          </SimpleGrid>
          {form.values.published && (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <DateTimePicker
                label="Published Date"
                {...form.getInputProps("published_date")}
                disabled={loading}
              />
              <Switch
                label="Notify subscribers"
                description="Send email alert to confirmed subscribers when publishing"
                mt={{ base: 0, sm: 28 }}
                {...form.getInputProps("notify_subscribers", { type: "checkbox" })}
                disabled={loading}
              />
            </SimpleGrid>
          )}
          <Group justify="flex-end">
            <Button variant="light" onClick={() => router.push("/legal-updates")} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {legalUpdateToEdit ? "Update" : "Create"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
