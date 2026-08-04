import { v2 as cloudinary } from "cloudinary";

export function getCloudinary() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!name || !key || !secret) {
    throw new Error("Cloudinary credentials missing — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  }

  cloudinary.config({
    cloud_name: name,
    api_key: key,
    api_secret: secret,
    secure: true,
  });

  return cloudinary;
}

export function hasCloudinaryKeys(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export const UPLOAD_FOLDER = "devverse/blog";

export function isImage(resourceType?: string): boolean {
  return resourceType === "image";
}

export function isVideo(resourceType?: string): boolean {
  return resourceType === "video";
}
