"use client";

import { Group, Text } from "@mantine/core";
import { IconThumbUp, IconThumbDown } from "@tabler/icons-react";
import { type Comment } from "@/lib/commentService";

interface CommentLikeDisplayProps {
  comment: Comment;
}

export default function CommentLikeDisplay({ comment }: CommentLikeDisplayProps) {
  return (
    <Group gap="xs">
      <Group gap={4}>
        <IconThumbUp size={14} color="green" />
        <Text size="xs">{comment.likes_count}</Text>
      </Group>
      <Group gap={4}>
        <IconThumbDown size={14} color="red" />
        <Text size="xs">{comment.dislikes_count}</Text>
      </Group>
    </Group>
  );
} 