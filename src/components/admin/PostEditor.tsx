"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parsePostContent, serializePostContent } from "@/lib/postBody";
import { COVER_ACCENTS, COVER_VARIANTS } from "@/lib/coverArt";
import PostPreview from "./PostPreview";
import PreviewDialog from "./PreviewDialog";

/**
 * Post editor for /admin.
 *
 * Writing happens in one textarea using the lightweight format documented in
 * src/lib/postBody.ts — a nested form with repeater rows would make writing
 * harder, and writing is the part that should be easy. Everything else is a
 * normal field.
 *
 * The form runs as four numbered steps — basics, hook, story, cover — laid
 * out beside a live preview pane that renders the draft exactly the way the
 * public blog page will (PostPreview). A save bar holds Publish, the publish
 * toggle and the live URL at the bottom edge while scrolling, and a Preview
 * button opens the same rendering in a dialog (PreviewDialog) for narrow
 * screens. Drafts autosave to localStorage so a refresh never loses a
 * half-written post; a toolbar inserts the supported syntax at the cursor.
 */

export type EditorPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  minutes: number;
  body: string[];
  sections: unknown[];
  quote: string | null;
  cover_src: string;
  cover_alt: string;
  cover_accent: string;
  cover_variant: number;
  published: boolean;
};

type Draft = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string;
  minutes: string;
  content: string;
  cover_src: string;
  cover_alt: string;
  cover_accent: string;
  cover_variant: number;
  published: boolean;
};

const BLANK: Draft = {
  slug: "",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  excerpt: "",
  tags: "",
  minutes: "5",
  content: "",
  cover_src: "",
  cover_alt: "",
  cover_accent: "#38bdf8",
  cover_variant: 0,
  published: true,
};

const TITLE_MIN = 8;
const TITLE_MAX = 140;
const EXCERPT_MIN = 40;
const EXCERPT_MAX = 300;

/** Shared ok/warn tint for the character counters under each field. */
function hintTone(ok: boolean, warn: boolean): string {
  if (ok) return " editor__hint--ok";
  if (warn) return " editor__hint--warn";
  return "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toDraft(post: EditorPost): Draft {
  const content = serializePostContent({
    body: post.body,
    quote: post.quote ?? undefined,
    sections: post.sections as never,
  });
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    tags: post.tags.join(", "),
    minutes: String(post.minutes),
    content,
    cover_src: post.cover_src,
    cover_alt: post.cover_alt,
    cover_accent: post.cover_accent || "#38bdf8",
    cover_variant: Number.isFinite(post.cover_variant) ? post.cover_variant : 0,
    published: post.published,
  };
}

/** LocalStorage key for a draft: stable per post being edited, one slot for new posts. */
function draftKey(slug: string | undefined): string {
  return `post:draft:${slug ?? "new"}`;
}

function loadDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function saveDraft(key: string, draft: Draft): void {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    /* storage full or private mode: draft won't persist, that's acceptable */
  }
}

export default function PostEditor({
  token,
  editing,
  onSaved,
}: {
  token: string;
  /** Post currently loaded in the form; null when writing something new. */
  editing: EditorPost | null;
  onSaved: (slug: string) => void;
}) {
  const key = draftKey(editing?.slug);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [slugLocked, setSlugLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const scheduled = draft.date > today;

  const titleOk = draft.title.length >= TITLE_MIN && draft.title.length <= TITLE_MAX;
  const titleWarn = draft.title.length > 0 && !titleOk;
  const excerptOk = draft.excerpt.length >= EXCERPT_MIN && draft.excerpt.length <= EXCERPT_MAX;
  const excerptWarn = draft.excerpt.length > 0 && !excerptOk;

  // Load the selected post into the form. Keyed on the slug so picking the same
  // post again still refreshes the fields.
  useEffect(() => {
    if (!editing) return;
    setDraft(toDraft(editing));
    setSlugLocked(true);
    setErrors([]);
    setStatus("Loaded for editing.");
  }, [editing]);

  /** Restore a saved local draft for a brand-new post the first time the editor opens. */
  useEffect(() => {
    if (editing) return;
    if (draft.title !== "" || draft.content !== "" || draft.excerpt !== "") return;
    const saved = loadDraft(key);
    if (saved) {
      setDraft(saved);
      setRestored(true);
      setStatus("Restored your saved draft.");
    }
  }, [editing, key, draft.title, draft.content, draft.excerpt]);

  /** Autosave every change so a closed tab never loses a draft. */
  useEffect(() => {
    const hasSomething =
      draft.title ||
      draft.excerpt ||
      draft.tags ||
      draft.content ||
      draft.cover_alt ||
      draft.slug;
    if (!hasSomething) return;
    const timer = setTimeout(() => saveDraft(key, draft), 1500);
    return () => clearTimeout(timer);
  }, [draft, key]);

  useEffect(() => {
    const onBeforeUnload = () => saveDraft(key, draft);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [draft, key]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  function updateTitle(title: string) {
    setDraft((current) => ({
      ...current,
      title,
      slug: slugLocked ? current.slug : slugify(title),
    }));
    setStatus(null);
  }

  /** Insert text at the caret, replacing any selection, and keep the caret after it. */
  function insertAtCursor(insert: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = el.value;
    const newValue = value.slice(0, start) + insert + value.slice(end);
    el.value = newValue;
    const caret = start + insert.length;
    el.setSelectionRange(caret, caret);
    setDraft((current) => ({ ...current, content: newValue }));
    setStatus(null);
  }

  function block(lead: string, trail: string) {
    insertAtCursor(`${lead}${trail}`);
  }

  async function uploadImage() {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  }

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrors([]);
    setStatus(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: form,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.status === 401) throw new Error("Wrong token.");
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      if (!data.url) throw new Error("No image URL returned.");

      const alt = file.name.replace(/\.[^/.]+$/, "");
      insertAtCursor(`\n\n![${alt}](${data.url})\n\n`);
      setStatus(`Image inserted: ${data.url}`);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Image upload failed."]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const parsed = useMemo(() => parsePostContent(draft.content), [draft.content]);

  async function save() {
    setBusy(true);
    setErrors([]);
    setStatus(null);

    const body = {
      slug: draft.slug,
      title: draft.title,
      date: draft.date,
      excerpt: draft.excerpt,
      tags: draft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      minutes: Number(draft.minutes),
      body: parsed.body,
      sections: parsed.sections,
      quote: parsed.quote ?? "",
      // A new post has no SVG file on disk, so point at the route that
      // generates one from the accent and style chosen below.
      cover_src: draft.cover_src.trim() || `/api/cover/${draft.slug}`,
      cover_alt: draft.cover_alt,
      cover_accent: draft.cover_accent,
      cover_variant: draft.cover_variant,
      published: draft.published,
    };

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; details?: string[]; post?: EditorPost };

      if (res.status === 401) throw new Error("Wrong token.");
      if (!res.ok) {
        setErrors(data.details?.length ? data.details : [data.error ?? "Could not save."]);
        return;
      }

      setSlugLocked(true);
      setStatus(`Saved. Live at /blog/${draft.slug}`);
      try { localStorage.removeItem(key); } catch {}
      onSaved(draft.slug);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Unknown error"]);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!draft.slug) return;
    const ok = window.confirm(`Delete "${draft.title || draft.slug}"? This cannot be undone.`);
    if (!ok) return;

    setBusy(true);
    setErrors([]);
    try {
      const res = await fetch(`/api/admin/posts/${draft.slug}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.status === 401) throw new Error("Wrong token.");
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrors([data.error ?? "Could not delete."]);
        return;
      }
      setDraft({ ...BLANK, date: new Date().toISOString().slice(0, 10) });
      setSlugLocked(false);
      try { localStorage.removeItem(key); } catch {}
      setStatus("Deleted.");
      onSaved("");
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Unknown error"]);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setDraft({ ...BLANK, date: new Date().toISOString().slice(0, 10) });
    setSlugLocked(false);
    setErrors([]);
    setStatus("Cleared. Writing a new post.");
  }

  const slugPreview = draft.slug || "my-post-slug";
  const tagCount = draft.tags.split(",").filter(Boolean).length;
  const tagOk = tagCount >= 1 && tagCount <= 6;
  const tagWarn = tagCount > 6;

  return (
    <div className="editor">
      {restored && (
        <div className="editor__draft-banner" role="status">
          <p>Unsaved draft restored.</p>
          <button
            type="button"
            onClick={() => {
              setDraft({ ...BLANK, date: new Date().toISOString().slice(0, 10) });
              setSlugLocked(false);
              setRestored(false);
              try { localStorage.removeItem(key); } catch {}
              setStatus("Cleared. Writing a new post.");
            }}
          >
            Start over
          </button>
        </div>
      )}

      <div className="editor__layout">
        <div className="editor__pane editor__pane--form">
          {/* step 1 — identity: what it is called, when it runs, how it is tagged */}
          <fieldset className="editor__step">
            <legend>
              <span className="editor__stepnum">1</span> The basics
            </legend>

            <div className="editor__field">
              <label htmlFor="post-title">Title</label>
              <input
                id="post-title"
                value={draft.title}
                onChange={(event) => updateTitle(event.target.value)}
                placeholder="What shipped, and what it taught you"
              />
              <small className={`editor__hint${hintTone(titleOk, titleWarn)}`}>
                {draft.title.length} / {TITLE_MAX} characters ({TITLE_MIN} minimum)
              </small>
            </div>

            <div className="editor__field">
              <label htmlFor="post-slug">URL slug</label>
              <input
                id="post-slug"
                value={draft.slug}
                onChange={(event) => {
                  setSlugLocked(true);
                  update("slug", slugify(event.target.value));
                }}
                readOnly={false}
              />
              <small className="editor__hint">
                {draft.slug ? `/blog/${draft.slug}` : "Generated from the title as you type."}
                {slugLocked ? " Locked — this is the live URL." : ""}
              </small>
            </div>

            <div className="editor__row editor__row--split">
              <div className="editor__field editor__field--narrow">
                <label htmlFor="post-date">Date</label>
                <input
                  id="post-date"
                  type="date"
                  value={draft.date}
                  onChange={(event) => update("date", event.target.value)}
                />
                {scheduled && (
                  <span className="editor__scheduled">Schedules for {draft.date}</span>
                )}
              </div>
              <div className="editor__field editor__field--narrow">
                <label htmlFor="post-minutes">Read time (min)</label>
                <input
                  id="post-minutes"
                  type="number"
                  min={1}
                  max={60}
                  value={draft.minutes}
                  onChange={(event) => update("minutes", event.target.value)}
                />
              </div>
            </div>

            <div className="editor__field">
              <label htmlFor="post-tags">Tags</label>
              <input
                id="post-tags"
                value={draft.tags}
                onChange={(event) => update("tags", event.target.value)}
                placeholder="Next.js, Performance"
              />
              <small className={`editor__hint${hintTone(tagOk, tagWarn)}`}>
                {tagCount} / 6 · comma separated
              </small>
            </div>
          </fieldset>

          {/* step 2 — the share text */}
          <fieldset className="editor__step">
            <legend>
              <span className="editor__stepnum">2</span> The hook
            </legend>

            <div className="editor__field">
              <label htmlFor="post-excerpt">Excerpt</label>
              <textarea
                id="post-excerpt"
                rows={2}
                value={draft.excerpt}
                onChange={(event) => update("excerpt", event.target.value)}
                placeholder="One or two sentences. This is what people see when they share the link."
              />
              <small className={`editor__hint${hintTone(excerptOk, excerptWarn)}`}>
                {draft.excerpt.length} / {EXCERPT_MAX} characters ({EXCERPT_MIN} minimum)
              </small>
            </div>
          </fieldset>

          {/* step 3 — the writing itself */}
          <fieldset className="editor__step">
            <legend>
              <span className="editor__stepnum">3</span> The story
            </legend>

            <div className="editor__toolbar" aria-label="Writing shortcuts">
              <button
                type="button"
                title="Section heading (## )"
                aria-label="Insert a section heading"
                onClick={() => block("\n\n## ", "\n\n")}
              >
                § Heading
              </button>
              <button
                type="button"
                title="Bullet list (- )"
                aria-label="Insert a bullet"
                onClick={() => block("\n- ", "\n")}
              >
                • Bullet
              </button>
              <button
                type="button"
                title="Code block (```ts)"
                aria-label="Insert a fenced code block"
                onClick={() => block("\n\n```ts\n", "\n```\n\n")}
              >
                {"<"}{" "}{">"} Code
              </button>
              <button
                type="button"
                title="Pull quote (> )"
                aria-label="Insert a pull quote"
                onClick={() => block("\n> ", "\n")}
              >
                “ Quote
              </button>
              <button
                type="button"
                title="Upload and insert an image"
                aria-label="Upload an image"
                onClick={uploadImage}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "🖼 Image"}
              </button>
              <button
                type="button"
                title="Preview this draft in a focused window"
                aria-label="Preview draft"
                onClick={() => setPreviewOpen(true)}
              >
                Preview
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/avif"
                onChange={handleImageSelect}
                hidden
              />
            </div>

            <div className="editor__field">
              <label htmlFor="post-content">Post</label>
              <textarea
                ref={textareaRef}
                id="post-content"
                className="editor__body"
                rows={22}
                value={draft.content}
                onChange={(event) => update("content", event.target.value)}
                placeholder={
                  "Opening paragraph. Blank line for a new one.\n\n> The line worth remembering.\n\n## A section heading\n\nWhat happened, and why.\n\n- a bullet\n- another bullet\n\n```ts\nconst example = true;\n```"
                }
              />
              <small className="editor__hint">
                Blank line = new paragraph · <code>## </code> = section · <code>- </code> = bullet ·{" "}
                <code>&gt; </code> = pull quote · <code>```lang</code> = code block.
              </small>
            </div>

            <p className="editor__counts">
              {parsed.body.length} opening paragraphs · {parsed.sections.length} sections ·{" "}
              {parsed.sections.reduce((total, section) => total + (section.bullets?.length ?? 0), 0)} bullets ·{" "}
              {parsed.sections.filter((section) => section.code).length} code blocks
              {parsed.quote ? " · 1 pull quote" : ""}
            </p>
          </fieldset>

          {/* step 4 — the artwork */}
          <fieldset className="editor__step">
            <legend>
              <span className="editor__stepnum">4</span> Cover art
            </legend>

            <div className="editor__row editor__row--split">
              <div className="editor__field">
                <label htmlFor="post-style">Style</label>
                <select
                  id="post-style"
                  value={draft.cover_variant}
                  onChange={(event) => update("cover_variant", Number(event.target.value))}
                >
                  {COVER_VARIANTS.map((name, index) => (
                    <option key={name} value={index}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="editor__field editor__field--narrow">
                <label htmlFor="post-accent">Accent</label>
                <div className="editor__accents">
                  {COVER_ACCENTS.map((accent) => (
                    <button
                      key={accent}
                      type="button"
                      className={draft.cover_accent === accent ? "is-active" : undefined}
                      style={{ background: accent }}
                      aria-label={`Accent ${accent}`}
                      aria-pressed={draft.cover_accent === accent}
                      onClick={() => update("cover_accent", accent)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="editor__field">
              <label htmlFor="post-cover-alt">Cover description</label>
              <input
                id="post-cover-alt"
                value={draft.cover_alt}
                onChange={(event) => update("cover_alt", event.target.value)}
                placeholder="What the artwork shows, for screen readers"
              />
            </div>
          </fieldset>
        </div>

        <aside className="editor__pane editor__pane--preview" aria-label="Live preview">
          <p className="editor__pane__cap">As readers will see it</p>
          <PostPreview
            title={draft.title}
            date={draft.date}
            minutes={draft.minutes}
            excerpt={draft.excerpt}
            tags={draft.tags}
            accent={draft.cover_accent}
            variant={draft.cover_variant}
            parsed={parsed}
          />
        </aside>
      </div>

      <div className="editor__savebar">
        <div className="editor__savebar__feedback">
          {errors.length > 0 && (
            <ul className="editor__errors" role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          {status && (
            <p className="editor__status" role="status">
              {status}
            </p>
          )}
        </div>
        <div className="editor__savebar__controls">
          <label className="editor__toggle">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(event) => update("published", event.target.checked)}
            />
            Published (uncheck to keep it as a draft)
            {scheduled && draft.published && (
              <span className="editor__scheduled"> · publishes {draft.date}</span>
            )}
          </label>
          <span className="editor__savebar__url">/blog/{slugPreview}</span>
          <div className="editor__actions">
            <button className="btn" type="button" onClick={save} disabled={busy}>
              {busy ? "Saving…" : draft.published ? "Publish" : "Save draft"}
            </button>
            <button className="btn btn--ghost" type="button" onClick={reset} disabled={busy}>
              New post
            </button>
            {slugLocked && (
              <button className="btn btn--ghost" type="button" onClick={remove} disabled={busy}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------- draft preview dialog ---------- */}
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={draft.title}
        date={draft.date}
        minutes={draft.minutes}
        excerpt={draft.excerpt}
        tags={draft.tags}
        accent={draft.cover_accent}
        variant={draft.cover_variant}
        parsed={parsed}
      />
    </div>
  );
}
