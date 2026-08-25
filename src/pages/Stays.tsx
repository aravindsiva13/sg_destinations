import { useMemo, useState } from 'react';
import SectionEyebrow from '../components/SectionEyebrow';
import StayCard from '../components/StayCard';
import Reveal from '../components/Reveal';
import WordReveal from '../components/WordReveal';
import Icon from '../components/Icon';
import { PublicError, StaysGridSkeleton } from '../components/PublicState';
import { useStays } from '../hooks/usePublic';
import Seo from '../components/Seo';

type SortKey = 'Recommended' | 'Price: Low to High' | 'Price: High to Low' | 'Top Rated';

const sortOptions: SortKey[] = [
  'Recommended',
  'Price: Low to High',
  'Price: High to Low',
  'Top Rated',
];

export default function Stays() {
  const [sort, setSort] = useState<SortKey>('Recommended');
  const { data: stays, isLoading, isError, refetch } = useStays();

  const sorted = useMemo(() => {
    const list = [...(stays ?? [])];
    switch (sort) {
      case 'Price: Low to High':
        return list.sort((a, b) => a.pricePerNight - b.pricePerNight);
      case 'Price: High to Low':
        return list.sort((a, b) => b.pricePerNight - a.pricePerNight);
      case 'Top Rated':
        return list.sort((a, b) => b.rating - a.rating);
      default:
        return list;
    }
  }, [sort, stays]);

  return (
    <section className="container-pad pt-28 pb-20 md:pt-36 md:pb-28">
  <Seo title="Stays &amp; Cottages" path="/stays" />
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <SectionEyebrow>Stay over</SectionEyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <WordReveal
            as="h1"
            className="mt-2 font-serif text-4xl leading-tight text-ink md:text-[3.2rem]"
            text="Comfortable rooms inside the garden"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">
            Spacious venue with comfortable accommodation facilities available.
          </p>
        </Reveal>
      </div>

      {/* Sort bar */}
      <div className="mt-12 flex items-center justify-between border-y border-line py-3">
        <span className="tag-label">{sorted.length} stays</span>
        {/* (sort control below) */}
        <label className="flex items-center gap-2 text-sm text-muted">
          Sort by:
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="appearance-none rounded-full border border-line bg-paper py-1.5 pl-3 pr-8 text-sm text-ink outline-none transition-colors hover:border-forest"
            >
              {sortOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <Icon
              name="chevron"
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
          </div>
        </label>
      </div>

      {/* Grid */}
      {isLoading ? (
        <StaysGridSkeleton />
      ) : isError ? (
        <PublicError onRetry={() => refetch()} />
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((stay, i) => (
            <Reveal key={stay.slug} delay={(i % 3) * 0.08}>
              <StayCard stay={stay} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
