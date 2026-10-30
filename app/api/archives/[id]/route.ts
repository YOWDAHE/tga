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
                error: "Document ID is required",
            }, { status: 400 });
        }

        const tokens = req.cookies ? await getTokenCookie(req) : null;
        
        const res = await axios.get(`${BACKEND_URL}/uploads/${id}`, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });

        return NextResponse.json({
            success: true,
            data: res.data.data
        });
    } catch (error: any) {
        console.error("Document fetch error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch document",
        }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tokens = request.cookies ? await getTokenCookie(request) : null;
        const { id } = await params;
        // Multipart requests carry a replacement file; axios sets the boundary for FormData
        const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
        const body = isMultipart ? await request.formData() : await request.json();

        const res = await axios.put(`${BACKEND_URL}/uploads/${id}`, body, {
            headers: {
                ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to update document",
        }, { status: error?.response?.status || 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;
        console.log("Deleting document:", id);
        const tokens = request.cookies ? await getTokenCookie(request) : null;
        
        const res = await axios.delete(`${BACKEND_URL}/uploads/${id}`, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });

        console.log("Document deleted api:", res.data);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.log("Error deleting document:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to delete document",
        }, { status: 500 });
    }
} 