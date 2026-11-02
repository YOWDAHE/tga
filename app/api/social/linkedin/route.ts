import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(req: NextRequest) {
    try {
        const tokens = await getTokenCookie(req);
        const res = await axios.get(`${BACKEND_URL}/social/linkedin`, {
            headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        });
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to fetch LinkedIn status" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const tokens = await getTokenCookie(req);
        await axios.delete(`${BACKEND_URL}/social/linkedin`, {
            headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to disconnect LinkedIn" }, { status: 500 });
    }
}
