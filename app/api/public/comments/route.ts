import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
    try {
        const commentData = await request.json();
        
        const res = await axios.post(`${BACKEND_URL}/public/comments`, commentData);

        if (!res.data) {
            return NextResponse.json({
                success: false,
                error: res.data?.error || "Failed to create comment",
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        console.error("Comment creation error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to create comment",
        }, { status: 500 });
    }
} 