import Link from "next/link";

type SectionHeadingProps = {
  kicker: string;
  title: string;
  lede?: string;
  moreHref?: string;
  moreLabel?: string;
};

/** Consistent kicker + title + lede block used by every homepage section. */
export default function SectionHeading({ kicker, title, lede, moreHref, moreLabel }: SectionHeadingProps) {
  return (
    <div className="section-head">
      <p className="section-head__kicker">{kicker}</p>
      <div className="section-head__row">
        <h2 className="section-head__title">{title}</h2>
        {moreHref && (
          <Link className="text-link" href={moreHref}>
            {moreLabel ?? "Open section"} →
          </Link>
        )}
      </div>
      {lede && <p className="section-head__lede">{lede}</p>}
    </div>
  );
}
