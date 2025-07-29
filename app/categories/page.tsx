"use server";
import CategoriesManagement from "@/components/CategoriesManagement";
import { fetchCategories } from "@/app/actionsServers/category.server.actions";

interface CategoriesPageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
    }>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
    const searchParamsResolved = await searchParams;
    const page = searchParamsResolved.page ? parseInt(searchParamsResolved.page) : 1;
    const limit = searchParamsResolved.limit ? parseInt(searchParamsResolved.limit) : 10;
    const search = searchParamsResolved.search || "";

    let categories = [];
    let pagination = null;
    let error = null;

    try {
        const categoriesRes = await fetchCategories({
            page,
            limit,
            search: search || undefined,
        });

        if (!categoriesRes.success) {
            console.error("Failed to fetch categories:", categoriesRes.error);
            error = categoriesRes.error || "Failed to fetch categories";
        } else {
            categories = categoriesRes.data || [];
            pagination = categoriesRes.pagination;
        }
    } catch (error) {
        console.error("Error in CategoriesPage:", error);
        error = "An unexpected error occurred";
    }

    return (
        <CategoriesManagement 
            categories={categories} 
            pagination={pagination}
            currentPage={page}
            searchQuery={search}
            error={error}
        />
    );
}
