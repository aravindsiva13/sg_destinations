import Reveal from '../components/Reveal';
import WordReveal from '../components/WordReveal';
import SectionEyebrow from '../components/SectionEyebrow';
import StatsRow from '../components/StatsRow';
import StepsBand from '../components/StepsBand';
import MarqueeBanner from '../components/MarqueeBanner';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { images } from '../data/images';
import { handledOnSite } from '../data/team';
import Seo from '../components/Seo';

const introBlocks = [
  {
    eyebrow: 'Built upon luxury',
    body: 'Shraddha Garden was conceived as a place where understated luxury meets the living landscape — a retreat that feels generous, grounded and unmistakably ours.',
  },
  {
    eyebrow: 'Peace, greenery, beauty',
    body: 'Forty acres of manicured gardens, flowering borders and quiet water features create a sanctuary that calms the moment you arrive.',
  },
  {
    eyebrow: 'A canvas for legacies',
    body: 'From weddings to milestone birthdays, the garden becomes the backdrop for the memories your family will return to for years.',
  },
];

const hosts = [
  {
    icon: 'star' as const,
    title: 'Your celebration host',
    text: 'One dedicated host owns your day from the first call to the final farewell — availability, planning and on-site coordination.',
  },
  {
    icon: 'dining' as const,
    title: 'Chef & live kitchens',
    text: 'Meals are cooked fresh on site. Menus are shaped together around your guests, your occasion and the season.',
  },
  {
    icon: 'check' as const,
    title: 'Grounds & concierge',
    text: 'Housekeeping, valet, security and a garden crew that keeps every corner welcoming, around the clock.',
  },
];

export default function About() {
  return (
    <>
  <Seo title="About Shraddha Garden" path="/about" />
      {/* ---------------- Hero ---------------- */}
      <section className="container-pad pt-28 pb-12 md:pt-36 md:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionEyebrow align="left">Our sanctuary</SectionEyebrow>
            <WordReveal
              as="h1"
              className="mt-3 font-serif text-4xl leading-[1.05] text-ink sm:text-5xl md:text-[3.5rem]"
              text="A garden built for togetherness"
            />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted md:text-base">
              What began as a stretch of coconut grove is today a sanctuary of
              celebration and stays — a place designed, quite simply, for people
              to come together.
            </p>
          </div>

          {/* Overlapping framed photos */}
          <Reveal className="relative mx-auto h-[320px] w-full max-w-md md:h-[420px]">
            <img
              src={images.gardenPath}
              alt="A symmetrical garden path"
              className="absolute left-0 top-6 h-[78%] w-[70%] rounded-card border-8 border-paper object-cover shadow-xl"
            />
            <img
              src={images.verticalGarden}
              alt="A vertical garden wall"
              className="absolute bottom-0 right-0 h-[62%] w-[52%] rounded-card border-8 border-paper object-cover shadow-2xl"
            />
          </Reveal>
        </div>
      </section>

      {/* ---------------- Intro blocks + vertical garden ---------------- */}
      <section className="container-pad pb-16 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
          <div className="order-2 grid gap-10 lg:order-1">
            {introBlocks.map((b, i) => (
              <Reveal key={b.eyebrow} delay={i * 0.08} className="max-w-md">
                <SectionEyebrow align="left">{b.eyebrow}</SectionEyebrow>
                <p className="mt-2 text-base leading-relaxed text-ink/85">
                  {b.body}
                </p>
              </Reveal>
            ))}
          </div>
          <Reveal className="order-1 lg:order-2">
            <img
              src={images.verticalGarden}
              alt="A lush vertical garden"
              loading="lazy"
              className="h-full max-h-[560px] w-full rounded-card object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <StatsRow />

      {/* ---------------- Everything handled on-site ---------------- */}
      <section className="bg-charcoal-2 text-cream">
        <div className="container-pad py-16 md:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl text-cream md:text-[2.6rem]">
              Everything handled on-site
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cream/60">
              One team, one location, every detail. From the first enquiry to the
              final farewell, we take care of it all so you don’t have to.
            </p>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl gap-x-10 gap-y-4 sm:grid-cols-2">
            {handledOnSite.map((item, i) => (
              <Reveal
                key={item}
                delay={(i % 2) * 0.05}
                className="flex items-center gap-3 border-b border-cream/10 pb-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream/10 text-terracotta">
                  <Icon name="check" className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-cream/85">{item}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Three easy steps ---------------- */}
      <StepsBand />

      {/* ---------------- On-site hosts ---------------- */}
      <section className="container-pad py-16 md:py-24">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <SectionEyebrow align="left">The people</SectionEyebrow>
            <h2 className="mt-2 font-serif text-3xl text-ink md:text-[2.6rem]">
              The people behind your day
            </h2>
          </div>
          <Button to="/reserve" variant="ghost" data-magnetic="0.3">
            Plan with us
            <Icon name="arrow" className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hosts.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.08}>
              <div className="h-full rounded-card border border-line bg-paper p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/10 text-forest">
                  <Icon name={h.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-serif text-xl text-ink">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{h.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <MarqueeBanner />
    </>
  );
}
