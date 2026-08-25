import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import WordReveal from '../components/WordReveal';
import Gallery from '../components/Gallery';
import Accordion from '../components/Accordion';
import BookingWidget from '../components/BookingWidget';
import MarqueeBanner from '../components/MarqueeBanner';
import Icon from '../components/Icon';
import Pill from '../components/Pill';
import ReviewSection from '../components/ReviewSection';
import NotFound from './NotFound';
import { PublicError, PublicLoading } from '../components/PublicState';
import { useStay } from '../hooks/usePublic';
import Seo from '../components/Seo';

const policyItems = [
  {
    title: 'Check-in / Check-out',
    content:
      'Check-in from 02:00 PM, check-out by 11:00 AM. Early check-in and late check-out are subject to availability — just ask your host.',
  },
  {
    title: 'Dining',
    content:
      'Breakfast is included with every stay. In-room dining and access to the garden restaurant are available through the day.',
  },
  {
    title: 'Quiet Hours',
    content:
      'Quiet hours are observed between 10:30 PM and 06:30 AM to keep the garden restful for every guest.',
  },
];

export default function StayDetail() {
  const { slug } = useParams();
  const { data: stay, isLoading, isError, refetch } = useStay(slug);

  if (isLoading) {
    return (
      <section className="container-pad pt-32 pb-20">
        <PublicLoading label="Loading stay…" />
      </section>
    );
  }
  if (isError) {
    return (
      <section className="container-pad pt-32 pb-20">
        <PublicError onRetry={() => refetch()} />
      </section>
    );
  }
  if (!stay) return <NotFound />;

  const extraPhotos = Math.max(0, stay.gallery.length - 4);

  return (
    <>
      <Seo title={`${stay.name} · Shraddha Garden`} description={stay.shortIntro} path={`/stays/${slug}`} />
      <section className="container-pad pt-24 pb-16 md:pt-32">
        <Breadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Stays', to: '/stays' },
            { label: stay.name },
          ]}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <WordReveal
            as="h1"
            className="font-serif text-4xl text-ink md:text-5xl"
            text={stay.name}
          />
          {stay.badge && <Pill tone="forest">{stay.badge}</Pill>}
          <span className="inline-flex items-center gap-1 text-sm text-ink">
            <Icon name="star" className="h-4 w-4 text-terracotta" />
            {stay.rating.toFixed(1)}
          </span>
        </div>

        {/* Gallery */}
        <div className="mt-6">
          <Gallery
            hero={stay.heroImage}
            thumbs={stay.gallery}
            alt={stay.name}
            extraPhotos={extraPhotos}
          />
        </div>

        {/* Body + booking */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="font-serif text-2xl text-ink">About this stay</h2>
            {stay.description.map((p) => (
              <p key={p} className="mt-4 text-sm leading-relaxed text-muted md:text-base">
                {p}
              </p>
            ))}

            {/* Amenities */}
            <h3 className="tag-label mt-10">Amenities</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {stay.amenities.map((a) => (
                <div key={a.label} className="flex items-center gap-2.5 text-sm text-ink">
                  <Icon name={a.icon} className="h-5 w-5 text-forest" />
                  {a.label}
                </div>
              ))}
            </div>

            {/* Policy accordions */}
            <div className="mt-10">
              <h3 className="tag-label mb-2">Good to know</h3>
              <Accordion items={policyItems} />
            </div>

            {/* Location callout */}
            <div className="mt-10 flex items-center gap-4 rounded-card border border-line p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest/10 text-forest">
                <Icon name="location" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">Inside the garden</p>
                <p className="mt-0.5 text-xs text-muted">
                  Coimbatore, Tamil Nadu — a short walk from the main lawn. Your host will
                  confirm the exact meeting point on the day of arrival.
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Shraddha Garden Coimbatore Tamil Nadu')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:text-forest-deep"
                >
                  Get directions
                  <Icon name="arrow" className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <BookingWidget
            stayId={stay.id}
            pricePerNight={stay.pricePerNight}
            stayName={stay.name}
            capacity={stay.capacity}
          />
        </div>

        <div className="mt-12 max-w-2xl">
          <ReviewSection stayId={stay.id} />
        </div>
      </section>

      <MarqueeBanner />
    </>
  );
}
