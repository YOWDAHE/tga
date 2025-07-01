// app/utils/server/token.ts (SERVER-ONLY)
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function getTokenCookie(req: NextRequest) {
    try {
        const cookieStore = req.cookies;
        const accessToken = cookieStore.get("tgaAccessToken")?.value;
        const refreshToken = cookieStore.get("tgaRefreshToken")?.value;

        return accessToken && refreshToken ? { accessToken, refreshToken } : null;
    } catch {
        return null;
    }
}

export async function setTokenCookie(tokens: { accessToken: string; refreshToken: string }) {
    const cookieStore = await cookies();
    cookieStore.set("tgaAccessToken", tokens.accessToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set("tgaRefreshToken", tokens.refreshToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
    });
}

export async function clearTokenCookie() {
    const cookieStore = await cookies();
    cookieStore.set("tgaAccessToken", "", {
        path: "/",
        maxAge: 0,
    });
    cookieStore.set("tgaRefreshToken", "", {
        path: "/",
        maxAge: 0,
    });
}
