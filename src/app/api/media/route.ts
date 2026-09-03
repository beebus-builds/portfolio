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
    const parsedMax = parseInt(url.searchParams.get("max") || "50", 10);
    const maxResults = Number.isFinite(parsedMax) ? Math.min(Math.max(parsedMax, 1), 100) : 50;

    const cloudinary = getCloudinary();

    const resourceTypes = type === "image" ? ["image"] : type === "video" ? ["video"] : ["image", "video"];
    const listings = await Promise.all(
      resourceTypes.map((resourceType) =>
        cloudinary.api.resources({
          type: "upload",
          prefix: UPLOAD_FOLDER + "/",
          max_results: maxResults,
          resource_type: resourceType,
          ...(nextCursor ? { next_cursor: nextCursor } : {}),
        })
      )
    );

    const seen = new Set<string>();
    const assets: MediaAsset[] = [];
    for (const result of listings) {
      for (const r of (result.resources || []) as Record<string, unknown>[]) {
        const publicId = String(r.public_id);
        if (seen.has(publicId)) continue;
        seen.add(publicId);
        assets.push({
          publicId,
          url: String(r.url || ""),
          secureUrl: String(r.secure_url || ""),
          format: String(r.format || ""),
          resourceType: String(r.resource_type || "image"),
          width: typeof r.width === "number" ? r.width : undefined,
          height: typeof r.height === "number" ? r.height : undefined,
          bytes: typeof r.bytes === "number" ? r.bytes : undefined,
          createdAt: typeof r.created_at === "string" ? r.created_at : undefined,
          folder: typeof r.folder === "string" ? r.folder : undefined,
        });
      }
    }
    assets.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return NextResponse.json({
      media: assets,
      configured: true,
      nextCursor: listings[0]?.next_cursor || null,
    });
  } catch (err) {
    console.error("GET /api/media failed:", err);
    return NextResponse.json({ error: "Failed to load media library" }, { status: 500 });
  }
}
