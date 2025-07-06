import { NextRequest, NextResponse } from "next/server";
import { getTokenCookie } from "@/app/utils/server/token";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_API_URL;

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        const res = await axios.get(`${BACKEND_URL}/remark/${params.id}`, {
            headers: {
                Authorization: `Bearer ${tokens?.accessToken}`,
            },
        });
        if (!res.data) {
            return NextResponse.json({ success: false, error: res.data?.error || "Failed to fetch remark" }, { status: 500 });
        }
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to fetch remark" }, { status: 500 });
    }
}

// export async function PUT(
//     req: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const tokens = req.cookies ? await getTokenCookie(req) : null;
//         const body = await req.json();
//         const res = await axios.put(`${BACKEND_URL}/remarks/${params.id}`, body, {
//             headers: {
//                 Authorization: `Bearer ${tokens?.accessToken}`,
//             },
//         });
//         if (!res.data) {
//             return NextResponse.json({ success: false, error: res.data?.error || "Failed to update remark" }, { status: 500 });
//         }
//         return NextResponse.json({ success: true, data: res.data.data });
//     } catch (error: any) {
//         return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to update remark" }, { status: 500 });
//     }
// }

// export async function DELETE(
//     req: NextRequest,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const tokens = req.cookies ? await getTokenCookie(req) : null;
//         const res = await axios.delete(`${BACKEND_URL}/remarks/${params.id}`, {
//             headers: {
//                 Authorization: `Bearer ${tokens?.accessToken}`,
//             },
//         });
//         if (!res.data) {
//             return NextResponse.json({ success: false, error: res.data?.error || "Failed to delete remark" }, { status: 500 });
//         }
//         return NextResponse.json({ success: true, data: res.data.data });
//     } catch (error: any) {
//         return NextResponse.json({ success: false, error: error?.response?.data?.message || error?.message || "Failed to delete remark" }, { status: 500 });
//     }
// } 