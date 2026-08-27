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
              {site.footerTagline}
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
              <p className="flex items-start gap-2.5">
                <Icon name="location" className="mt-0.5 h-4 w-4 shrink-0 text-cream/50" />
                <span>{address}</span>
              </p>
            </div>
          </div>
          <Column title="Discover" links={discover} />
          <Column title="Connect" links={connect} />
        </div>

        <NewsletterSignup />

        <div className="mt-14 flex flex-col gap-2 border-t border-cream/10 pt-6 text-xs text-cream/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {site.fullName}. Unforgettable Memories.</p>
          <p>{address}</p>
        </div>
      </div>
    </footer>
  );
}
