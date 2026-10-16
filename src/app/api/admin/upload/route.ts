import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

function authorized(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${token}`;
}

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
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(bytes);
    const name = safeName(file.name);
    await writeFile(join(UPLOAD_DIR, name), buffer);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (error) {
    console.error("POST /api/admin/upload failed:", error);
    return NextResponse.json({ error: "Could not save the image." }, { status: 500 });
  }
}
