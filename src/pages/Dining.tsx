import SectionEyebrow from '../components/SectionEyebrow';
import SectionHeading from '../components/SectionHeading';
import Reveal from '../components/Reveal';
import WordReveal from '../components/WordReveal';
import MarqueeBanner from '../components/MarqueeBanner';
import Icon from '../components/Icon';
import { images } from '../data/images';
import { useState } from 'react';
import { diningTimings } from '../data/dining';
import { useMenu } from '../hooks/usePublic';
import Tabs from '../components/Tabs';
import Seo from '../components/Seo';

function VegMark({ veg }: { veg?: boolean | null }) {
  if (veg == null) return null;
  const ring = veg ? 'border-green-600' : 'border-rose-600';
  const dot = veg ? 'bg-green-600' : 'bg-rose-600';
  return (
    <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border ${ring}`} aria-label={veg ? 'Veg' : 'Non-veg'}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
    </span>
  );
}

export default function Dining() {
  const { data: menu, isLoading, error, refetch } = useMenu();
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
  <Seo title="Dining" path="/dining" />
      {/* ---------------- Hero ---------------- */}
      <section className="container-pad pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionEyebrow align="left">Taste the garden</SectionEyebrow>
            <WordReveal
              as="h1"
              className="mt-3 font-serif text-4xl leading-[1.05] text-ink sm:text-5xl md:text-[3.4rem]"
              text="Food provided on premise"
            />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted md:text-base">
              From banana-leaf feasts to live grills under the stars, every meal
              at Shraddha Garden is cooked fresh on-site and served with quiet
              Tamil hospitality.
            </p>
          </div>
          <Reveal className="grid grid-cols-2 gap-4">
            <img
              src={images.southIndian}
              alt="A traditional South Indian spread"
              className="aspect-[3/4] w-full rounded-card object-cover"
            />
            <img
              src={images.diningTable}
              alt="A laid dining table in the garden"
              loading="lazy"
              className="mt-8 aspect-[3/4] w-full rounded-card object-cover"
            />
          </Reveal>
        </div>
      </section>



      {/* ---------------- Full menu ---------------- */}
      {isLoading && (
        <section className="bg-cream-2" aria-busy="true" aria-label="Loading menu">
          <div className="container-pad py-16 md:py-24">
            <SectionHeading
              eyebrow="À la carte"
              title="Our menu"
              subtext="Freshly cooked to order. Prices are in ₹ and may vary for bulk or event orders."
            />
            <div className="mx-auto mt-12 max-w-md space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-card bg-paper ring-1 ring-line/50" />
              ))}
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="bg-cream-2">
          <div className="container-pad py-16 text-center md:py-24">
            <SectionHeading
              eyebrow="À la carte"
              title="Our menu"
              subtext="Freshly cooked to order. Prices are in ₹ and may vary for bulk or event orders."
            />
            <p className="mx-auto mt-6 max-w-md text-sm text-muted">
              The menu couldn't be loaded right now. Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-deep"
            >
              Try again
            </button>
          </div>
        </section>
      )}

      {menu && menu.length > 0 && (
        <section className="bg-cream-2">
          <div className="container-pad py-16 md:py-24">
            <SectionHeading
              eyebrow="À la carte"
              title="Our menu"
              subtext="Freshly cooked to order. Prices are in ₹ and may vary for bulk or event orders."
            />
            
            {(() => {
              if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const allItems = menu.flatMap(c => c.items.map(it => ({ ...it, categoryName: c.name })));
                const filtered = allItems.filter(it => it.name.toLowerCase().includes(query));

                return (
                  <div className="mt-12">
                    <div className="mx-auto max-w-xl mb-10">
                      <div className="relative">
                        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-5 w-5" />
                        <input
                          type="text"
                          placeholder="Search for a dish..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full rounded-full border border-line bg-paper py-3 pl-12 pr-4 text-ink shadow-sm transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                          >
                            <Icon name="close" className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <Reveal className="mx-auto max-w-3xl">
                      <div className="rounded-card bg-paper p-6 shadow-sm ring-1 ring-line/70 md:p-8">
                        <h3 className="font-serif text-2xl text-ink">
                          Search Results
                        </h3>
                        {filtered.length > 0 ? (
                          <ul className="mt-5 divide-y divide-line/60">
                            {filtered.map((it) => (
                              <li key={it.id} className="flex items-center gap-4 py-4 text-base">
                                <VegMark veg={it.veg} />
                                <div className="flex-1">
                                  <div className="text-ink/90">{it.name}</div>
                                  <div className="text-sm text-muted">{it.categoryName}</div>
                                </div>
                                <span className="font-medium text-ink">₹{it.price.toLocaleString('en-IN')}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-5 text-muted">No dishes found matching "{searchQuery}".</p>
                        )}
                      </div>
                    </Reveal>
                  </div>
                );
              }

              const activeCategory = selectedTab ? menu.find(c => c.id === selectedTab) : menu[0];
              const tabs = menu.map(c => ({ id: c.id, label: c.name }));
              
              return (
                <div className="mt-12">
                  <div className="mx-auto max-w-xl mb-10">
                    <div className="relative">
                      <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search for a dish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-full border border-line bg-paper py-3 pl-12 pr-4 text-ink shadow-sm transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center mb-8">
                    <Tabs
                      tabs={tabs}
                      activeTab={activeCategory?.id ?? ''}
                      onChange={setSelectedTab}
                    />
                  </div>
                  
                  {activeCategory && (
                    <Reveal key={activeCategory.id} className="mx-auto max-w-3xl">
                      <div className="rounded-card bg-paper p-6 shadow-sm ring-1 ring-line/70 md:p-8">
                        <h3 className="flex items-baseline justify-between gap-2 font-serif text-2xl text-ink">
                          {activeCategory.name}
                          {activeCategory.note && <span className="text-sm font-normal uppercase tracking-wide text-terracotta">{activeCategory.note}</span>}
                        </h3>
                        <ul className="mt-5 divide-y divide-line/60">
                          {activeCategory.items.map((it) => (
                            <li key={it.id} className="flex items-center gap-4 py-4 text-base">
                              <VegMark veg={it.veg} />
                              <span className="flex-1 text-ink/90">{it.name}</span>
                              <span className="font-medium text-ink">₹{it.price.toLocaleString('en-IN')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>
                  )}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ---------------- Chef note + timings ---------------- */}
      <section className="bg-charcoal text-cream">
        <div className="container-pad grid gap-12 py-16 md:grid-cols-2 md:py-24">
          <Reveal>
            <SectionEyebrow align="left" tone="cream">
              From the kitchen
            </SectionEyebrow>
            <h2 className="mt-2 font-serif text-3xl text-cream md:text-4xl">
              A note from our chef
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/70 md:text-base">
              “We cook the way our grandmothers did — slow, seasonal and from the
              garden outward. Tell us about your celebration and we’ll build a
              menu around the people you love.”
            </p>
            <p className="mt-5 font-serif text-lg text-cream">
              Our kitchen team
              <span className="block text-sm font-normal text-cream/55">
                Fresh, seasonal and cooked to order
              </span>
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <h3 className="tag-label !text-cream/55">Dining timings</h3>
            <ul className="mt-5 divide-y divide-cream/10">
              {diningTimings.map((t) => (
                <li
                  key={t.meal}
                  className="flex items-center justify-between py-3.5"
                >
                  <span className="flex items-center gap-2.5 text-cream">
                    <Icon name="dining" className="h-4 w-4 text-terracotta" />
                    {t.meal}
                  </span>
                  <span className="text-sm text-cream/70">{t.hours}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <MarqueeBanner text="DINE WITH US!" />
    </>
  );
}
