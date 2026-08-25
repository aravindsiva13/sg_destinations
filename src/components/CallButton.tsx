import Icon from './Icon';
import { useSettings } from '../hooks/usePublic';
import { site } from '../data/site';

/** Strip spaces/dashes so the tel: link dials correctly. */
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/**
 * A persistent, always-visible contact pill shown on every public screen so a
 * guest can reach the resort directly at any moment — the number never scrolls
 * away, so we never lose the lead. Full number on desktop; a compact call chip
 * on mobile. Number is admin-editable via Settings (falls back to site.ts).
 */
export default function CallButton() {
  const { data } = useSettings();
  const phone = (data?.contactPhone as string) || site.phone;

  return (
    <a
      href={telHref(phone)}
      aria-label={`Call ${site.name} at ${phone}`}
      className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-full border border-forest-deep/20 bg-forest px-4 py-3 text-cream shadow-lg shadow-forest/25 transition-all hover:bg-forest-deep hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:px-5"
    >
      <Icon name="phone" className="h-5 w-5 shrink-0" />
      <span className="flex flex-col leading-tight">
        <span className="hidden text-[0.6rem] uppercase tracking-[0.18em] text-cream/60 sm:block">
          Call us
        </span>
        <span className="hidden text-sm font-medium sm:block">{phone}</span>
      </span>
    </a>
  );
}
