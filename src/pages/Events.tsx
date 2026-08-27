import { useState } from 'react';
import { Link } from 'react-router-dom';
import SectionEyebrow from '../components/SectionEyebrow';
import SectionHeading from '../components/SectionHeading';
import StepsBand from '../components/StepsBand';
import Reveal from '../components/Reveal';
import WordReveal from '../components/WordReveal';
import Button from '../components/Button';
import MarqueeBanner from '../components/MarqueeBanner';
import Icon from '../components/Icon';
import { images } from '../data/images';
import { eventGallery } from '../data/events';
import { useContentList } from '../hooks/usePublic';
import Seo from '../components/Seo';

export default function Events() {
  const [isLaughing, setIsLaughing] = useState(false);
  const { data, isLoading, error, refetch } = useContentList('event');
  const eventTypes = (data ?? []).map((e) => ({
    name: e.title,
    image: e.heroImage,
    blurb: e.excerpt,
  }));

  return (
    <>
  <Seo title="Events &amp; Celebrations" path="/events" />
      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate overflow-hidden pt-28 pb-16 md:pt-40 md:pb-24">
        <img
          src={images.wedding}
          alt="A garden wedding celebration"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-charcoal/70 via-charcoal/55 to-charcoal/75" />
        <div className="container-pad text-center text-cream">
          <Reveal>
            <SectionEyebrow tone="cream">Every occasion</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <WordReveal
              as="h1"
              className="mt-2 font-serif text-4xl leading-[1.05] text-cream sm:text-5xl md:text-6xl"
              text="Celebrations that linger long after the day"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cream/80 md:text-base">
              Weddings, birthdays, corporate offsites and family reunions — one
              garden, endlessly adaptable to your story.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <Button to="/reserve" variant="light" size="lg" className="mt-7" data-magnetic="0.4">
              Enquire about your event
              <Icon name="arrow" className="h-4 w-4" />
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Event types ---------------- */}
      <section className="container-pad py-16 md:py-24">
        <SectionHeading
          eyebrow="What we host"
          title="An occasion for every season"
          subtext="Whatever you’re marking, our team shapes the garden around it."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {isLoading &&
            [0, 1].map((i) => (
              <div key={i} className="aspect-[16/10] animate-pulse rounded-card bg-paper ring-1 ring-line/50" />
            ))}

          {error && (
            <div className="sm:col-span-2">
              <p className="text-center text-sm text-muted">
                We couldn't load the occasion types right now. Please try again in a moment.
              </p>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-deep"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && eventTypes.length === 0 && (
            <p className="text-center text-sm text-muted sm:col-span-2">
              Occasion details are being prepared — check back soon.
            </p>
          )}

          {!isLoading && !error &&
            eventTypes.map((e, i) => (
            <Reveal key={e.name} delay={(i % 2) * 0.08}>
              <article className="group relative overflow-hidden rounded-card">
                <img
                  src={e.image}
                  alt={e.name}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-serif text-2xl text-cream">{e.name}</h3>
                  <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-cream/80">
                    {e.blurb}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Gallery ---------------- */}
      <section className="bg-cream-2">
        <div className="container-pad py-16 md:py-24">
          <SectionHeading
            eyebrow="Moments"
            title="A garden full of memories"
          />
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3">
            {eventGallery.map((src, i) => (
              <Reveal
                key={src}
                delay={(i % 3) * 0.06}
                className={`overflow-hidden rounded-card ${
                  i === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : ''
                }`}
              >
                <img
                  src={src}
                  alt={`Celebration at Shraddha Garden ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Decorative Cutout ---------------- */}
      <div className="relative w-full h-0 z-10">
        <img
          src={isLaughing ? "/images/brand/girl-laughing.png" : "/images/brand/girl-sitting.png"}
          alt="Happy guest"
          onClick={() => setIsLaughing(!isLaughing)}
          className="absolute bottom-0 left-8 w-32 cursor-pointer drop-shadow-xl transition-all duration-500 hover:scale-105 active:scale-95 md:left-16 md:w-48 lg:left-32 lg:w-56"
        />
      </div>

      {/* ---------------- Steps ---------------- */}
      <StepsBand />

      {/* ---------------- Enquiry CTA ---------------- */}
      <section className="container-pad py-16 text-center md:py-24">
        <SectionHeading
          eyebrow="Let’s begin"
          title="Ready to plan your celebration?"
          subtext="Share a few details and a dedicated host will be in touch within a day."
        />
        <Reveal delay={0.1} className="mt-8">
          <Link
            to="/reserve"
            data-magnetic="0.35"
            className="inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 text-[0.95rem] font-medium text-cream transition-colors hover:bg-forest-deep"
          >
            Start your enquiry
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>

      <MarqueeBanner />
    </>
  );
}
