import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { useBanners } from '../hooks/usePublic';

/** Dismissible, rotating announcement bar driven by ANNOUNCEMENT banners. */
export default function AnnouncementBar() {
  const { data } = useBanners('ANNOUNCEMENT');
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('sg.annDismiss') === '1');
  const [index, setIndex] = useState(0);

  const items = data ?? [];

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [items.length]);

  if (dismissed || items.length === 0) return null;
  const ann = items[index % items.length];

  return (
    <div className="bg-forest text-cream">
      <div className="container-pad flex h-9 items-center justify-center gap-3 text-center text-xs">
        <p className="truncate">
          {ann.title}
          {ann.ctaLabel && ann.ctaHref && (
            <Link to={ann.ctaHref} className="ml-2 underline underline-offset-2 hover:text-cream/80">
              {ann.ctaLabel}
            </Link>
          )}
        </p>
        <button
          onClick={() => {
            sessionStorage.setItem('sg.annDismiss', '1');
            setDismissed(true);
          }}
          aria-label="Dismiss announcement"
          className="absolute right-4 text-cream/70 hover:text-cream"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
