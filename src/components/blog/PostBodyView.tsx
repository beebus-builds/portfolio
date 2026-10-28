"use client";

import { useState } from "react";
import type { PostSection } from "@/lib/posts";
import { IMAGE_RE } from "@/lib/postBody";

/** Click any image in a post to open it full-size. */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Image"}
      onClick={onClose}
    >
      <button type="button" className="lightbox__close" onClick={onClose}>
        Close
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="eager" decoding="async" style={{ maxWidth: "95vw", maxHeight: "90vh" }} />
      {alt && <p className="lightbox__caption">{alt}</p>}
    </div>
  );
}

type PostBodyViewProps = {
  body: string[];
  sections?: PostSection[];
  quote?: string;
};

/**
 * Renders a post's lead paragraphs, sections, and pull quote. Client-side
 * because inline images open a lightbox on click — the surrounding page stays
 * a Server Component and hands over plain, serializable data.
 */
export default function PostBodyView({ body, sections, quote }: PostBodyViewProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  /** A body paragraph is either plain text or an image reference `![alt](url)`. */
  function renderParagraph(paragraph: string, key: string) {
    const image = IMAGE_RE.exec(paragraph);
    if (image) {
      return (
        <figure className="post-image" key={key} style={{ cursor: "pointer" }} onClick={() => setLightbox({ src: image[2], alt: image[1] })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image[2]}
            alt={image[1]}
            loading="lazy"
            decoding="async"
            style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }}
          />
          {image[1] && <figcaption>{image[1]}</figcaption>}
        </figure>
      );
    }
    return <p key={key}>{paragraph}</p>;
  }

  return (
    <>
      {body.map((paragraph, index) => renderParagraph(paragraph, `body-${index}`))}

      {quote && (
        <blockquote className="post-quote">
          <p>{quote}</p>
        </blockquote>
      )}

      {sections?.map((section, sIndex) => (
        <div className="post-section" key={section.heading || String(sIndex)}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph, pIndex) =>
            renderParagraph(paragraph, `section-${sIndex}-${pIndex}`)
          )}

          {section.bullets && (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}

          {section.code && (
            <figure className="post-code">
              <figcaption>{section.code.lang}</figcaption>
              <pre>
                <code>{section.code.snippet}</code>
              </pre>
            </figure>
          )}
        </div>
      ))}

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    </>
  );
}
