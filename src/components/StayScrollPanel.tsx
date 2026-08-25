import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { stays } from '../data/stays';
import Icon from './Icon';
import SectionHeading from './SectionHeading';

/**
 * Layer 2 — the signature sticky scroll panel.
 *
 * Left column is sticky; the right column scrolls one full-viewport
 * frame per stay. As each frame crosses the viewport centre, the left
 * panel cross-fades to that stay's details and a vertical progress bar
 * tracks position. Collapses to a stacked layout on mobile (CSS).
 *
 * Driven entirely by the real `stays` data — no placeholder content.
 */
export default function StayScrollPanel() {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const items = itemRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!items.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = items.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-20% 0px -20% 0px' },
    );
    items.forEach((it) => obs.observe(it));
    return () => obs.disconnect();
  }, []);

  const current = stays[active];
  const index = String(active + 1).padStart(2, '0');
  const chips = current.amenities.slice(0, 4).map((a) => a.label);

  return (
    <section className="scroll-panel-section bg-cream-2">
      <div className="container-pad pt-16 md:pt-24">
        <SectionHeading
          align="left"
          eyebrow="Rest in our"
          title="Signature stays"
          subtext="Scroll through our handcrafted retreats — from timber cabins to canopy-top suites — each a sanctuary of its own."
        />
      </div>
      <div className="scroll-panel-wrap">
        {/* LEFT — sticky detail panel */}
        <div className="sp-left">
          {/* key={active} restarts the cross-fade on every change */}
          <div className="sp-fade" key={active}>
            <div className="sp-index">{index}</div>
            <p className="sp-tag">{current.badge ?? 'Our Stays'}</p>
            <h2 className="sp-title">{current.name}</h2>
            <p className="sp-desc">{current.shortIntro}</p>
            <div className="sp-chips">
              {chips.map((c) => (
                <span className="sp-chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
            <p className="sp-meta">
              From <strong>₹{current.pricePerNight.toLocaleString('en-IN')}</strong>{' '}
              / night · {current.beds} · Sleeps {current.capacity}
            </p>
            <Link className="sp-cta" to={`/stays/${current.slug}`} data-cursor="View stay">
              Explore this stay
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>

          <div className="sp-track">
            <div
              className="sp-fill"
              style={{ height: `${((active + 1) / stays.length) * 100}%` }}
            />
          </div>
        </div>

        {/* RIGHT — one scrolling frame per stay */}
        <div className="sp-right">
          {stays.map((stay, i) => (
            <div
              key={stay.slug}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className={`sp-item ${i === active ? 'is-active' : ''}`}
            >
              <div className="sp-frame parallax-card">
                <img
                  className="parallax-img"
                  src={stay.heroImage}
                  alt={stay.name}
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
