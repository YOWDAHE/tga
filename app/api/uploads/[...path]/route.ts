import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const pathSegments = params.path;
        
        if (pathSegments.length < 2) {
            return NextResponse.json(
                { error: 'Invalid path' },
                { status: 400 }
            );
        }

        const folder = pathSegments[0];
        const filename = pathSegments[1];

        // Validate folder to prevent directory traversal
        const allowedFolders = ['partners', 'documents'];
        if (!allowedFolders.includes(folder)) {
            return NextResponse.json(
                { error: 'Invalid folder' },
                { status: 400 }
            );
        }

        // Forward the request to the backend
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        let response;
        
        if (folder === 'partners') {
            response = await fetch(`${backendUrl}/api/landing/uploads/${folder}/${filename}`);
        } else if (folder === 'documents') {
            response = await fetch(`${backendUrl}/api/uploads/documents/${filename}`);
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