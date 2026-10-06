"use client";

import { useEffect, useMemo, useState } from "react";
import { parsePostContent, serializePostContent } from "@/lib/postBody";
import { COVER_ACCENTS, COVER_VARIANTS } from "@/lib/coverArt";

/**
 * Post editor for /admin.
 *
 * Writing happens in one textarea using the lightweight format documented in
 * src/lib/postBody.ts — a nested form with repeater rows would make writing
 * harder, and writing is the part that should be easy. Everything else is a
 * normal field.
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
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [slugLocked, setSlugLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  // Load the selected post into the form. Keyed on the slug so picking the same
  // post again still refreshes the fields.
  useEffect(() => {
    if (!editing) return;
    setDraft(toDraft(editing));
    setSlugLocked(true);
    setErrors([]);
    setStatus("Loaded for editing.");
  }, [editing]);

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

  return (
    <div className="editor">
      <div className="editor__row editor__row--split">
        <div className="editor__field">
          <label htmlFor="post-title">Title</label>
          <input
            id="post-title"
            value={draft.title}
            onChange={(event) => updateTitle(event.target.value)}
            placeholder="What shipped, and what it taught you"
          />
        </div>
        <div className="editor__field editor__field--narrow">
          <label htmlFor="post-date">Date</label>
          <input
            id="post-date"
            type="date"
            value={draft.date}
            onChange={(event) => update("date", event.target.value)}
          />
        </div>
      </div>

      <div className="editor__row editor__row--split">
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
        <label htmlFor="post-excerpt">Excerpt</label>
        <textarea
          id="post-excerpt"
          rows={2}
          value={draft.excerpt}
          onChange={(event) => update("excerpt", event.target.value)}
          placeholder="One or two sentences. This is what people see when they share the link."
        />
        <small className="editor__hint">{draft.excerpt.length} characters (40 minimum).</small>
      </div>

      <div className="editor__field">
        <label htmlFor="post-tags">Tags</label>
        <input
          id="post-tags"
          value={draft.tags}
          onChange={(event) => update("tags", event.target.value)}
          placeholder="Next.js, Performance"
        />
        <small className="editor__hint">Comma separated, up to six.</small>
      </div>

      <div className="editor__field">
        <label htmlFor="post-content">Post</label>
        <textarea
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

      <fieldset className="editor__cover">
        <legend>Cover art</legend>

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

        <div className="editor__preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/cover/preview?accent=${draft.cover_accent}&variant=${draft.cover_variant}`}
            alt=""
            width={1200}
            height={630}
          />
        </div>
      </fieldset>

      <label className="editor__toggle">
        <input
          type="checkbox"
          checked={draft.published}
          onChange={(event) => update("published", event.target.checked)}
        />
        Published (uncheck to keep it as a draft)
      </label>

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

      <p className="editor__counts">
        {parsed.body.length} opening paragraphs · {parsed.sections.length} sections ·{" "}
        {parsed.sections.reduce((total, section) => total + (section.bullets?.length ?? 0), 0)} bullets ·{" "}
        {parsed.sections.filter((section) => section.code).length} code blocks
        {parsed.quote ? " · 1 pull quote" : ""}
      </p>
    </div>
  );
}

