import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import AdminButton from '../components/ui/AdminButton';
import { Field, inputCls } from '../components/ui/Field';
import ImagePicker from '../components/ui/ImagePicker';
import { ErrorState, LoadingState } from '../components/ui/DataState';
import { useSaveSettings, useSettings } from '../lib/queries';
import { apiErrorMessage } from '../lib/apiClient';

interface HeroCard {
  src: string;
  alt: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface IntroBlock {
  eyebrow: string;
  body: string;
}

interface HostItem {
  icon: string;
  title: string;
  text: string;
}

interface PageContentForm {
  // Home
  homeHeadline?: string;
  homeSubtext?: string;
  homeHeroCards?: HeroCard[];
  homeStats?: StatItem[];
  homeTraditionTitle?: string;
  homeTraditionSubtext?: string;
  homeTraditionPoints?: string[];
  homeTraditionImages?: string[];

  // About
  aboutHeroTitle?: string;
  aboutHeroSubtext?: string;
  aboutHeroImages?: string[];
  aboutIntroBlocks?: IntroBlock[];
  aboutHosts?: HostItem[];
  aboutHandledOnSite?: string[];

  // Page Hero Banners
  eventsHeroImage?: string;
  diningHeroImage1?: string;
  diningHeroImage2?: string;
  amenitiesHeroBanner?: string;
}

type TabKey = 'home' | 'about' | 'banners';

export default function PageContentManager() {
  const { data, isLoading, isError, refetch } = useSettings();
  const saveMut = useSaveSettings();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [form, setForm] = useState<PageContentForm | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data && !form) {
      setForm(data as unknown as PageContentForm);
    }
  }, [data, form]);

  const set = <K extends keyof PageContentForm>(k: K, v: PageContentForm[K]) =>
    setForm((p) => (p ? { ...p, [k]: v } : p));

  async function save() {
    if (!form) return;
    setError(null);
    setSaved(false);
    try {
      await saveMut.mutateAsync(form as Record<string, unknown>);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save page content'));
    }
  }

  if (isLoading || !form) return <LoadingState label="Loading page content…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  // Defaults helpers
  const heroCards = form.homeHeroCards && form.homeHeroCards.length === 3 ? form.homeHeroCards : [
    { src: '/images/selected-images/new/entrance.jpeg', alt: 'Shraddha Garden glowing entrance sign' },
    { src: '/images/selected-images/new/waterfall.jpeg', alt: 'Girl in a pink dress on a garden swing' },
    { src: '/images/selected-images/Family/italian-family-1.jpeg', alt: 'Italian family group portrait' },
  ];

  const stats = form.homeStats && form.homeStats.length === 4 ? form.homeStats : [
    { value: '40+', label: 'Acres of greenery' },
    { value: '16', label: 'Unique amenities' },
    { value: '3', label: 'Signature kitchens' },
    { value: '1k+', label: 'Events celebrated' },
  ];

  const traditionPoints = form.homeTraditionPoints && form.homeTraditionPoints.length === 4 ? form.homeTraditionPoints : [
    'Acres of manicured, lush green gardens',
    'Rooted in authentic Tamil hospitality',
    'Stays, dining and celebration — all on-site',
    'A dedicated host for every occasion',
  ];

  const traditionImages = form.homeTraditionImages && form.homeTraditionImages.length === 3 ? form.homeTraditionImages : [
    '/images/selected-images/new/lush_garden.jpeg',
    '/images/selected-images/new/garden_path.jpeg',
    '/images/selected-images/new/pool_wide.jpeg',
  ];

  const aboutImages = form.aboutHeroImages && form.aboutHeroImages.length === 2 ? form.aboutHeroImages : [
    '/images/selected-images/new/pool_wide.jpeg',
    '/images/selected-images/new/shra_vanam.jpeg',
  ];

  const introBlocks = form.aboutIntroBlocks && form.aboutIntroBlocks.length === 3 ? form.aboutIntroBlocks : [
    { eyebrow: 'Built upon luxury', body: 'Shraddha Garden was conceived as a place where understated luxury meets the living landscape.' },
    { eyebrow: 'Peace, greenery, beauty', body: 'Forty acres of manicured gardens, flowering borders and quiet water features create a sanctuary that calms the moment you arrive.' },
    { eyebrow: 'A canvas for legacies', body: 'From weddings to milestone birthdays, the garden becomes the backdrop for the memories your family will return to for years.' },
  ];

  const hosts = form.aboutHosts && form.aboutHosts.length === 3 ? form.aboutHosts : [
    { icon: 'star', title: 'Your celebration host', text: 'One dedicated host owns your day from the first call to the final farewell.' },
    { icon: 'dining', title: 'Chef & live kitchens', text: 'Meals are cooked fresh on site. Menus are shaped together around your guests.' },
    { icon: 'check', title: 'Grounds & concierge', text: 'Housekeeping, valet, security and a garden crew that keeps every corner welcoming.' },
  ];

  const handledOnSite = form.aboutHandledOnSite && form.aboutHandledOnSite.length > 0 ? form.aboutHandledOnSite : [
    'Dedicated celebration host',
    'Housekeeping & valet',
    'Live kitchen & fresh catering setup',
    'Decor & lighting coordination',
    'Sound, audiovisual & power backup',
    'Round-the-clock property security',
    'Garden lawn preparation & seating',
    'Guest check-in & accommodation concierge',
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page Content Manager"
        subtitle="Manage the public Home Page and About Us story, headlines, photos, stats, and highlights."
        actions={
          <AdminButton onClick={save} loading={saveMut.isPending}>
            Save all changes
          </AdminButton>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            activeTab === 'home'
              ? 'bg-forest text-cream shadow-xs'
              : 'bg-paper text-ink hover:bg-cream-2'
          }`}
        >
          Home Page Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            activeTab === 'about'
              ? 'bg-forest text-cream shadow-xs'
              : 'bg-paper text-ink hover:bg-cream-2'
          }`}
        >
          About Us Page Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            activeTab === 'banners'
              ? 'bg-forest text-cream shadow-xs'
              : 'bg-paper text-ink hover:bg-cream-2'
          }`}
        >
          Page Hero Banners
        </button>
      </div>

      <div className="max-w-4xl space-y-8">
        {/* ======================= TAB 1: HOME PAGE ======================= */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* 1. Hero Section */}
            <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-6">
              <div>
                <h2 className="font-serif text-xl font-normal text-ink">Hero Section (Top of Home Page)</h2>
                <p className="text-xs text-muted">The primary headline, description, and the 3 entrance photo cards visitors see first.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Main Headline" hint="Supports line breaks">
                  <textarea
                    rows={2}
                    value={form.homeHeadline || ''}
                    onChange={(e) => set('homeHeadline', e.target.value)}
                    placeholder="Celebrate amidst lush&#10;green gardens"
                    className={inputCls}
                  />
                </Field>
                <Field label="Subtitle Paragraph" hint="Brief introduction below headline">
                  <textarea
                    rows={2}
                    value={form.homeSubtext || ''}
                    onChange={(e) => set('homeSubtext', e.target.value)}
                    placeholder="A sanctuary of celebration and stays..."
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="border-t border-line pt-4">
                <h3 className="mb-3 font-serif text-base font-medium text-ink">3 Hero Photo Cards</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {heroCards.map((card, idx) => (
                    <div key={idx} className="rounded-xl border border-line bg-cream/30 p-3 space-y-3">
                      <p className="text-xs font-semibold text-muted uppercase">Card #{idx + 1}</p>
                      <ImagePicker
                        label="Card Photo"
                        folder="home/hero"
                        value={card.src}
                        onChange={(url) => {
                          const next = [...heroCards];
                          next[idx] = { ...next[idx], src: url };
                          set('homeHeroCards', next);
                        }}
                      />
                      <Field label="Alt / Caption">
                        <input
                          value={card.alt}
                          onChange={(e) => {
                            const next = [...heroCards];
                            next[idx] = { ...next[idx], alt: e.target.value };
                            set('homeHeroCards', next);
                          }}
                          className={inputCls}
                          placeholder="Short description"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Stats Band */}
            <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-5">
              <div>
                <h2 className="font-serif text-xl font-normal text-ink">Stats Band Counters</h2>
                <p className="text-xs text-muted">The 4 counters displayed inside the green ribbon (e.g. 40+ Acres, 16 Amenities, etc.).</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((st, idx) => (
                  <div key={idx} className="rounded-xl border border-line bg-cream/30 p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-muted uppercase">Stat #{idx + 1}</p>
                    <Field label="Counter Value">
                      <input
                        value={st.value}
                        onChange={(e) => {
                          const next = [...stats];
                          next[idx] = { ...next[idx], value: e.target.value };
                          set('homeStats', next);
                        }}
                        className={inputCls}
                        placeholder="e.g. 40+"
                      />
                    </Field>
                    <Field label="Label">
                      <input
                        value={st.label}
                        onChange={(e) => {
                          const next = [...stats];
                          next[idx] = { ...next[idx], label: e.target.value };
                          set('homeStats', next);
                        }}
                        className={inputCls}
                        placeholder="e.g. Acres of greenery"
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Tradition Section */}
            <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-6">
              <div>
                <h2 className="font-serif text-xl font-normal text-ink">Discover Our Tradition Section</h2>
                <p className="text-xs text-muted">The story block with checklist points and the 3-image photo collage.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Section Title">
                  <input
                    value={form.homeTraditionTitle || ''}
                    onChange={(e) => set('homeTraditionTitle', e.target.value)}
                    placeholder="Your ultimate getaway, rooted in Tamil tradition"
                    className={inputCls}
                  />
                </Field>
                <Field label="Section Description">
                  <textarea
                    rows={2}
                    value={form.homeTraditionSubtext || ''}
                    onChange={(e) => set('homeTraditionSubtext', e.target.value)}
                    placeholder="From thatched kudil cottages to a glassy garden pool..."
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="border-t border-line pt-4 space-y-3">
                <h3 className="font-serif text-base font-medium text-ink">4 Checklist Highlight Bullets</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {traditionPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-xs text-cream">
                        ✓
                      </span>
                      <input
                        value={pt}
                        onChange={(e) => {
                          const next = [...traditionPoints];
                          next[idx] = e.target.value;
                          set('homeTraditionPoints', next);
                        }}
                        className={inputCls}
                        placeholder={`Bullet #${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-line pt-4 space-y-3">
                <h3 className="font-serif text-base font-medium text-ink">3 Collage Garden Photos</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  {traditionImages.map((src, idx) => (
                    <div key={idx} className="rounded-xl border border-line bg-cream/30 p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted uppercase">Collage Photo #{idx + 1}</p>
                      <ImagePicker
                        label=""
                        folder="home/tradition"
                        value={src}
                        onChange={(url) => {
                          const next = [...traditionImages];
                          next[idx] = url;
                          set('homeTraditionImages', next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================= TAB 2: ABOUT PAGE ======================= */}
        {activeTab === 'about' && (
          <div className="space-y-8">
            {/* 1. Sanctuary Hero */}
            <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-6">
              <div>
                <h2 className="font-serif text-xl font-normal text-ink">Our Sanctuary (About Page Hero)</h2>
                <p className="text-xs text-muted">Headline, description, and the 2 overlapping framed photos.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hero Headline">
                  <input
                    value={form.aboutHeroTitle || ''}
                    onChange={(e) => set('aboutHeroTitle', e.target.value)}
                    placeholder="A garden built for togetherness"
                    className={inputCls}
                  />
                </Field>
                <Field label="Hero Subtitle">
                  <textarea
                    rows={2}
                    value={form.aboutHeroSubtext || ''}
                    onChange={(e) => set('aboutHeroSubtext', e.target.value)}
                    placeholder="What began as a stretch of coconut grove..."
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="border-t border-line pt-4">
                <h3 className="mb-3 font-serif text-base font-medium text-ink">2 Framed Overlapping Photos</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {aboutImages.map((src, idx) => (
                    <div key={idx} className="rounded-xl border border-line bg-cream/30 p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted uppercase">Framed Photo #{idx + 1}</p>
                      <ImagePicker
                        label=""
                        folder="about"
                        value={src}
                        onChange={(url) => {
                          const next = [...aboutImages];
                          next[idx] = url;
                          set('aboutHeroImages', next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 2. Three Intro Story Blocks */}
            <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-5">
              <div>
                <h2 className="font-serif text-xl font-normal text-ink">Three Story Blocks</h2>
                <p className="text-xs text-muted">The 3 philosophy blocks displayed beside the vertical garden.</p>
              </div>

              <div className="space-y-4">
                {introBlocks.map((block, idx) => (
                  <div key={idx} className="rounded-xl border border-line bg-cream/30 p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted uppercase">Story Block #{idx + 1}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Eyebrow / Heading">
                        <input
                          value={block.eyebrow}
                          onChange={(e) => {
                            const next = [...introBlocks];
                            next[idx] = { ...next[idx], eyebrow: e.target.value };
                            set('aboutIntroBlocks', next);
                          }}
                          className={inputCls}
                          placeholder="e.g. Built upon luxury"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Body Paragraph">
                          <textarea
                            rows={2}
                            value={block.body}
                            onChange={(e) => {
                              const next = [...introBlocks];
                              next[idx] = { ...next[idx], body: e.target.value };
                              set('aboutIntroBlocks', next);
                            }}
                            className={inputCls}
                            placeholder="Description text..."
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Three Host Cards */}
            <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-5">
              <div>
                <h2 className="font-serif text-xl font-normal text-ink">The People Behind Your Day (Hosts)</h2>
                <p className="text-xs text-muted">The 3 host cards representing your celebration, dining, and concierge team.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {hosts.map((host, idx) => (
                  <div key={idx} className="rounded-xl border border-line bg-cream/30 p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted uppercase">Host #{idx + 1}</p>
                    <Field label="Role / Title">
                      <input
                        value={host.title}
                        onChange={(e) => {
                          const next = [...hosts];
                          next[idx] = { ...next[idx], title: e.target.value };
                          set('aboutHosts', next);
                        }}
                        className={inputCls}
                        placeholder="e.g. Your celebration host"
                      />
                    </Field>
                    <Field label="Responsibilities Description">
                      <textarea
                        rows={3}
                        value={host.text}
                        onChange={(e) => {
                          const next = [...hosts];
                          next[idx] = { ...next[idx], text: e.target.value };
                          set('aboutHosts', next);
                        }}
                        className={inputCls}
                        placeholder="One dedicated host owns your day..."
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Handled On-Site Perks */}
            <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-5">
              <div>
                <h2 className="font-serif text-xl font-normal text-ink">Everything Handled On-Site</h2>
                <p className="text-xs text-muted">Perks and on-site capabilities displayed in the dark section checklist.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {handledOnSite.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-xs text-cream">
                      ✓
                    </span>
                    <input
                      value={perk}
                      onChange={(e) => {
                        const next = [...handledOnSite];
                        next[idx] = e.target.value;
                        set('aboutHandledOnSite', next);
                      }}
                      className={inputCls}
                      placeholder={`Perk #${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ======================= TAB 3: PAGE HERO BANNERS ======================= */}
        {activeTab === 'banners' && (
          <div className="space-y-8">
            <section className="rounded-2xl border border-line bg-paper p-6 shadow-2xs space-y-6">
              <div>
                <h2 className="font-serif text-xl font-normal text-ink">Page Hero & Banner Images</h2>
                <p className="text-xs text-muted">Customize the main hero background photos for public website pages.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-cream/30 p-4 space-y-3">
                  <h3 className="font-serif text-base font-medium text-ink">Events Page Hero Banner</h3>
                  <p className="text-xs text-muted">Displayed at the top of the /events page behind "Celebrations that linger".</p>
                  <ImagePicker
                    label="Events Hero Background"
                    folder="events/hero"
                    value={form.eventsHeroImage || '/images/selected-images/Events/7L3A1899.JPG'}
                    onChange={(url) => set('eventsHeroImage', url)}
                  />
                </div>

                <div className="rounded-xl border border-line bg-cream/30 p-4 space-y-3">
                  <h3 className="font-serif text-base font-medium text-ink">Amenities Page Header Image</h3>
                  <p className="text-xs text-muted">Featured visual for the sixteen attractions showcase.</p>
                  <ImagePicker
                    label="Amenities Hero Image"
                    folder="amenities/hero"
                    value={form.amenitiesHeroBanner || '/images/selected-images/new/pool_wide.jpeg'}
                    onChange={(url) => set('amenitiesHeroBanner', url)}
                  />
                </div>

                <div className="rounded-xl border border-line bg-cream/30 p-4 space-y-3">
                  <h3 className="font-serif text-base font-medium text-ink">Dining Page Hero Photo 1</h3>
                  <p className="text-xs text-muted">First vertical card on the /dining page header.</p>
                  <ImagePicker
                    label="Dining Photo 1"
                    folder="dining/hero"
                    value={form.diningHeroImage1 || '/images/selected-images/new/water_shower.jpeg'}
                    onChange={(url) => set('diningHeroImage1', url)}
                  />
                </div>

                <div className="rounded-xl border border-line bg-cream/30 p-4 space-y-3">
                  <h3 className="font-serif text-base font-medium text-ink">Dining Page Hero Photo 2</h3>
                  <p className="text-xs text-muted">Second vertical card on the /dining page header.</p>
                  <ImagePicker
                    label="Dining Photo 2"
                    folder="dining/hero"
                    value={form.diningHeroImage2 || '/images/selected-images/new/shra_vanam.jpeg'}
                    onChange={(url) => set('diningHeroImage2', url)}
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {saved && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">All page content saved successfully!</p>}

        <div className="flex justify-end pt-2">
          <AdminButton onClick={save} loading={saveMut.isPending}>
            Save all changes
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
