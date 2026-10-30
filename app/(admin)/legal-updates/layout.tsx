"use client";

import { LegalUpdatesProtectedPage } from "@/components/ProtectedPage";
import { Box } from "@mantine/core";

export default function LegalUpdatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <LegalUpdatesProtectedPage>
      <Box p={{ base: "sm", sm: "lg" }}>{children}</Box>
    </LegalUpdatesProtectedPage>
  );
}
