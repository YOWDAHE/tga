import { getTokenCookie } from '@/app/utils/server/token';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const tokens = await getTokenCookie(request);
        
        // Forward the request to the backend
        const response = await axios.post(`${BACKEND_URL}/landing/upload-partner`, formData, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.data.data) {
            return NextResponse.json(
                { error: response.data.error || 'Failed to upload partner image' },
                { status: response.status }
            );
        }

        return NextResponse.json(response.data.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
} 