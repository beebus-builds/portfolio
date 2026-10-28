import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getImage, imageNameOk } from "@/lib/images";

export const runtime = "nodejs";

/**
 * Serves images uploaded through the admin editor out of Postgres. Bytes are
 * immutable per name (each upload gets a fresh timestamped name), so the CDN
 * is free to cache them for a year — same policy as a hashed build asset.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!imageNameOk(name)) {
    return NextResponse.json({ error: "Invalid image name." }, { status: 400 });
  }

  try {
    const image = await getImage(name);
    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(image.bytes), {
      headers: {
        "content-type": image.mime,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(`GET /api/images/${name} failed:`, error);
    return NextResponse.json({ error: "Could not load the image." }, { status: 500 });
  }
}
