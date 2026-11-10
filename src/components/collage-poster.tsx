"use client";

import { cn } from "cn";
import { POSTER_TEXT_DEFAULTS, SVG_FLOWERS } from "@/lib/collage-style";

export type CollagePosterProps = {
  photos: string[];
  title?: string;
  subtitle?: string;
  className?: string;
};

export function CollagePoster({
  photos,
  title = "",
  subtitle = "",
  className,
}: CollagePosterProps) {
  return (
    <div
      className={cn("poster", className)}
      data-count={photos.length}
    >
      <div
        className="flower flower-top"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: SVG_FLOWERS.top }}
      />

      <header className="poster-header">
        <h1 className="poster-title">{title}</h1>
        <div className="poster-subtitle">{subtitle}</div>
      </header>

      <section className="photo-grid" aria-label="Foto kolase">
        {photos.map((src, index) => (
          <figure className="polaroid" key={`${src}-${index}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Foto ${index + 1}`} />
            <span className="number">
              {String(index + 1).padStart(2, "0")}
            </span>
          </figure>
        ))}
      </section>

      <div
        className="flower flower-side"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: SVG_FLOWERS.side }}
      />
      <div
        className="flower flower-bottom"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: SVG_FLOWERS.bottom }}
      />

      <div className="footer-note">{POSTER_TEXT_DEFAULTS.footerNote}</div>
    </div>
  );
}
