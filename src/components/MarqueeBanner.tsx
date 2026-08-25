import { Link } from 'react-router-dom';
import Icon from './Icon';
import styles from './MarqueeBanner.module.css';

interface MarqueeBannerProps {
  text?: string;
  /** Where the "Enquire Now" button links to. */
  to?: string;
}

/**
 * Dark CTA banner with large serif scrolling text, shown above the footer on
 * detail pages.
 *
 * Layout: the marquee text and the "Enquire Now" button live in a single flex
 * container so the button is vertically centered and right-aligned on desktop,
 * and stacks centered below the text on mobile. Because the button sits in
 * normal flow (not absolutely positioned), it can never bleed into the footer.
 */
export default function MarqueeBanner({
  text = 'BOOK YOUR CELEBRATION!',
  to = '/reserve',
}: MarqueeBannerProps) {
  // Repeat enough times to fill very wide screens; duplicated set scrolls -50%.
  const items = Array.from({ length: 8 });

  return (
    <section className="w-full bg-charcoal py-10 text-cream md:py-14">
      <div className="container-pad flex flex-col items-center gap-6 md:flex-row md:gap-10">
        {/* Scrolling text — takes the available width, clips its overflow */}
        <div className={`${styles.viewport} min-w-0 flex-1`} aria-hidden="true">
          <div className={styles.track}>
            {[0, 1].map((set) => (
              <div key={set} className="flex">
                {items.map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.item} font-serif text-3xl text-cream/90 md:text-5xl`}
                  >
                    {text}
                    <span className="ml-12 text-terracotta">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Button: right-aligned + vertically centered on desktop (flex row),
            centered below the text on mobile (flex column). */}
        <div className="flex shrink-0 justify-center md:justify-end">
          <Link
            to={to}
            className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-ink shadow-lg transition-transform hover:scale-[1.03]"
          >
            Enquire Now
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
