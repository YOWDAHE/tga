import { get, put } from '@/lib/axiosWrapper';
import type { PageKey, PageLayout, PageModule, PageRevision } from '@/lib/page-modules';

type Fail = { success: false; error: string; status?: number; data?: any };

const fail = (error: any): Fail => ({
    success: false,
    error: (error?.data?.message || error?.message || 'Something went wrong') as string,
    status: error?.status,
    data: error?.data?.data,
});

export async function fetchPageForEdit(key: PageKey) {
    try {
        const res = await get(`landing/pages/${key}/edit/`);
        return { success: true as const, data: res.data.data as PageLayout };
    } catch (error: any) {
        return fail(error);
    }
}

/**
 * Publishes a page. `baseUpdatedAt` is the version the draft started from; leave it out to overwrite
 * whatever is live. A 409 comes back as { status: 409, data: the layout someone else published }.
 */
export async function publishPage(key: PageKey, body: { modules: PageModule[]; note?: string; baseUpdatedAt?: string | null }) {
    try {
        const res = await put(`landing/pages/${key}/`, body);
        return { success: true as const, data: res.data.data as PageLayout };
    } catch (error: any) {
        return fail(error);
    }
}

export async function fetchPageRevisions(key: PageKey) {
    try {
        const res = await get(`landing/pages/${key}/revisions/`);
        return { success: true as const, data: res.data.data as PageRevision[] };
    } catch (error: any) {
        return fail(error);
    }
}

export async function fetchPageRevision(key: PageKey, id: number) {
    try {
        const res = await get(`landing/pages/${key}/revisions/${id}/`);
        return { success: true as const, data: res.data.data as PageRevision & { modules: PageModule[] } };
    } catch (error: any) {
        return fail(error);
    }
}
