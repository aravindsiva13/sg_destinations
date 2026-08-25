import Pill from './Pill';

interface GalleryProps {
  hero: string;
  thumbs: string[];
  alt: string;
  extraPhotos?: number;
}

/**
 * Detail-page gallery: one large hero image beside a 2×2 thumbnail grid,
 * with a "+N photos" pill over the last thumbnail.
 */
export default function Gallery({ hero, thumbs, alt, extraPhotos = 0 }: GalleryProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="overflow-hidden rounded-card">
        <img
          src={hero}
          alt={alt}
          className="h-full max-h-[420px] w-full object-cover md:max-h-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {thumbs.slice(0, 4).map((src, i) => (
          <div key={i} className="relative overflow-hidden rounded-card">
            <img
              src={src}
              alt={`${alt} — view ${i + 2}`}
              loading="lazy"
              className="aspect-[4/3] h-full w-full object-cover"
            />
            {i === 3 && extraPhotos > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <Pill tone="light">+{extraPhotos} photos</Pill>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
