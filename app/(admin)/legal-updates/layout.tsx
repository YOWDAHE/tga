"use client";

import { LegalUpdatesProtectedPage } from "@/components/ProtectedPage";
import { Stack } from "@mantine/core";

export default function LegalUpdatesLayout({ children }: { children: React.ReactNode }) {
  return <LegalUpdatesProtectedPage>
    <Stack gap="md" p="md">
      {children}
    </Stack>
  </LegalUpdatesProtectedPage>;
}
