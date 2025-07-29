import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getTokenCookie } from "@/app/utils/server/token";
import { categorySchema } from "@/app/types/category.type";
// import { categorySchema } from "../route";


const BACKEND_URL = process.env.BACKEND_API_URL;

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = categorySchema.safeParse(body);
        if (!parsed.success || !body.id) {
            return NextResponse.json({
                success: false,
                error: !body.id ? "Category ID is required for update." : parsed.error?.errors.map(e => e.message).join(", "),
            }, { status: 400 });
        }
        console.log("The cookies: ", req.cookies);
        const tokens = req.cookies ? await getTokenCookie(req) : null;
        if (!tokens || !tokens.accessToken) {
            console.log("Access token is missing");
            return NextResponse.json({
                success: false,
                error: "Access token is missing.",
            }, { status: 401 });
        }
        const res = await axios.put(`${BACKEND_URL}/category/${body.id}`, parsed.data, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        return NextResponse.json({ success: true, data: res.data.data });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to update category",
        }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({
                success: false,
                error: "Category ID is required for delete.",
            }, { status: 400 });
        }
        const tokens = await getTokenCookie(req);
        if (!tokens || !tokens.accessToken) {
            return NextResponse.json({
                success: false,
                error: "Access token is missing.",
            }, { status: 401 });
        }
        await axios.delete(`${BACKEND_URL}/category/${id}`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error?.response?.data?.message || error?.message || "Failed to delete category",
        }, { status: 500 });
    }
}