import type { DiningItem } from '../data/dining';
import { inr } from '../data/site';
import Pill from './Pill';

export default function DiningCard({ item }: { item: DiningItem }) {
  return (
    <article className="group overflow-hidden rounded-card bg-paper shadow-sm ring-1 ring-line/70">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Subtle brand overlay on hover */}
        <div className="absolute inset-0 bg-ink/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center pointer-events-none z-0">
          <img 
            src="/images/brand/icon-gold.png" 
            alt="" 
            className="w-16 h-16 opacity-0 translate-y-4 transition-all duration-500 delay-75 group-hover:opacity-90 group-hover:translate-y-0 drop-shadow-lg" 
          />
        </div>
        <span className="absolute left-3 top-3">
          <Pill tone="dark">{item.tag}</Pill>
        </span>
        <span className="absolute right-3 top-3">
          <Pill tone="light">{inr(item.price)}</Pill>
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-serif text-lg text-ink">{item.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {item.description}
        </p>
      </div>
    </article>
  );
}
