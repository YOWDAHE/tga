import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import { documentSchema } from "@/app/actions/archive.actions";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(req: NextRequest) {
    try {
        // Handle FormData instead of JSON
        const formData = await req.formData();
        
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        
        // Forward the FormData to the backend
        const res = await axios.post(`${BACKEND_URL}/uploads`, formData, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
                'Content-Type': 'multipart/form-data',
            },
        });

        return NextResponse.json({
            success: true,
            data: res.data.data
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to upload document",
        }, { status: 500 });
    }
} 