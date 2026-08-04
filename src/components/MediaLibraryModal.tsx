"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MediaAsset {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes?: number;
  createdAt?: string;
}

export type { MediaAsset };

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (asset: MediaAsset) => void;
  insertLabel?: string;
}

function formatBytes(n?: number): string {
  if (!n) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = n;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function MediaLibraryModal({ open, onClose, onInsert, insertLabel = "Insert" }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [type, setType] = useState<"all" | "image" | "video">("all");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [folder, setFolder] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (typeFilter: typeof type) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/media?type=${typeFilter}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load media");
      setAssets(data.media || []);
      setConfigured(data.configured !== false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load(type);
  }, [open, type, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        if (folder.trim()) fd.append("folder", folder.trim());
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
      }
      await load(type);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="dark-surface w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(15,15,42,0.99), rgba(10,10,30,0.99))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
          <div>
            <h2 className="text-sm font-mono text-white">Media Library</h2>
            <p className="text-[10px] font-mono text-white/30 mt-0.5">Cloudinary · devverse/blog</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-sm font-mono px-2">×</button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-1">
            {(["all", "image", "video"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`text-[10px] font-mono px-3 py-1 rounded-full border transition-all ${
                  type === t
                    ? "border-neon-400/40 bg-neon-400/10 text-neon-400"
                    : "border-white/10 text-white/30 hover:text-white/60"
                }`}
              >
                {t === "all" ? "All" : t === "image" ? "Images" : "Videos"}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <input
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="optional folder…"
            className="w-32 bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-mono text-white/60 outline-none focus:border-neon-400/40 placeholder:text-white/20"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-neon text-[10px]"
          >
            {uploading ? "Uploading…" : "↑ Upload"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Drag zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex-1 overflow-y-auto p-5 ${dragOver ? "bg-neon-400/5" : ""}`}
        >
          {!configured && (
            <div className="border border-white/10 rounded-xl p-6 text-center mb-4">
              <p className="text-xs font-mono text-white/60">Cloudinary isn&apos;t configured yet.</p>
              <p className="text-[10px] font-mono text-white/30 mt-1">
                Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local and restart.
              </p>
            </div>
          )}

          {error && <p className="text-[10px] font-mono text-red-400 mb-3">{error}</p>}

          {loading ? (
            <div className="text-center py-16">
              <p className="text-xs font-mono text-white/30 animate-pulse">Loading media…</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm font-mono text-white/40">
                {configured ? "No media yet." : "Media library empty."}
              </p>
              <p className="text-[10px] font-mono text-white/25 mt-2">
                Drag &amp; drop files here, or use Upload.
              </p>            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset) => (
                <div
                  key={asset.publicId}
                  className="group relative border border-white/10 rounded-xl overflow-hidden bg-terminal-900/50 hover:border-neon-400/40 transition-all"
                >
                  {asset.resourceType === "video" ? (
                    <div className="aspect-video bg-black flex items-center justify-center">
                      <video src={asset.secureUrl || asset.url} className="w-full h-full object-cover" muted preload="metadata" />
                      <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono text-white bg-black/60 rounded px-1.5 py-0.5">▶ video</span>
                    </div>
                  ) : (
                    <div className="aspect-video overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.secureUrl || asset.url}
                        alt={asset.publicId}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="px-2.5 py-2 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono text-white/30 truncate">
                      {asset.format.toUpperCase()} · {formatBytes(asset.bytes)}
                    </span>
                    <button
                      onClick={() => onInsert(asset)}
                      className="text-[9px] font-mono text-neon-400 border border-neon-400/30 rounded px-2 py-0.5 hover:bg-neon-400/10 transition-all shrink-0"
                    >
                      {insertLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
