import { Link } from 'react-router-dom';
import SectionEyebrow from '../components/SectionEyebrow';
import Reveal from '../components/Reveal';
import WordReveal from '../components/WordReveal';
import Icon from '../components/Icon';
import Pill from '../components/Pill';
import { PublicEmpty, PublicError, PublicLoading } from '../components/PublicState';
import { useContentList } from '../hooks/usePublic';
import Seo from '../components/Seo';

export default function Offers() {
  const { data, isLoading, isError, refetch } = useContentList('offer');

  return (
    <section className="container-pad pt-28 pb-20 md:pt-36 md:pb-28">
  <Seo title="Offers" path="/offers" />
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <SectionEyebrow>Special offers</SectionEyebrow>
        </Reveal>
        <Reveal delay={0.05}>
          <WordReveal
            as="h1"
            className="mt-2 font-serif text-4xl leading-tight text-ink md:text-[3.2rem]"
            text="Packages worth celebrating"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">
            Thoughtfully curated stays and experiences for every occasion.
          </p>
        </Reveal>
      </div>

      {isLoading ? (
        <PublicLoading label="Loading offers…" />
      ) : isError ? (
        <PublicError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <PublicEmpty message="No offers right now — check back soon." />
      ) : (
        <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((o, i) => (
            <Reveal key={o.id} delay={(i % 3) * 0.08}>
              <article className="group flex flex-col overflow-hidden rounded-card border border-line bg-paper">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={o.heroImage}
                    alt={o.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {o.priceLabel && (
                    <span className="absolute right-3 top-3">
                      <Pill tone="light">{o.priceLabel}</Pill>
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {o.category && <span className="tag-label">{o.category}</span>}
                  <h3 className="mt-1 font-serif text-xl text-ink">{o.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted">{o.excerpt}</p>
                  <Link to="/book" data-magnetic="0.2" className="link-underline mt-4 text-sm text-terracotta">
                    Book this package
                    <Icon name="arrow" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
