import { Suspense } from 'react';
import { fetchRemarksServer } from '@/app/actionsServers/remarks.server.actions';
import RemarksManagement from '@/components/RemarksManagement';
import { Skeleton } from '@mantine/core';

export default async function RemarksPage() {
    const result = await fetchRemarksServer();
    
    if (!result.success) {
        return (
            <div style={{ padding: '24px' }}>
                <h2>Error loading remarks</h2>
                <p>{result.error}</p>
            </div>
        );
    }
  
  console.log(result.data);

    return (
        <Suspense fallback={<Skeleton height={400} />}>
            <RemarksManagement initialRemarks={result.data} />
        </Suspense>
    );
}
