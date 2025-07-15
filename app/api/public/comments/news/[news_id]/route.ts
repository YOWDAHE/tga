import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ news_id: string }> }
) {
    try {
        const { news_id } = await params;
        
        if (!news_id) {
            return NextResponse.json({
                success: false,
                error: "News ID is required",
            }, { status: 400 });
        }

        const res = await axios.get(`${BACKEND_URL}/public/comments/${news_id}`);
        console.log(">>>>>>>>", res.data);

        if (!res.data) {
            return NextResponse.json({
                success: false,
                error: res.data?.error || "Failed to fetch comments",
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: res.data.data
        });
    } catch (error: any) {
        console.error("Comments fetch error:", error);
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch comments",
        }, { status: 500 });
    }
} 