"use client";

import { IMAGE_RE, type PostContent } from "@/lib/postBody";

/**
 * Draft preview for the post editor: renders the parsed lightweight markup
 * roughly the way the public blog page will, inside a native dialog. Kept
 * separate from PostEditor so the editor stays about editing.
 */

/** A preview paragraph is either plain text or an image reference. */
function renderPreviewParagraph(paragraph: string, key: string) {
  const image = IMAGE_RE.exec(paragraph);
  if (image) {
    return (
      <figure key={key} className="editor__preview-dialog__image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image[2]} alt={image[1]} loading="lazy" decoding="async" />
        {image[1] && <figcaption>{image[1]}</figcaption>}
      </figure>
    );
  }
  return <p key={key}>{paragraph}</p>;
}

type PreviewDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  date: string;
  excerpt: string;
  parsed: PostContent;
};

export default function PreviewDialog({ open, onClose, title, date, excerpt, parsed }: PreviewDialogProps) {
  return (
    <dialog className="editor__preview-dialog" open={open} onClose={onClose}>
      <div className="editor__preview-dialog__panel">
        <button type="button" className="editor__preview-dialog__close" aria-label="Close preview" onClick={onClose}>
          Close
        </button>
        <div className="editor__preview-dialog__header">
          <h2 style={{ margin: 0 }}>{title || "Untitled"}</h2>
          <p className="editor__preview-dialog__muted">
            {date} · {excerpt ? excerpt.length + " chars" : "no excerpt"}
          </p>
        </div>
        <div className="editor__preview-dialog__body">
          {parsed.body.map((paragraph, index) => renderPreviewParagraph(paragraph, `preview-body-${index}`))}
          {parsed.quote && (
            <blockquote className="editor__preview-dialog__quote">
              <p>{parsed.quote}</p>
            </blockquote>
          )}
          {parsed.sections.map((section, sIndex) => (
            <div key={section.heading || String(sIndex)} className="editor__preview-dialog__section">
              <h3>{section.heading}</h3>
              {section.paragraphs.map((paragraph, pIndex) =>
                renderPreviewParagraph(paragraph, `preview-section-${sIndex}-${pIndex}`)
              )}
              {section.bullets?.length && (
                <ul>
                  {section.bullets.map((bullet, bIndex) => (
                    <li key={`preview-section-${sIndex}-bullet-${bIndex}`}>{bullet}</li>
                  ))}
                </ul>
              )}
              {section.code && (
                <figure className="editor__preview-dialog__code">
                  <figcaption>{section.code.lang}</figcaption>
                  <pre><code>{section.code.snippet}</code></pre>
                </figure>
              )}
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
}
