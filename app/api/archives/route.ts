import { NextRequest, NextResponse } from "next/server";
import { fetchDocuments } from "@/app/actionsServers/archive.server.actions";
import { get } from "@/lib/axiosServerWrapper";

export async function GET(request: NextRequest) {
    try {
        // const { searchParams } = new URL(request.url);
        // const page = searchParams.get('page');
        // const limit = searchParams.get('limit');
        // const search = searchParams.get('search');

        // const params: any = {};
        // if (page) params.page = parseInt(page);
        // if (limit) params.limit = parseInt(limit);
        // if (search) params.search = search;

        // const res = await get(`/archives${params.toString() ? `?${params.toString()}` : ''}`);
        const res = await get(`/archives`);
        
        if (!res.data) {
            return NextResponse.json({
                success: false,
                error: res.data.error,
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: res.data });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to fetch documents",
        }, { status: 500 });
    }
}
