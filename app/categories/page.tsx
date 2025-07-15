"use server";
import CategoriesManagement from "@/components/CategoriesManagement";
import { fetchCategories } from "@/app/actionsServers/category.server.actions";

interface CategoriesPageProps {
    searchParams: {
        page?: string;
        limit?: string;
        search?: string;
    };
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
    const page = searchParams.page ? parseInt(searchParams.page) : 1;
    const limit = searchParams.limit ? parseInt(searchParams.limit) : 10;
    const search = searchParams.search || "";

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
