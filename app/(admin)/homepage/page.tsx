import HomepageManagement from "@/components/HomepageManagement";
import { fetchHomepage } from "@/app/actionsServers/homepage.server.actions";
import { fetchModuleCatalogue, fetchPageForEdit } from "@/app/actionsServers/pages.server.actions";

export default async function HomepagePage() {
	const [homepageRes, catalogueRes, homeRes, aboutRes] = await Promise.all([
		fetchHomepage(),
		fetchModuleCatalogue(),
		fetchPageForEdit("home"),
		fetchPageForEdit("about"),
	]);
	const homepage = homepageRes.success ? homepageRes.data : null;

	// No mock fallbacks: a page that failed to load shows an error rather than an empty draft that could be published over real content
	return (
		<HomepageManagement
			catalogue={catalogueRes.success ? catalogueRes.data : null}
			layouts={{ home: homeRes.success ? homeRes.data : null, about: aboutRes.success ? aboutRes.data : null }}
			initialStats={homepage?.stats ?? []}
			initialPractices={homepage?.practices ?? []}
			initialPartners={homepage?.partners ?? []}
		/>
	);
}
