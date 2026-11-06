import { NextRequest } from "next/server";
import { forward } from "../../../proxy";

type Params = { params: Promise<{ key: string; id: string }> };

// One published version with its modules
export async function GET(req: NextRequest, { params }: Params) {
	const { key, id } = await params;
	return forward(req, "get", `pages/${encodeURIComponent(key)}/revisions/${encodeURIComponent(id)}`, "Failed to load the version");
}
