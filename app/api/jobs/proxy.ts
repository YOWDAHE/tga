import { NextResponse } from "next/server";

export const BACKEND_URL = process.env.BACKEND_API_URL;

type BackendError = { response?: { status?: number; data?: { message?: string } }; message?: string };

/** Passes the backend's status and message through (403 lets the client refresh its token and retry) */
export function jobsError(error: unknown, fallback: string) {
	const err = error as BackendError;
	const message = err?.response?.data?.message || err?.message || fallback;
	return NextResponse.json({ success: false, message, error: message }, { status: err?.response?.status || 500 });
}
