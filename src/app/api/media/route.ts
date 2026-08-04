import { NextRequest, NextResponse } from "next/server";
import { getCloudinary, hasCloudinaryKeys, UPLOAD_FOLDER } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export interface MediaAsset {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes?: number;
  createdAt?: string;
  folder?: string;
}

export async function GET(req: NextRequest) {
  try {
    if (!hasCloudinaryKeys()) {
      return NextResponse.json({ media: [], configured: false }, { status: 200 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all"; // all | image | video
    const nextCursor = url.searchParams.get("cursor") || undefined;
    const maxResults = Math.min(parseInt(url.searchParams.get("max") || "50", 10), 100);

    const cloudinary = getCloudinary();

    const options: Record<string, unknown> = {
      type: "upload",
      prefix: UPLOAD_FOLDER + "/",
      max_results: maxResults,
      resource_type: "all",
    };
    if (nextCursor) options.next_cursor = nextCursor;

    const result = await cloudinary.api.resources(options);
    const assets: MediaAsset[] = (result.resources || [])
      .filter((r: { resource_type?: string }) => {
        if (type === "image") return r.resource_type === "image";
        if (type === "video") return r.resource_type === "video";
        return true;
      })
      .map((r: Record<string, unknown>) => ({
        publicId: String(r.public_id),
        url: String(r.url || ""),
        secureUrl: String(r.secure_url || ""),
        format: String(r.format || ""),
        resourceType: String(r.resource_type || "image"),
        width: typeof r.width === "number" ? r.width : undefined,
        height: typeof r.height === "number" ? r.height : undefined,
        bytes: typeof r.bytes === "number" ? r.bytes : undefined,
        createdAt: typeof r.created_at === "string" ? r.created_at : undefined,
        folder: typeof r.folder === "string" ? r.folder : undefined,
      }))
      .sort((a: MediaAsset, b: MediaAsset) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return NextResponse.json({
      media: assets,
      configured: true,
      nextCursor: result.next_cursor || null,
    });
  } catch (err) {
    console.error("GET /api/media failed:", err);
    return NextResponse.json({ error: "Failed to load media library" }, { status: 500 });
  }
}
