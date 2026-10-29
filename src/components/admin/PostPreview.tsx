"use client";

import { IMAGE_RE, type PostContent } from "@/lib/postBody";

/**
 * As-published rendering shared by the editor's live pane and the draft
 * dialog: cover art, kicker, title, lede and tags, then the parsed body the
 * way the public blog page renders it — lead paragraphs, pull quote, sections
 * with bullets and fenced code, and inline images.
 */

/** A preview paragraph is plain text or an inline `![alt](url)` image. */
function renderParagraph(paragraph: string, key: string) {
  const image = IMAGE_RE.exec(paragraph);
  if (image) {
    return (
      <figure key={key} className="editor__art__image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image[2]} alt={image[1]} loading="lazy" decoding="async" />
        {image[1] && <figcaption>{image[1]}</figcaption>}
      </figure>
    );
  }
  return <p key={key}>{paragraph}</p>;
}

type PostPreviewProps = {
  title: string;
  date: string;
  minutes: string;
  excerpt: string;
  /** Raw comma-separated tags, exactly as the draft holds them. */
  tags: string;
  accent: string;
  variant: number;
  parsed: PostContent;
};

export default function PostPreview({
  title,
  date,
  minutes,
  excerpt,
  tags,
  accent,
  variant,
  parsed,
}: PostPreviewProps) {
  const tagList = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const empty =
    title.trim() === "" &&
    excerpt.trim() === "" &&
    parsed.body.length === 0 &&
    parsed.sections.length === 0 &&
    !parsed.quote;

  return (
    <article className="editor__art">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="editor__art__cover"
        src={`/api/cover/preview?accent=${accent}&variant=${variant}`}
        alt=""
        width={1200}
        height={630}
      />
      <div className="editor__art__page">
        <p className="editor__art__kicker">
          {date || "unscheduled"} · {minutes || "5"} min read
        </p>
        <h3 className="editor__art__title">{title.trim() || "Untitled"}</h3>
        {excerpt.trim() !== "" && <p className="editor__art__lede">{excerpt}</p>}
        {tagList.length > 0 && (
          <p className="editor__art__tags">{tagList.map((tag) => `#${tag}`).join("  ")}</p>
        )}
        {empty ? (
          <p className="editor__art__empty">
            Start writing — the post takes shape here exactly as readers will see it.
          </p>
        ) : (
          <div className="editor__art__body">
            {parsed.body.map((paragraph, index) => renderParagraph(paragraph, `art-body-${index}`))}
            {parsed.quote && (
              <blockquote className="editor__art__quote">
                <p>{parsed.quote}</p>
              </blockquote>
            )}
            {parsed.sections.map((section, sIndex) => (
              <div key={section.heading || String(sIndex)} className="editor__art__section">
                <h4>{section.heading}</h4>
                {section.paragraphs.map((paragraph, pIndex) =>
                  renderParagraph(paragraph, `art-section-${sIndex}-${pIndex}`)
                )}
                {section.bullets && section.bullets.length > 0 && (
                  <ul>
                    {section.bullets.map((bullet, bIndex) => (
                      <li key={`art-section-${sIndex}-bullet-${bIndex}`}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {section.code && (
                  <figure className="editor__art__code">
                    <figcaption>{section.code.lang}</figcaption>
                    <pre>
                      <code>{section.code.snippet}</code>
                    </pre>
                  </figure>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
