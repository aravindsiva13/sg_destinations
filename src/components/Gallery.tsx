import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Pill from './Pill';

interface GalleryProps {
  hero: string;
  thumbs: string[];
  alt: string;
  extraPhotos?: number;
}

const FALLBACK_IMAGE = '/images/brand/logo-dark.png';

/**
 * Detail-page gallery: one large hero image beside a 2×2 thumbnail grid,
 * with an interactive lightbox modal preview mounted in a portal to prevent CSS stacking bugs.
 */
export default function Gallery({ hero, thumbs, alt, extraPhotos = 0 }: GalleryProps) {
  // Combine hero and all thumbs into a unified list of photos, deduplicated and filtered
  const rawList = [hero, ...thumbs];
  const allImages = Array.from(new Set(rawList.filter((src): src is string => Boolean(src && src.trim()))));
  if (allImages.length === 0) allImages.push(FALLBACK_IMAGE);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (lightboxIndex === null) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxIndex]);

  // Keyboard navigation (Esc to close, Left/Right arrow to browse)
  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev !== null ? (prev + 1) % allImages.length : 0));
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev !== null ? (prev - 1 + allImages.length) % allImages.length : 0));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, allImages.length]);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {/* Large Hero image */}
        <div
          onClick={() => setLightboxIndex(0)}
          className="group relative cursor-pointer overflow-hidden rounded-card transition-all duration-300 hover:opacity-95"
        >
          <img
            src={hero || FALLBACK_IMAGE}
            alt={alt}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
            }}
            className="h-full max-h-[420px] w-full object-cover transition-transform duration-700 group-hover:scale-105 md:max-h-none"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
            <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-charcoal backdrop-blur-sm shadow-md">
              Click to view photo
            </span>
          </div>
        </div>

        {/* 2x2 Thumbnail Grid */}
        <div className="grid grid-cols-2 gap-3">
          {thumbs.slice(0, 4).map((src, i) => {
            const imageIndex = allImages.indexOf(src) !== -1 ? allImages.indexOf(src) : i + 1;
            return (
              <div
                key={i}
                onClick={() => setLightboxIndex(imageIndex)}
                className="group relative cursor-pointer overflow-hidden rounded-card transition-all duration-300 hover:opacity-95"
              >
                <img
                  src={src || FALLBACK_IMAGE}
                  alt={`${alt} — view ${i + 2}`}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
                  }}
                  className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/20" />

                {/* +N photos pill on the 4th item */}
                {i === 3 && extraPhotos > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px] transition-colors group-hover:bg-black/65">
                    <Pill tone="light">+{extraPhotos} photos</Pill>
                    <span className="mt-1.5 text-xs text-white/85">View all {allImages.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-Screen Lightbox Modal in React Portal */}
      {lightboxIndex !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex h-screen w-screen flex-col items-center justify-between bg-black/95 p-4 md:p-8 backdrop-blur-md animate-fadeIn"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar */}
            <div
              className="flex w-full max-w-6xl items-center justify-between text-white/90"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-serif text-lg tracking-wide">
                {alt} <span className="text-xs font-sans text-white/60">({lightboxIndex + 1} of {allImages.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            {/* Main Photo with Left / Right Navigation */}
            <div
              className="relative flex flex-1 w-full max-w-6xl items-center justify-center py-4 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Button */}
              {allImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev !== null ? (prev - 1 + allImages.length) % allImages.length : 0))}
                  className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-2xl text-white backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-110 md:left-4"
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}

              {/* Displayed Image */}
              <img
                src={allImages[lightboxIndex]}
                alt={`${alt} preview ${lightboxIndex + 1}`}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
                }}
                className="max-h-[72vh] max-w-full rounded-lg object-contain shadow-2xl transition-all duration-300"
              />

              {/* Right Button */}
              {allImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev !== null ? (prev + 1) % allImages.length : 0))}
                  className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-2xl text-white backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-110 md:right-4"
                  aria-label="Next image"
                >
                  ›
                </button>
              )}
            </div>

            {/* Bottom Thumbnails Strip */}
            <div
              className="flex max-w-4xl gap-2 overflow-x-auto pb-2 scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    lightboxIndex === idx ? 'border-amber-400 scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
                    }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
