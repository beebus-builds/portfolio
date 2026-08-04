"use client";

import { useRef, useState } from "react";

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  resourceType: string;
  bytes: number;
}

export function useUploader() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File, folder?: string): Promise<UploadResult> {
    const fd = new FormData();
    fd.append("file", file);
    if (folder) fd.append("folder", folder);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data as UploadResult;
  }

  return { uploading, setUploading, error, setError, upload };
}

export interface ToolbarUploadProps {
  insertMarkdown: (snippet: string) => void;
  defaultFolder?: string;
}

export function useMediaToolbar({ insertMarkdown, defaultFolder }: ToolbarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, setUploading, error, setError, upload } = useUploader();
  const [busyLabel, setBusyLabel] = useState<string | null>(null);

  async function handlePickFile(kind: "image" | "video") {
    setError("");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = kind === "image" ? "image/*" : "video/mp4,video/webm,video/quicktime";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      setBusyLabel(kind === "image" ? "Uploading image…" : "Uploading video…");
      try {
        const res = await upload(file, defaultFolder);
        if (kind === "image") {
          insertMarkdown(`![Image](${res.url})`);
        } else {
          insertMarkdown(`%%video src="${res.url}"%%`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
        setBusyLabel(null);
      }
    };
    input.click();
  }

  async function handleDrop(files: FileList, insertMarkdownFn: (s: string) => void) {
    setError("");
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      if (!isVideo && !file.type.startsWith("image/")) continue;
      setUploading(true);
      setBusyLabel(isVideo ? "Uploading video…" : "Uploading image…");
      try {
        const res = await upload(file, defaultFolder);
        if (isVideo) {
          insertMarkdownFn(`%%video src="${res.url}"%%`);
        } else {
          insertMarkdownFn(`![Image](${res.url})`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
        setBusyLabel(null);
      }
    }
  }

  return {
    fileInputRef,
    uploading,
    setUploading,
    busyLabel,
    error,
    setError,
    upload,
    handlePickFile,
    handleDrop,
  };
}
