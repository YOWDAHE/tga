import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const pathSegments = (await params).path;
        console.log('Uploads API route - pathSegments:', pathSegments);
        
        if (pathSegments.length < 2) {
            console.log('Uploads API route - Invalid path length:', pathSegments.length);
            return NextResponse.json(
                { error: 'Invalid path' },
                { status: 400 }
            );
        }

        const folder = pathSegments[0];
        const filename = pathSegments[1];
        console.log('Uploads API route - folder:', folder, 'filename:', filename);

        // Validate folder to prevent directory traversal
        const allowedFolders = ['partners', 'documents', 'news-images'];
        if (!allowedFolders.includes(folder)) {
            console.log('Uploads API route - Invalid folder:', folder);
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
        } else if (folder === 'news-images') {
            console.log('Uploads API route - Fetching news image from:', `${backendUrl}/api/news/images/${filename}`);
            response = await fetch(`${backendUrl}/api/news/images/${filename}`);
        }

        if (!response || !response.ok) {
            console.log('Uploads API route - Backend response not ok:', response?.status, response?.statusText);
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