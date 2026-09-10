import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { subscribeNewsletter, useSettings } from '../hooks/usePublic';
import { site } from '../data/site';

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const discover = [
  { label: 'Our Story', to: '/about' },
  { label: 'Amenities', to: '/amenities' },
  { label: 'Stays', to: '/stays' },
  { label: 'Dining', to: '/dining' },
  { label: 'Events', to: '/events' },
];

const connect = [
  { label: 'Offers', to: '/offers' },
  { label: 'Plan an enquiry', to: '/reserve' },
  { label: 'Find your booking', to: '/find-booking' },
  { label: 'Guest sign in', to: '/sign-in' },
];

function Column({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <h3 className="tag-label !text-cream/50">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-base text-cream/75 transition-colors hover:text-cream"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return;
    setStatus('loading');
    try {
      await subscribeNewsletter(email);
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mt-12 border-t border-cream/10 pt-8">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-serif text-xl text-cream">Join our list</p>
          <p className="mt-1 text-base text-cream/60">
            Offers, seasonal packages and news — straight to your inbox. Unsubscribe anytime.
          </p>
        </div>
        {status === 'done' ? (
          <p className="text-sm text-cream/80">Thanks — you're on the list. ✦</p>
        ) : (
          <form onSubmit={submit} className="flex w-full max-w-sm gap-2 md:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
              className="min-w-0 flex-1 rounded-full border border-cream/20 bg-transparent px-4 py-2.5 text-base text-cream placeholder:text-cream/40 focus:border-cream/50 focus:outline-none md:w-64"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0 rounded-full bg-cream px-5 py-2.5 text-base font-medium text-charcoal transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === 'loading' ? '…' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
      {status === 'error' && <p className="mt-2 text-xs text-rose-300">Something went wrong — please try again.</p>}
    </div>
  );
}

export default function Footer() {
  const { data } = useSettings();
  const phone = (data?.contactPhone as string) || site.phone;
  const email = (data?.contactEmail as string) || site.email;
  const address = (data?.address as string) || site.address;
  const tagline = (data?.footerTagline as string) || site.footerTagline;
  const googleMapsUrl = (data?.googleMapsUrl as string) || `https://maps.google.com/?q=${encodeURIComponent(address)}`;

  const instagram = (data?.instagramUrl as string) || 'https://instagram.com/shraddhagarden';
  const facebook = (data?.facebookUrl as string) || 'https://facebook.com/shraddhagarden';
  const youtube = (data?.youtubeUrl as string) || 'https://youtube.com/@shraddhagarden';
  const tripadvisor = (data?.tripadvisorUrl as string);

  return (
    <footer className="bg-charcoal text-cream">
      <div className="container-pad py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link to="/" className="inline-block" aria-label={site.fullName}>
              <img 
                src="/images/brand/logo-light.png" 
                alt={site.fullName} 
                className="h-32 w-auto object-contain md:h-40" 
              />
            </Link>
            <p className="mt-5 text-base leading-relaxed text-cream/60">
              {tagline}
            </p>

            <div className="mt-8 space-y-3 text-base text-cream/75">
              <a
                href={telHref(phone)}
                className="flex items-center gap-2.5 transition-colors hover:text-cream"
              >
                <Icon name="phone" className="h-4 w-4 shrink-0 text-cream/50" />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2.5 transition-colors hover:text-cream"
              >
                <Icon name="mail" className="h-4 w-4 shrink-0 text-cream/50" />
                {email}
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 transition-colors hover:text-cream"
              >
                <Icon name="location" className="mt-0.5 h-4 w-4 shrink-0 text-cream/50" />
                <span>{address}</span>
              </a>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-3.5">
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-cream/80 transition-all hover:bg-cream/20 hover:text-cream"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
              {facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-cream/80 transition-all hover:bg-cream/20 hover:text-cream"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
              {youtube && (
                <a
                  href={youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-cream/80 transition-all hover:bg-cream/20 hover:text-cream"
                >
                  <svg className="h-4 w-4 fill-currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
              {tripadvisor && (
                <a
                  href={tripadvisor}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TripAdvisor"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-cream/80 transition-all hover:bg-cream/20 hover:text-cream text-xs font-bold"
                >
                  TA
                </a>
              )}
            </div>
          </div>
          <Column title="Discover" links={discover} />
          <Column title="Connect" links={connect} />
        </div>

        <NewsletterSignup />

        <div className="mt-14 flex flex-col gap-2 border-t border-cream/10 pt-6 text-xs text-cream/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {site.fullName}. Unforgettable Memories.</p>
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cream">
            {address}
          </a>
        </div>
      </div>
    </footer>
  );
}
