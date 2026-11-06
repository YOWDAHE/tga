import { get } from '@/lib/axiosServerWrapper';
import type { ModuleCatalogue, PageKey, PageLayout } from '@/lib/page-modules';

// A page with its hidden modules and notes, for the page builder
export async function fetchPageForEdit(key: PageKey) {
    try {
        const res = await get(`/landing/pages/${key}/edit`);
        if (!res.data?.data) throw new Error(res.data?.message || 'Failed to load the page');
        return { success: true as const, data: res.data.data as PageLayout };
    } catch (error: any) {
        return { success: false as const, error: error.message as string };
    }
}

// What modules exist, their defaults and the icons they may use (public)
export async function fetchModuleCatalogue() {
    try {
        const res = await get(`/landing/modules`);
        if (!res.data?.data) throw new Error(res.data?.message || 'Failed to load the modules');
        return { success: true as const, data: res.data.data as ModuleCatalogue };
    } catch (error: any) {
        return { success: false as const, error: error.message as string };
    }
}
