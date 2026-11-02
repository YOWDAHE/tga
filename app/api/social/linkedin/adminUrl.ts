import { NextRequest } from "next/server";

// Absolute admin URL as the browser sees it. req.nextUrl carries the server's bind address
// (0.0.0.0 in dev, the container behind nginx) and no basePath, so use the forwarded host.
export function adminUrl(req: NextRequest, path: string) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
    const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
    return new URL(`/office${path}`, `${proto}://${host}`);
}
