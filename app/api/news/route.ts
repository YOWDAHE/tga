import { NextRequest, NextResponse } from "next/server";
import { get, post } from "@/lib/axiosServerWrapper";
import { getTokenCookie } from "@/app/utils/server/token";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page');
        const limit = searchParams.get('limit');
        const search = searchParams.get('q') || searchParams.get('search');

        const params = new URLSearchParams();
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (search) params.append('q', search);

        const queryString = params.toString();
        const url = `/news${queryString ? `?${queryString}` : ''}`;
        
        const res = await get(url);
        
        if (!res.data) {
            return NextResponse.json({
                success: false,
                error: res.data?.error || "Failed to fetch news",
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: res.data });
    } catch (error: any) {
        console.error("News fetch error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch news",
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('multipart/form-data')) {
            // Handle FormData (file upload) - forward directly to backend
            const formData = await request.formData();
            const res = await post('/news', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!res.data) {
                return NextResponse.json({
                    success: false,
                    error: res.data?.error || "Failed to create news",
                }, { status: 500 });
            }

            return NextResponse.json({ success: true, data: res.data.data });
        } else {
            // Handle JSON data
            const newsData = await request.json();
            const res = await post('/news', newsData);

            if (!res.data) {
                return NextResponse.json({
                    success: false,
                    error: res.data?.error || "Failed to create news",
                }, { status: 500 });
            }

            return NextResponse.json({ success: true, data: res.data.data });
        }
    } catch (error: any) {
        console.error("News creation error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to create news",
        }, { status: 500 });
    }
}
