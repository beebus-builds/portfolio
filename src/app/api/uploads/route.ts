import { NextRequest, NextResponse } from "next/server";
import { getCloudinary, hasCloudinaryKeys, UPLOAD_FOLDER } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]);
const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-m4v", "video/ogg"]);

export async function POST(req: NextRequest) {
  try {
    if (!hasCloudinaryKeys()) {
      return NextResponse.json(
        { error: "Cloudinary credentials not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local and restart." },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 413 });
    }

    const mime = file.type;
    if (!ALLOWED_IMAGE.has(mime) && !ALLOWED_VIDEO.has(mime)) {
      return NextResponse.json(
        { error: "Unsupported file type. Images: JPG/PNG/WebP/GIF/AVIF/SVG. Videos: MP4/WebM/MOV/OGG." },
        { status: 415 }
      );
    }

    const resourceType = ALLOWED_VIDEO.has(mime) ? "video" : "image";
    const bytes = Buffer.from(await file.arrayBuffer());
    const cloudinary = getCloudinary();

    const folder = form.get("folder");
    const publicFolder = folder && typeof folder === "string" && folder.trim()
      ? `${UPLOAD_FOLDER}/${folder.trim().replace(/[^a-z0-9-_]/gi, "").slice(0, 40)}`
      : UPLOAD_FOLDER;

    const result = await new Promise<{
      secure_url: string;
      url: string;
      public_id: string;
      width?: number;
      height?: number;
      format: string;
      resource_type: string;
      bytes: number;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: publicFolder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, res) => {
          if (error || !res) return reject(error || new Error("Upload failed"));
          resolve(res as unknown as {
            secure_url: string;
            url: string;
            public_id: string;
            width?: number;
            height?: number;
            format: string;
            resource_type: string;
            bytes: number;
          });
        }
      );
      uploadStream.end(bytes);
    });

    return NextResponse.json({
      url: result.secure_url || result.url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes,
    });
  } catch (err) {
    console.error("POST /api/uploads failed:", err);
    const message = err instanceof Error ? err.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
