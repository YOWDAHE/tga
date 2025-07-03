import { Suspense } from "react";
import { Skeleton, Button } from "@mantine/core";
import HomepageManagement from "@/components/HomepageManagement";
import EmptyState from "@/components/EmptyState";
import { FileX2Icon } from "lucide-react";
import { fetchHomepage } from "@/app/actionsServers/homepage.server.actions";
import { IconPlus } from "@tabler/icons-react";

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
						initialTestimonials={undefined}
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
        initialTestimonials={homepage.testimonials}
        initialContactInfo={homepage.contactUs}
      />
    </Suspense>
  );
}
