import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import SectionEyebrow from '../components/SectionEyebrow';
import SectionHeading from '../components/SectionHeading';
import StepsBand from '../components/StepsBand';
import StayScrollPanel from '../components/StayScrollPanel';
import DiningCard from '../components/DiningCard';
import Icon from '../components/Icon';
import { images } from '../data/images';
import { amenities } from '../data/amenities';
import { useContentList } from '../hooks/usePublic';
import Seo from '../components/Seo';

const heroCards = [
  { src: images.gardenPool, alt: 'Shraddha Garden glowing entrance sign' },
  { src: images.waterfall, alt: 'Girl in a pink dress on a garden swing' },
  { src: images.portrait, alt: 'Italian family group portrait' },
];

const traditionPoints = [
  'Acres of manicured, lush green gardens',
  'Rooted in authentic Tamil hospitality',
  'Stays, dining and celebration — all on-site',
  'A dedicated host for every occasion',
];

const stats = [
  { value: '40+', label: 'Acres of greenery' },
  { value: '16', label: 'Unique amenities' },
  { value: '3', label: 'Signature kitchens' },
  { value: '1k+', label: 'Events celebrated' },
];

// First eight amenities form the "Sixteen ways to unwind" preview grid.
const unwind = amenities.slice(0, 8);

export default function Home() {
  const { data: diningExperiences } = useContentList('dining');

  return (
    <>
      <Seo title="Shraddha Garden Resort — Celebrate amidst lush greenery" path="/" />
      {/* ---------------- Hero ---------------- */}
      <section className="container-pad pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <SectionEyebrow>Celebrate</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              data-word-reveal
              className="mt-3 font-serif text-4xl leading-[1.05] text-ink sm:text-5xl md:text-6xl"
            >
              Celebrate amidst lush
              <br className="hidden sm:block" /> green gardens
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted md:text-base">
              A sanctuary of celebration and stays, where every milestone unfolds
              amidst forty acres of botanical beauty and timeless Tamil warmth.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-5">
              <Button to="/reserve" variant="forest" size="lg" data-magnetic="0.4">
                Reserve your date
              </Button>
              <Link
                to="/amenities"
                data-magnetic="0.2"
                className="link-underline text-sm font-medium text-ink"
              >
                Explore the garden
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Hero image row */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 md:mt-16">
          {heroCards.map((c, i) => (
            <motion.div
              key={c.alt}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`overflow-hidden rounded-card ${
                i === 1 ? 'sm:mt-8' : ''
              }`}
            >
              <img
                src={c.src}
                alt={c.alt}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="aspect-[3/4] w-full object-cover sm:aspect-[3/4]"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- Stats Band & Branding Graphic ---------------- */}
      <section className="relative overflow-hidden bg-forest text-cream pt-16 pb-12 md:pt-24 md:pb-16">
        <div 
          className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none" 
          style={{ backgroundImage: 'url(/images/brand/brand-pattern.png)', backgroundSize: '240px' }}
        />
        <div className="container-pad relative z-10">
          {/* Branding Graphic */}
          <Reveal className="flex justify-center mb-16 md:mb-24">
            <img 
              src="/images/brand/i-love-shraddha-graphic.png" 
              alt="I Love Shraddha Garden" 
              loading="lazy"
              className="w-full max-w-4xl object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
            />
          </Reveal>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-y-10 gap-x-4 md:grid-cols-4 md:gap-8">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1} className="flex flex-col items-center text-center">
                <span className="font-serif text-4xl md:text-5xl lg:text-[4rem]">{s.value}</span>
                <span className="mt-3 text-xs text-cream/80 uppercase tracking-widest md:text-sm">{s.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Tradition feature band ---------------- */}
      <section className="container-pad py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionEyebrow align="left">Discover</SectionEyebrow>
            <h2 className="mt-2 font-serif text-3xl leading-tight text-ink md:text-[2.6rem]">
              Your ultimate getaway, rooted in Tamil tradition
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              From thatched kudil cottages to a glassy garden pool, every corner
              of Shraddha Garden is designed to feel both luxurious and deeply
              rooted in the land it grows from.
            </p>
            <ul className="mt-6 space-y-3">
              {traditionPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-cream">
                    <Icon name="check" className="h-3 w-3" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <Button to="/about" variant="ghost" className="mt-7 !px-0">
              Read our story
              <Icon name="arrow" className="h-4 w-4" />
            </Button>
          </Reveal>

          {/* Image collage */}
          <Reveal className="grid grid-cols-2 gap-4">
            <img
              src={images.lushGarden}
              alt="Outdoor event decoration"
              loading="lazy"
              className="aspect-[3/4] w-full rounded-card object-cover"
            />
            <div className="mt-8 grid gap-4">
              <img
                src={images.gardenPath}
                alt="Family gathering with balloons"
                loading="lazy"
                className="aspect-square w-full rounded-card object-cover"
              />
              <img
                src={images.swimmingPool}
                alt="Guests enjoying the swimming pool"
                loading="lazy"
                className="aspect-square w-full rounded-card object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Featured stays (sticky scroll panel) ---------------- */}
      <StayScrollPanel />

      {/* ---------------- Sixteen ways to unwind ---------------- */}
      <section className="bg-cream-2">
        <div className="container-pad py-16 md:py-24">
          <SectionHeading
            eyebrow="Enjoy our"
            title="Sixteen ways to unwind"
            subtext="From sunrise yoga to bonfire nights, the garden offers an attraction for every mood and every guest."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4" data-reveal-stagger>
            {unwind.map((a, i) => (
              <Reveal key={a.slug} delay={(i % 4) * 0.06}>
                <Link
                  to={`/amenities/${a.slug}`}
                  className="group relative block overflow-hidden rounded-card"
                >
                  <img
                    src={a.heroImage}
                    alt={a.title}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3.5">
                    <Icon name={a.icon} className="h-4 w-4 text-cream/90" />
                    <span className="font-serif text-sm text-cream md:text-base">
                      {a.title}
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button to="/amenities" variant="outline" className="text-ink">
              View all sixteen
              <Icon name="arrow" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ---------------- Three easy steps ---------------- */}
      <StepsBand />

      {/* ---------------- Food on premise ---------------- */}
      <section className="container-pad py-16 md:py-24">
        <SectionHeading
          eyebrow="Enjoy our"
          title="Food provided on premise"
          subtext="Live kitchens, banana-leaf feasts and worldly spreads — dining is woven into every celebration."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3" data-reveal-stagger>
          {diningExperiences?.map((d, i) => (
            <Reveal key={d.slug} delay={i * 0.08}>
              <DiningCard item={d} />
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button to="/dining" variant="ghost">
            See the full dining experience
            <Icon name="arrow" className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
}
