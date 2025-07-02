import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        
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
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const tokens = request.cookies ? await getTokenCookie(request) : null;
        
        const res = await axios.put(`${BACKEND_URL}/documents/${params.id}`, body, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });

        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to update document",
        }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log("Deleting document:", params.id);
        const tokens = request.cookies ? await getTokenCookie(request) : null;
        
        const res = await axios.delete(`${BACKEND_URL}/uploads/${params.id}`, {
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