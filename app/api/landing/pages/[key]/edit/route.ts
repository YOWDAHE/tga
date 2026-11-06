import { NextRequest } from "next/server";
import { forward } from "../../proxy";

type Params = { params: Promise<{ key: string }> };

// A page with everything in it (hidden modules, notes), for editing
export async function GET(req: NextRequest, { params }: Params) {
	const { key } = await params;
	return forward(req, "get", `pages/${encodeURIComponent(key)}/edit`, "Failed to load the page");
}
