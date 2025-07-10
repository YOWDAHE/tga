import { Suspense } from "react";
import { Skeleton } from "@mantine/core";
import HomepageManagement from "@/components/HomepageManagement";
import { fetchHomepage } from "@/app/actionsServers/homepage.server.actions";

export default async function HomepagePage() {
  const homepageRes = await fetchHomepage();
  const homepage = homepageRes.success ? homepageRes.data : null;

  if (!homepage || !homepage.landing) {
    return (
      <HomepageManagement
        initialContent={undefined}
        initialStats={undefined}
        initialPractices={undefined}
        initialPartners={undefined}
        initialContactInfo={undefined}
      />
    );
  }

  return (
    <Suspense fallback={<Skeleton height={400} />}>
      <HomepageManagement
        initialContent={homepage.landing}
        initialStats={homepage.stats}
        initialPractices={homepage.practices}
        initialPartners={homepage.partners}
        initialContactInfo={homepage.contactUs}
        initialNewsLinks={homepage.newsLinks || []}
      />
    </Suspense>
  );
}
