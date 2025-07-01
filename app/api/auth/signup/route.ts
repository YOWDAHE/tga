import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import axios from "axios";
import { cookieSettings } from "../cookieOptions";

export async function POST(req: Request) {
    const body = await req.json();
    try {
        const res = await axios.post(`${process.env.BACKEND_API_URL}/auth/signup`, body);
        const { accessToken, refreshToken } = res.data.data;
        if (!accessToken || !refreshToken) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const cookieStore = await cookies();
        cookieStore.set("tgaAccessToken", accessToken, cookieSettings);
        cookieStore.set("tgaRefreshToken", refreshToken, cookieSettings);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Signup failed" }, { status: 400 });
    }
}
