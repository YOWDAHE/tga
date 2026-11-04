import { NextRequest, NextResponse } from 'next/server';
import { getTokenCookie } from '@/app/utils/server/token';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const pathSegments = (await params).path;
        
        if (pathSegments.length < 2) {
            return NextResponse.json(
                { error: 'Invalid path' },
                { status: 400 }
            );
        }

        const folder = pathSegments[0];
        const filename = pathSegments[1];

        // Validate folder to prevent directory traversal
        const allowedFolders = ['partners', 'landing', 'home', 'documents', 'news-images'];
        if (!allowedFolders.includes(folder)) {
            return NextResponse.json(
                { error: 'Invalid folder' },
                { status: 400 }
            );
        }

        // Forward the request to the backend
        const backendApiUrl = process.env.BACKEND_API_URL;
        let response;
        
        if (folder === 'partners' || folder === 'landing' || folder === 'home') {
            response = await fetch(`${backendApiUrl}/landing/uploads/${folder}/${filename}`);
        } else if (folder === 'documents') {
            // Documents are served by the authenticated /uploads route, so pass the admin's token on
            const tokens = request.cookies ? await getTokenCookie(request) : null;
            response = await fetch(`${backendApiUrl}/uploads/documents/${encodeURIComponent(filename)}`, {
                headers: tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {},
            });
        } else if (folder === 'news-images') {
            response = await fetch(`${backendApiUrl}/news/images/${filename}`);
        }

        if (!response || !response.ok) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Get the file content and headers
        const fileBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/pdf';
        const contentLength = response.headers.get('content-length');
        const contentDisposition = response.headers.get('content-disposition');

        // Create response with the file content
        const fileResponse = new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': contentLength || '',
                'Content-Disposition': contentDisposition || '',
            },
        });

        return fileResponse;
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
} 