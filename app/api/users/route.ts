import { NextRequest, NextResponse } from "next/server";
import { get } from "@/lib/axiosServerWrapper";

export async function GET() {
    try {
        const res = await get("/users");
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch users",
        }, { status: 500 });
    }
} 