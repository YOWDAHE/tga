import HomepageManagement from "@/components/HomepageManagement";
import { fetchHomepage } from "@/app/actionsServers/homepage.server.actions";

export default async function HomepagePage() {
  const homepageRes = await fetchHomepage();
  const homepage = homepageRes.success ? homepageRes.data : null;

  // No mock fallbacks: an empty page is safer than saving placeholder data over real content
  return (
    <HomepageManagement
      initialStats={homepage?.stats ?? []}
      initialPractices={homepage?.practices ?? []}
      initialPartners={homepage?.partners ?? []}
    />
  );
}
