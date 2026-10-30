import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

type Params = { params: Promise<{ section: string; id: string }> };

const itemUrl = async (params: Params["params"]) => {
    const { section, id } = await params;
    return `${BACKEND_URL}/landing/items/${encodeURIComponent(section)}/${encodeURIComponent(id)}`;
};

// Update one homepage section item
export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        const body = await req.json();
        const res = await axios.put(await itemUrl(params), body, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to update item" }, { status: error?.response?.status || 500 });
    }
}

// Delete one homepage section item
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        const res = await axios.delete(await itemUrl(params), {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to delete item" }, { status: error?.response?.status || 500 });
    }
}
