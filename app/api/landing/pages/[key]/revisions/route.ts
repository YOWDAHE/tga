import { NextRequest } from "next/server";
import { forward } from "../../proxy";

type Params = { params: Promise<{ key: string }> };

// The page's published versions, newest first
export async function GET(req: NextRequest, { params }: Params) {
	const { key } = await params;
	return forward(req, "get", `pages/${encodeURIComponent(key)}/revisions`, "Failed to load the history");
}
