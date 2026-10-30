import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

// Add one item to a homepage section (stats, practices, partners, contactUs, newsLinks)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ section: string }> }
) {
    try {
        const { section } = await params;
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        const body = await req.json();
        const res = await axios.post(`${BACKEND_URL}/landing/items/${encodeURIComponent(section)}`, body, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to add item" }, { status: error?.response?.status || 500 });
    }
}
