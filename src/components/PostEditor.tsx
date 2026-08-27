"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import MediaLibraryModal, { type MediaAsset } from "@/components/MediaLibraryModal";
import { useMediaToolbar } from "@/lib/upload";
import { renderMarkdown } from "@/lib/markdown";

interface PostEditorProps {
  mode: "create" | "edit";
  initialSlug?: string;
  initialTitle?: string;
  initialDate?: string;
  initialTags?: string;
  initialColor?: string;
  initialContent?: string;
  initialCover?: string | null;
  publishLabel: string;
  savedLabel: string;
  onSubmit: (payload: {
    title: string;
    date: string;
    tags: string[];
    color: string;
    content: string;
    cover: string | null;
    slug?: string;
  }) => Promise<void>;
}

export default function PostEditor({
  mode,
  initialSlug,
  initialTitle = "",
  initialDate = "",
  initialTags = "",
  initialColor = "#4af0ff",
  initialContent = "",
  initialCover = null,
  publishLabel,
  savedLabel,
  onSubmit,
}: PostEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [tags, setTags] = useState(initialTags);
  const [color, setColor] = useState(initialColor);
  const [content, setContent] = useState(initialContent);
  const [cover, setCover] = useState<string | null>(initialCover);
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toolbar = useMediaToolbar({ insertMarkdown: insertAtCursor, defaultFolder: "" });

  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = content.slice(0, start) + snippet + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + snippet.length;
      });
    } else {
      setContent((prev) => (prev ? `${prev}\n\n${snippet}\n` : snippet));
    }
  }

  function insertWrapper(before: string, after: string, placeholder: string) {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = content.slice(start, end) || placeholder;
      const snippet = `${before}${selected}${after}`;
      const next = content.slice(0, start) + snippet + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = start + before.length;
        el.selectionEnd = start + before.length + selected.length;
      });
    } else {
      setContent((prev) => `${prev}\n${before}${placeholder}${after}\n`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit({
        title,
        date,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        color,
        content,
        cover,
        slug: mode === "edit" ? initialSlug : undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(kind: "image" | "video") {
    toolbar.handlePickFile(kind);
  }

  async function uploadCover() {
    toolbar.setError("");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      toolbar.setUploading(true);
      try {
        const res = await toolbar.upload(file);
        setCover(res.url);
      } catch (err) {
        toolbar.setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        toolbar.setUploading(false);
      }
    };
    input.click();
  }

  async function handleFilesDrop(files: FileList) {
    toolbar.handleDrop(files, insertAtCursor);
  }

  function handleMediaInsert(asset: MediaAsset) {
    setMediaOpen(false);
    if (asset.resourceType === "video") {
      insertAtCursor(`%%video src="${asset.secureUrl || asset.url}"%%`);
    } else {
      insertAtCursor(`![Image](${asset.secureUrl || asset.url})`);
    }
  }

  function handleCoverInsert(asset: MediaAsset) {
    setMediaOpen(false);
    setCover(asset.secureUrl || asset.url);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono text-white">{mode === "create" ? "Write a Post" : "Edit Post"}</h1>
          <p className="text-xs font-mono text-white/30 mt-1">
            {mode === "create"
              ? "Compose in markdown, drop in media, then publish live"
              : `slug: <span class="text-neon-400">${initialSlug}</span>`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xs font-mono text-neon-400 hover:underline">Manage Posts →</Link>
          <Link href="/blog" className="text-xs font-mono text-neon-400 hover:underline">← Blog</Link>
        </div>
      </div>

      {error && <p className="text-xs font-mono text-red-400 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-transparent text-white font-mono text-lg border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none placeholder:text-white/15"
            placeholder="Your post title"
          />
        </div>

        {/* Meta */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-transparent text-white font-mono text-sm border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none"
            />
          </div>
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-transparent text-white font-mono text-sm border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none placeholder:text-white/15"
              placeholder="Next.js, Design"
            />
            <p className="text-[10px] text-white/20 mt-2">Comma-separated</p>
          </div>
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-white/50">{color}</span>
            </div>
          </div>
        </div>

        {/* Cover image */}
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Cover Image</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCoverPickerOpen(true)}
                className="text-[10px] font-mono text-white/40 border border-white/10 rounded-lg px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all"
              >
                Pick from Library
              </button>
              <button
                type="button"
                onClick={uploadCover}
                className="text-[10px] font-mono text-white/40 border border-white/10 rounded-lg px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all"
              >
                {toolbar.uploading ? "Uploading…" : "↑ Upload"}
              </button>
              {cover && (
                <button
                  type="button"
                  onClick={() => setCover(null)}
                  className="text-[10px] font-mono text-red-400 border border-red-400/20 rounded-lg px-2.5 py-1 hover:bg-red-400/10 transition-all"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="Cover preview" className="w-full max-h-64 object-cover rounded-lg border border-white/10" />
          ) : (
            <div className="border border-dashed border-white/10 rounded-lg p-8 text-center">
              <p className="text-[10px] font-mono text-white/25">No cover image set — posts will show without a header image.</p>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block">Content (Markdown)</label>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => insertWrapper("**", "**", "bold")}
                className="toolbar-btn">B</button>
              <button type="button" onClick={() => insertWrapper("*", "*", "italic")}
                className="toolbar-btn italic">I</button>
              <button type="button" onClick={() => insertWrapper("`", "`", "code")}
                className="toolbar-btn font-mono">{"</>"}</button>
              <button type="button" onClick={() => insertAtCursor("\n## Heading\n")}
                className="toolbar-btn">H2</button>
              <button type="button" onClick={() => uploadFile("image")}
                className="toolbar-btn">🖼 Image</button>
              <button type="button" onClick={() => uploadFile("video")}
                className="toolbar-btn">🎬 Video</button>
              <button type="button" onClick={() => {
                const id = window.prompt("YouTube video ID (from youtube.com/watch?v=…)");
                if (id?.trim()) insertAtCursor(`%%video id="${id.trim()}"%%`);
              }}
                className="toolbar-btn">▶ YouTube</button>
              <button type="button" onClick={() => setMediaOpen(true)}
                className="toolbar-btn">🗂 Library</button>
              <button type="button" onClick={() => insertWrapper("[", "](https://example.com)", "link text")}
                className="toolbar-btn">🔗 Link</button>
            </div>
          </div>

          <div className={`grid gap-4 ${preview ? "md:grid-cols-2" : ""}`}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFilesDrop(e.dataTransfer.files); }}
              className={`relative border rounded-lg transition-all ${dragOver ? "border-neon-400/60 bg-neon-400/5" : "border-white/10"}`}
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={20}
                className="w-full bg-transparent text-white font-mono text-sm p-4 focus:outline-none placeholder:text-white/15 resize-y"
                placeholder="Write your post here… drag & drop images/videos straight in, or use the toolbar above."
              />
              {dragOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-mono text-neon-400 bg-black/70 border border-neon-400/40 rounded-lg px-4 py-2">Drop to upload media</span>
                </div>
              )}
            </div>

            {preview && (
              <div className="neon-card border border-white/5 rounded-lg p-5 bg-terminal-900/40 overflow-auto max-h-[70vh]">
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-400 animate-pulse" /> Live Preview
                </p>
                <div
                  className="md-body text-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              </div>
            )}
          </div>

          {toolbar.busyLabel && (
            <p className="text-[10px] font-mono text-neon-400 mt-2 animate-pulse">{toolbar.busyLabel}</p>
          )}
          {toolbar.error && <p className="text-[10px] font-mono text-red-400 mt-2">{toolbar.error}</p>}
          <p className="text-[10px] font-mono text-white/20 mt-2">
            Images: <code>{"![alt](url)"}</code> · Videos: <code>{"%%video src=\"url\"%%"}</code> · YouTube: <code>{"%%video id=\"ID\"%%"}</code>
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="btn-ghost text-xs"
          >
            {preview ? "Exit Split View" : "Split Preview"}
          </button>
          <button
            type="submit"
            disabled={!title || !content || busy}
            className="btn-neon text-xs"
          >
            {saved ? savedLabel : busy ? "Saving…" : publishLabel}
          </button>
        </div>
      </form>

      <MediaLibraryModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onInsert={handleMediaInsert}
        insertLabel="Insert"
      />
      <MediaLibraryModal
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onInsert={handleCoverInsert}
        insertLabel="Use as cover"
      />
    </div>
  );
}
