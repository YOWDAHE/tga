import { Box } from "@mantine/core";
import { IconCancel } from "@tabler/icons-react";
import UploadForm from "@/components/UploadForm";
import EmptyState from "@/components/EmptyState";
import { getCategories } from "@/app/actionsServers/archive.server.actions";

export default async function UploadDocumentPage() {
	let categories: { value: string; label: string }[] | null = null;
	try {
		const categoriesRes = await getCategories();
		if (!categoriesRes.success) throw new Error(categoriesRes.error || "Failed to fetch categories");
		// Only keep options the select can render
		categories = (categoriesRes.data ?? []).filter((cat: any) => cat?.value && cat?.label);
	} catch (error) {
		console.error(error);
	}

	return (
		<Box p={{ base: "sm", sm: "lg" }}>
			{categories ?
				<UploadForm categories={categories} />
			:	<EmptyState
					title="Oops! Something went wrong."
					description="There seems to be a problem."
					icon={<IconCancel size={48} />}
				/>
			}
		</Box>
	);
}
