import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

type Params = { params: Promise<{ key: string }> };

// Save one written homepage section (hero, statement, about, services)
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { key } = await params;
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        const body = await req.json();
        const res = await axios.put(`${BACKEND_URL}/landing/content/${encodeURIComponent(key)}`, body, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to save section" }, { status: error?.response?.status || 500 });
    }
}
