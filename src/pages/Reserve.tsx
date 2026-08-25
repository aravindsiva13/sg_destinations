import { useState } from 'react';
import SectionEyebrow from '../components/SectionEyebrow';
import Reveal from '../components/Reveal';
import { motion } from 'framer-motion';
import Stepper from '../components/Stepper';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { createEnquiry, useStays } from '../hooks/usePublic';
import { apiErrorMessage } from '../lib/publicApi';
import { site } from '../data/site';
import Seo from '../components/Seo';

const occasions = ['Wedding', 'Birthday', 'Corporate', 'Get-together', 'Just a stay'];

const field =
  'w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-all focus:border-forest focus:ring-2 focus:ring-forest/30';

export default function Reserve() {
  const { data: stays } = useStays();
  const [guests, setGuests] = useState(2);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', phone: '', email: '', occasion: '', stayType: '', message: '' });
  const set = <K extends keyof typeof f>(k: K, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createEnquiry({
        name: f.name,
        email: f.email,
        phone: f.phone || undefined,
        occasion: f.occasion || undefined,
        guests,
        message: [f.stayType ? `Stay: ${f.stayType}` : null, f.message].filter(Boolean).join(' · ') || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send your enquiry'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container-pad pt-28 pb-20 md:pt-36 md:pb-28">
  <Seo title="Plan Your Event" path="/reserve" />
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <SectionEyebrow align="left">Reserve</SectionEyebrow>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink md:text-[3.2rem]">
            Begin your celebration
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted md:text-base">
            Tell us a little about your plans and our team will confirm availability, share a tailored
            quote and help you shape the day.
          </p>

          <ul className="mt-8 space-y-4">
            <li className="flex items-center gap-3 text-sm text-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest/10 text-forest">
                <Icon name="phone" className="h-4 w-4" />
              </span>
              {site.phone}
            </li>
            <li className="flex items-center gap-3 text-sm text-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest/10 text-forest">
                <Icon name="dining" className="h-4 w-4" />
              </span>
              {site.email}
            </li>
            <li className="flex items-center gap-3 text-sm text-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest/10 text-forest">
                <Icon name="location" className="h-4 w-4" />
              </span>
              {site.address}
            </li>
          </ul>

          <p className="mt-8 text-sm text-muted">
            Looking to book a room?{' '}
            <a href="/book" className="text-terracotta underline">
              Check live availability →
            </a>
          </p>
        </div>

        <Reveal>
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="grid h-full place-items-center rounded-card border border-line bg-paper p-8 text-center"
            >
              <div>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                  className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest text-cream"
                >
                  <Icon name="check" className="h-6 w-6" />
                </motion.span>
                <h2 className="mt-5 font-serif text-2xl text-ink">Enquiry received</h2>
                <p className="mt-2 max-w-sm text-sm text-muted">
                  Thank you, {f.name || 'there'}! We’ll be in touch within a day to plan the details.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} className="rounded-card border border-line bg-paper p-6 shadow-sm md:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="tag-label">Full name</span>
                  <input required className={field} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="tag-label">Phone</span>
                  <input type="tel" className={field} value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="tag-label">Email</span>
                  <input type="email" required className={field} value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="tag-label">Occasion</span>
                  <select className={field} value={f.occasion} onChange={(e) => set('occasion', e.target.value)}>
                    <option value="">Select…</option>
                    {occasions.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="tag-label">Stay type</span>
                  <select className={field} value={f.stayType} onChange={(e) => set('stayType', e.target.value)}>
                    <option value="">No stay required</option>
                    {stays?.map((s) => (
                      <option key={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </label>

                <div className="rounded-lg border border-line px-3.5 py-2.5 sm:col-span-2">
                  <Stepper value={guests} onChange={setGuests} max={500} label="Approx. guests" />
                </div>

                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="tag-label">Anything else?</span>
                  <textarea rows={3} className={`${field} resize-none`} value={f.message} onChange={(e) => set('message', e.target.value)} placeholder="Tell us about your celebration…" />
                </label>
              </div>

              {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

              <Button type="submit" variant="forest" size="lg" className="mt-6 w-full">
                {busy ? 'Sending…' : 'Send enquiry'}
              </Button>
              <p className="mt-3 text-center text-xs text-muted">
                No charge to enquire · We’ll confirm availability before anything else.
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
