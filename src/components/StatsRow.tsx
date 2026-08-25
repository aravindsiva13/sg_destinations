import { stats } from '../data/team';
import Reveal from './Reveal';

/** Dark band of large numbers with labels, used on the About page. */
export default function StatsRow() {
  return (
    <section className="bg-charcoal text-cream">
      <div className="container-pad grid grid-cols-2 gap-y-10 py-14 md:grid-cols-4 md:py-16">
        {stats.map((s, i) => {
          // Animate values that are a single number + optional suffix
          // (e.g. "40+", "16", "100%"). Mixed values like "24/7" stay static.
          const m = /^(\d+)([^\d]*)$/.exec(s.value);
          return (
            <Reveal
              key={s.label}
              delay={i * 0.08}
              className="text-center md:border-r md:border-cream/10 md:last:border-r-0"
            >
              <p className="font-serif text-4xl text-cream md:text-5xl">
                {m ? (
                  <span data-counter={m[1]} data-counter-suffix={m[2]}>
                    0{m[2]}
                  </span>
                ) : (
                  s.value
                )}
              </p>
              <p className="tag-label mt-2 !text-cream/55">{s.label}</p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
