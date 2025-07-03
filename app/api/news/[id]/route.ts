import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json({
                success: false,
                error: "News ID is required",
            }, { status: 400 });
        }

        const tokens = req.cookies ? await getTokenCookie(req) : null;

        const res = await axios.get(`${BACKEND_URL}/news/${id}`, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });

        if (!res.data) {
            return NextResponse.json({
                success: false,
                error: res.data?.error || "Failed to fetch news",
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: res.data.data
        });
    } catch (error: any) {
        console.error("News fetch error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch news",
        }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log("request", request);
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json({
                success: false,
                error: "News ID is required",
            }, { status: 400 });
        }

        const tokens = request.cookies ? await getTokenCookie(request) : null;
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('multipart/form-data')) {
            // Handle FormData (file upload) - forward directly to backend
            const formData = await request.formData();
            const res = await axios.put(`${BACKEND_URL}/news/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
            });

            if (!res.data) {
                return NextResponse.json({
                    success: false,
                    error: res.data?.error || "Failed to update news",
                }, { status: 500 });
            }

            return NextResponse.json({ success: true, data: res.data.data });
        } else {
            // Handle JSON data
            const newsData = await request.json();
            const res = await axios.put(`${BACKEND_URL}/news/${id}`, newsData, {
                headers: {
                    Authorization: `Bearer ${tokens?.accessToken}`,
                },
            });

            if (!res.data) {
                return NextResponse.json({
                    success: false,
                    error: res.data?.error || "Failed to update news",
                }, { status: 500 });
            }

            return NextResponse.json({ success: true, data: res.data.data });
        }
    } catch (error: any) {
        console.error("News update error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to update news",
        }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log(" delrequest");
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json({
                success: false,
                error: "News ID is required",
            }, { status: 400 });
        }

        const tokens = request.cookies ? await getTokenCookie(request) : null;
        
        const res = await axios.delete(`${BACKEND_URL}/news/${id}`, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });

        console.log("News deleted api:", res.data);

        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        console.error("News deletion error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to delete news",
        }, { status: 500 });
    }
} 