import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inr } from '../data/site';
import Icon from './Icon';
import Pill from './Pill';

/** Minimal shape a card needs — satisfied by both static and API stays. */
export interface StayCardData {
  slug: string;
  name: string;
  badge?: string | null;
  pricePerNight: number;
  heroImage: string;
  gallery?: string[];
}

export default function StayCard({ stay }: { stay: StayCardData }) {
  // Use up to 4 extra photos from the gallery
  const images = stay.gallery?.length ? [stay.heroImage, ...stay.gallery.slice(0, 4)] : [stay.heroImage];
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card group/card">
        <Link to={`/stays/${stay.slug}`} className="block h-full w-full bg-cream-2 relative">
          <img
            src={images[currentIndex]}
            alt={`${stay.name} at Shraddha Garden Resort`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
          />
          {/* Subtle brand overlay on hover */}
          <div className="absolute inset-0 bg-ink/20 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 flex items-center justify-center pointer-events-none z-0">
            <img 
              src="/images/brand/icon-gold.png" 
              alt="" 
              className="w-16 h-16 opacity-0 translate-y-4 transition-all duration-500 delay-75 group-hover/card:opacity-90 group-hover/card:translate-y-0 drop-shadow-lg" 
            />
          </div>
        </Link>

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid h-8 w-8 place-items-center rounded-full bg-paper/80 text-ink opacity-0 backdrop-blur transition-all hover:bg-paper group-hover/card:opacity-100 focus:opacity-100"
              aria-label="Previous image"
            >
              <Icon name="chevron" className="h-4 w-4 rotate-90" />
            </button>
            <button
              onClick={nextImage}
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid h-8 w-8 place-items-center rounded-full bg-paper/80 text-ink opacity-0 backdrop-blur transition-all hover:bg-paper group-hover/card:opacity-100 focus:opacity-100"
              aria-label="Next image"
            >
              <Icon name="chevron" className="h-4 w-4 -rotate-90" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 pointer-events-none">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`block h-1.5 w-1.5 rounded-full shadow-sm transition-all ${
                    i === currentIndex ? 'bg-cream scale-125' : 'bg-cream/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {stay.badge && (
          <span className="absolute left-3 top-3 pointer-events-none z-10">
            <Pill tone="dark">
              <Icon name="star" className="h-3 w-3 text-terracotta" />
              {stay.badge}
            </Pill>
          </span>
        )}
        <span className="absolute right-3 top-3 pointer-events-none z-10">
          <Pill tone="light">
            {inr(stay.pricePerNight)}{' '}
            <span className="text-muted">/ night</span>
          </Pill>
        </span>
      </div>

      <div className="mt-4">
        <h3 className="font-serif text-xl text-ink">{stay.name}</h3>
        <Link
          to={`/stays/${stay.slug}`}
          className="link-underline mt-1.5 text-sm text-terracotta"
        >
          View details
          <Icon name="arrow" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
