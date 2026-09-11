import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import WordReveal from '../components/WordReveal';
import Button from '../components/Button';
import Icon from '../components/Icon';
import Pill from '../components/Pill';
import NotFound from './NotFound';
import { PublicError, PublicLoading } from '../components/PublicState';
import { getAmenity } from '../data/amenities';
import { useContentItem } from '../hooks/usePublic';
import Seo from '../components/Seo';

export default function AmenityDetail() {
  const { slug } = useParams();
  const fallback = slug ? getAmenity(slug) : undefined;
  const { data: dbItem, isLoading, isError, refetch } = useContentItem('amenity', slug);

  // Combine database content with static defaults so any admin change takes effect immediately
  const item = useMemo(() => {
    if (dbItem) {
      const meta = (dbItem.meta || {}) as Record<string, unknown>;
      const whatToExpect = (meta.whatToExpect as string[]) || fallback?.expect || [];
      const quickFacts = (meta.quickFacts as Record<string, unknown>) || {};
      return {
        title: dbItem.title,
        tag: dbItem.category || fallback?.tag || 'Amenity',
        heroImage: dbItem.heroImage || fallback?.heroImage || '',
        gallery: (dbItem.gallery && dbItem.gallery.length > 0) ? dbItem.gallery : (fallback?.gallery || []),
        description: dbItem.excerpt || fallback?.description || '',
        expect: whatToExpect,
        bestFor: (quickFacts.bestFor as string[]) || fallback?.bestFor || [],
        timings: (quickFacts.timings as string) || fallback?.timings || 'All Day',
        safetyNote: (quickFacts.safetyNote as string) || fallback?.safetyNote || 'Please follow resort safety guidelines.',
      };
    }
    return fallback;
  }, [dbItem, fallback]);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Lock body scroll and restore native cursor while lightbox is open
  useEffect(() => {
    if (selectedPhoto) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('in-lightbox');
      document.body.classList.remove('has-custom-cursor');
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.classList.remove('in-lightbox');
        document.body.classList.add('has-custom-cursor');
      };
    }
  }, [selectedPhoto]);

  if (isLoading && !fallback) {
    return (
      <section className="container-pad pt-32 pb-20">
        <PublicLoading label="Loading amenity…" />
      </section>
    );
  }

  if (isError && !fallback) {
    return (
      <section className="container-pad pt-32 pb-20">
        <PublicError onRetry={() => refetch()} />
      </section>
    );
  }

  if (!item) return <NotFound />;

  const [secondary, tertiary] = item.gallery;

  return (
    <section className="container-pad pt-24 pb-20 md:pt-32 md:pb-28">
  <Seo title="Amenities" path="/amenities" />
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Amenities', to: '/amenities' },
          { label: item.title },
        ]}
      />

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Pill tone="forest" className="mb-3">
            {item.tag}
          </Pill>
          <WordReveal
            as="h1"
            className="font-serif text-4xl text-ink md:text-5xl"
            text={item.title}
          />
        </div>
        <Button to="/reserve" variant="dark" size="sm" data-magnetic="0.25">
          Explore for yourself
        </Button>
      </div>

      {/* Gallery: large + 2 stacked with click to enlarge */}
      <div className="mt-6 grid gap-3 md:grid-cols-[1.7fr_1fr]">
        <div
          onClick={() => setSelectedPhoto(item.heroImage)}
          className="group cursor-pointer overflow-hidden rounded-card transition-opacity hover:opacity-95"
        >
          <img
            src={item.heroImage}
            alt={item.title}
            className="h-full max-h-[460px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="grid gap-3">
          <div
            onClick={() => setSelectedPhoto(secondary ?? item.heroImage)}
            className="group cursor-pointer overflow-hidden rounded-card transition-opacity hover:opacity-95"
          >
            <img
              src={secondary ?? item.heroImage}
              alt={`${item.title} detail`}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-full"
            />
          </div>
          <div
            onClick={() => setSelectedPhoto(tertiary ?? item.heroImage)}
            className="group cursor-pointer overflow-hidden rounded-card transition-opacity hover:opacity-95"
          >
            <img
              src={tertiary ?? item.heroImage}
              alt={`${item.title} ambience`}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-full"
            />
          </div>
        </div>
      </div>

      {/* Lightbox Modal in Portal */}
      {selectedPhoto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-lightbox="true"
            className="fixed inset-0 z-[99999] flex h-screen w-screen items-center justify-center bg-black/95 p-4 md:p-8 backdrop-blur-md cursor-default"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Close preview"
            >
              ✕
            </button>
            <img
              src={selectedPhoto}
              alt={item.title}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )}

      {/* Body + sidebar */}
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="font-serif text-lg leading-relaxed text-ink/90 md:text-xl">
            {item.description}
          </p>

          <h2 className="mt-12 font-serif text-2xl text-ink">What to expect</h2>
          <ul className="mt-5 space-y-3">
            {item.expect.map((e) => (
              <li key={e} className="flex items-start gap-3 text-sm text-ink md:text-base">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-cream">
                  <Icon name="check" className="h-3 w-3" />
                </span>
                {e}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Facts sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-line bg-paper p-6 shadow-sm">
            <h3 className="font-serif text-xl text-ink">Quick Facts</h3>

            <div className="mt-5">
              <p className="tag-label">Best for</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.bestFor.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-cream px-3 py-1 text-xs text-ink ring-1 ring-line"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="tag-label">Timings</p>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-ink">
                <Icon name="calendar" className="h-4 w-4 text-forest" />
                {item.timings}
              </p>
            </div>

            <div className="mt-5 rounded-lg bg-terracotta/10 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-terracotta">
                <Icon name="check" className="h-3.5 w-3.5" />
                Safety Note
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/80">
                {item.safetyNote}
              </p>
            </div>

            <Button to="/reserve" variant="forest" className="mt-6 w-full">
              <Icon name="phone" className="h-4 w-4" />
              Call to book
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
