import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SectionEyebrow from '../components/SectionEyebrow';
import AmenityCard from '../components/AmenityCard';
import Reveal from '../components/Reveal';
import WordReveal from '../components/WordReveal';
import Icon from '../components/Icon';
import { PublicError, PublicLoading } from '../components/PublicState';
import { useContentList } from '../hooks/usePublic';
import Seo from '../components/Seo';

// The three large alternating feature sections at the foot of the page.
const featureSlugs = ['swimming-pool', 'water-fall', 'camp-fire-with-dj'];

export default function Amenities() {
  const { data, isLoading, isError, refetch } = useContentList('amenity');
  const [filter, setFilter] = useState('All');

  // Map API content → the shape AmenityCard / feature sections expect.
  const amenities = useMemo(
    () =>
      (data ?? []).map((a) => ({
        slug: a.slug,
        title: a.title,
        category: a.category ?? 'All',
        icon: (a.icon ?? 'flower') as never,
        blurb: a.excerpt,
        description: a.excerpt,
        heroImage: a.heroImage,
      })),
    [data],
  );

  const amenityCategories = useMemo(
    () => ['All', ...Array.from(new Set(amenities.map((a) => a.category)))],
    [amenities],
  );

  const filtered = useMemo(
    () => (filter === 'All' ? amenities : amenities.filter((a) => a.category === filter)),
    [filter, amenities],
  );

  const features = featureSlugs
    .map((s) => amenities.find((a) => a.slug === s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  if (isLoading)
    return (
      <section className="container-pad pt-36 pb-20">
    <Seo title="Amenities" path="/amenities" />
        <PublicLoading label="Loading amenities…" />
      </section>
    );
  if (isError)
    return (
      <section className="container-pad pt-36 pb-20">
        <PublicError onRetry={() => refetch()} />
      </section>
    );

  return (
    <>
      {/* ---------------- Header ---------------- */}
      <section className="container-pad pt-28 pb-10 md:pt-36">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <SectionEyebrow>Enjoy our</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <WordReveal
              as="h1"
              className="mt-2 font-serif text-4xl leading-tight text-ink md:text-[3.2rem]"
              text="Sixteen attractions, one garden"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-base">
              Discover a world of experiences woven seamlessly into our lush
              botanical sanctuary. From tranquil waters to lively games.
            </p>
          </Reveal>
        </div>

        {/* Filter tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {amenityCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                filter === cat
                  ? 'bg-forest text-cream'
                  : 'border border-line text-ink hover:border-forest'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ---------------- Grid ---------------- */}
      <section className="container-pad pb-20">
        <motion.div layout className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.div
                key={item.slug}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <AmenityCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ---------------- Alternating feature sections ---------------- */}
      {features.map((item, i) => (
        <section
          key={item.slug}
          className={`grid md:grid-cols-2 ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}
        >
          <div className="parallax-card relative min-h-[280px] md:min-h-[440px]">
            <img
              src={item.heroImage}
              alt={item.title}
              loading="lazy"
              className="parallax-img h-full w-full object-cover"
            />
          </div>
          <div className="flex items-center bg-[#5b5b54] text-cream">
            <Reveal className="container-pad max-w-xl py-12 md:py-16">
              <SectionEyebrow align="left" tone="cream">
                Featured
              </SectionEyebrow>
              <h2 className="mt-2 font-serif text-3xl text-cream md:text-4xl">
                {item.title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-cream/80 md:text-base">
                {item.description}
              </p>
              <Link
                to={`/amenities/${item.slug}`}
                data-magnetic="0.2"
                className="link-underline mt-6 inline-flex text-sm text-cream"
              >
                Explore for yourself
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </section>
      ))}
    </>
  );
}
