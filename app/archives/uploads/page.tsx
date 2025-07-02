import UploadForm from '@/components/UploadForm';
import { getCategories } from '@/app/actionsServers/archive.server.actions';
import { Skeleton } from '@mantine/core';
import React, { Suspense } from "react";
import EmptyState from '@/components/EmptyState';
import { FileX2Icon } from 'lucide-react';
import { IconCancel } from '@tabler/icons-react';

async function page() {

    try {
        const categoriesRes = await getCategories();
        if (!categoriesRes.success) {
            throw new Error(categoriesRes.error || "Failed to fetch categories");
        }
        console.log('Categories', categoriesRes.data);
        // Ensure we have valid categories data
        const validCategories = categoriesRes.data?.filter((cat: any) => cat.value && cat.label) || [];
        console.log('Valid Categories', validCategories);
        return <UploadForm categories={validCategories} />
    } catch (error) {
        console.error(error);
    }

    return <Suspense fallback={<Skeleton height={400} />}>
        <EmptyState
            title="Oops! Something went wrong."
            description="There seems to be a problem."
            icon={<IconCancel size={48} />}
        />
    </Suspense>;
}
export default page;

