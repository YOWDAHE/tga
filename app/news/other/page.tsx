import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import OtherNewsManagement from "@/components/OtherNewsManagement";
import { fetchHomepage } from "@/app/actionsServers/homepage.server.actions";

export default async function OtherNewsPage() {
  try {
    const homepageRes = await fetchHomepage();
    const newsLinks = homepageRes.success && homepageRes.data?.newsLinks ? homepageRes.data.newsLinks : [];

    return (
      <Suspense fallback={<Skeleton height={400} />}>
        <OtherNewsManagement initialNewsLinks={newsLinks} />
      </Suspense>
    );
  } catch (error) {
    console.error("Error in OtherNewsPage:", error);
    return (
      <Suspense fallback={<Skeleton height={400} />}>
        <OtherNewsManagement initialNewsLinks={[]} />
      </Suspense>
    );
  }
} 