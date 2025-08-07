import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import axios from "axios";
import { cookieSettings } from "../cookieOptions";

export async function POST(req: Request) {
    const body = await req.json();
    try {
        console.log("Login request body:", body);
        const res = await axios.post(`${process.env.BACKEND_API_URL}/auth/signin`, body);
        const { accessToken, refreshToken, ...user } = res.data.data;
        if (!accessToken || !refreshToken) {
            console.error("Access or refresh token is missing in the response");
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        const cookieStore = await cookies();
        try {
            console.log('The token is ', accessToken)
            cookieStore.set("tgaAccessToken", accessToken, cookieSettings);
            cookieStore.set("tgaRefreshToken", refreshToken, cookieSettings);
        } catch (error) {
            console.error("Error setting cookies:", error);
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }
}
