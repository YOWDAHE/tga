"use client";

import { Title, Button, Paper, Stack, Group, Badge, Text, Divider } from "@mantine/core";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import Link from "next/link";
import { LegalUpdate } from "@/types/legal-updates";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  alert: "Client Alert",
  analysis: "Analysis",
  guide: "Guide",
  update: "Legal Update",
};

interface LegalUpdateDetailsProps {
  legalUpdate: LegalUpdate;
}

export default function LegalUpdateDetails({ legalUpdate }: LegalUpdateDetailsProps) {
  return (
    <Stack gap="md">
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          component={Link}
          href="/legal-updates"
        >
          Back
        </Button>
        <Title order={2} style={{ flex: 1 }}>{legalUpdate.title}</Title>
        <Button
          component={Link}
          href={`/legal-updates/add?edit=${legalUpdate.id}`}
          leftSection={<IconEdit size={16} />}
        >
          Edit
        </Button>
      </Group>

      <Paper p="md" withBorder>
        <Group mb="md">
          <Badge>{CONTENT_TYPE_LABELS[legalUpdate.content_type] || legalUpdate.content_type}</Badge>
          <Badge color={legalUpdate.published ? "green" : "gray"}>
            {legalUpdate.published ? "Published" : "Draft"}
          </Badge>
          {legalUpdate.featured && <Badge color="teal">Featured</Badge>}
        </Group>

        <Stack gap="xs" mb="md">
          {legalUpdate.author && <Text size="sm" c="dimmed">Author: {legalUpdate.author}</Text>}
          {legalUpdate.category && <Text size="sm" c="dimmed">Category: {legalUpdate.category.name}</Text>}
          {legalUpdate.published_date && (
            <Text size="sm" c="dimmed">
              Published: {new Date(legalUpdate.published_date).toLocaleString()}
            </Text>
          )}
          <Text size="sm" c="dimmed">Views: {legalUpdate.view_count}</Text>
          <Text size="sm" c="dimmed">Slug: /legal-updates/{legalUpdate.slug}</Text>
        </Stack>

        {legalUpdate.summary && (
          <>
            <Text fw={600} mb="xs">Summary</Text>
            <Text mb="md">{legalUpdate.summary}</Text>
            <Divider mb="md" />
          </>
        )}

        <Text fw={600} mb="xs">Content</Text>
        <div
          className="rich-text-content"
          dangerouslySetInnerHTML={{ __html: legalUpdate.content }}
        />
      </Paper>
    </Stack>
  );
}
