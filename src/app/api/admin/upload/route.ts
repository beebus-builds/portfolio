import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorized } from "@/lib/adminAuth";
import { MAX_IMAGE_BYTES, saveImage } from "@/lib/images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);

function safeName(original: string): string {
  const base = original.replace(/[^a-z0-9.-]/gi, "_").toLowerCase();
  const stamp = Date.now().toString(36);
  return `${stamp}-${base}`;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload body." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPEG, WebP and AVIF images are accepted." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });
  }

  try {
    // Images are stored in Postgres rather than the filesystem: Vercel's
    // runtime disk is read-only, so files written at request time would not
    // survive the next deploy and post bodies would point at dead URLs.
    const buffer = Buffer.from(bytes);
    const name = safeName(file.name);
    await saveImage(name, file.type, buffer);
    return NextResponse.json({ url: `/api/images/${name}` });
  } catch (error) {
    console.error("POST /api/admin/upload failed:", error);
    return NextResponse.json({ error: "Could not save the image." }, { status: 500 });
  }
}
