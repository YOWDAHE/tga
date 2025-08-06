import { Suspense } from 'react';
import { fetchContactInfoServer } from '@/app/actionsServers/contact.server.actions';
import ContactInfoManagement from '@/components/ContactInfoManagement';
import { Skeleton } from '@mantine/core';

export default async function ContactPageWrapper() {
    const result = await fetchContactInfoServer();
    
    if (!result.success) {
        return (
            <div style={{ padding: '24px' }}>
                <h2>Error loading contact info</h2>
                <p>{result.error}</p>
            </div>
        );
    }

    return (
        <Suspense fallback={<Skeleton height={400} />}>
            <ContactInfoManagement initialContactInfo={result.data} />
        </Suspense>
    );
}
