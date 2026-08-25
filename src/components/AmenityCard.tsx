import { Link } from 'react-router-dom';
import type { AmenityItem } from '../data/amenities';
import Icon from './Icon';

/** Premium image card with hover-reveal description used on the Amenities listing. */
export default function AmenityCard({ item }: { item: Pick<AmenityItem, 'slug' | 'icon' | 'title' | 'blurb' | 'heroImage'> }) {
  return (
    <Link
      to={`/amenities/${item.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-card sm:aspect-[3/4]"
    >
      {item.heroImage ? (
        <img
          src={item.heroImage}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="h-full w-full bg-forest/20" />
      )}
      
      {/* Subtle brand overlay on hover */}
      <div className="absolute inset-0 bg-ink/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center pointer-events-none z-0">
        <img 
          src="/images/brand/icon-gold.png" 
          alt="" 
          className="w-16 h-16 opacity-0 translate-y-4 transition-all duration-500 delay-75 group-hover:opacity-90 group-hover:translate-y-0 drop-shadow-lg" 
        />
      </div>
      
      {/* Base dark gradient so the title is always visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent transition-colors group-hover:from-charcoal/95 z-0" />
      
      {/* Content wrapper */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-5 transition-transform duration-500 ease-out sm:translate-y-12 sm:group-hover:translate-y-0">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/20 text-cream backdrop-blur-sm">
            <Icon name={item.icon} className="h-4 w-4" />
          </span>
          <h3 className="font-serif text-xl text-cream">{item.title}</h3>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-cream/80 transition-opacity duration-500 sm:opacity-0 sm:group-hover:opacity-100">
          {item.blurb}
        </p>
      </div>
    </Link>
  );
}
