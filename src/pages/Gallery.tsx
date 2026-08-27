import { useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';

const categories = [
  {
    id: 'italian-family',
    name: 'A Taste of Italy',
    description: 'Special moments and authentic experiences with our Italian family.',
    images: Array.from({ length: 17 }, (_, i) => `/images/selected-images/Family/italian-family-${i + 1}.jpeg`),
  },
  {
    id: 'events',
    name: 'Events & Celebrations',
    description: 'Unforgettable moments celebrated in our versatile venues.',
    images: [
      '/images/selected-images/Events/7L3A1899.JPG',
      '/images/selected-images/Events/7L3A1901.JPG',
      '/images/selected-images/Events/7L3A1933.JPG',
      '/images/selected-images/Events/7L3A2041.JPG',
      '/images/selected-images/Events/7L3A2124.JPG',
      '/images/selected-images/Events/7L3A2139.JPG',
    ],
  },
  {
    id: 'family',
    name: 'Family Moments',
    description: 'Cherished memories created by our guests at Shraddha Garden.',
    images: [
      '/images/selected-images/Family/7L3A1948.JPG',
      '/images/selected-images/Family/7L3A2000.JPG',
      '/images/selected-images/Family/7L3A2099.JPG',
      '/images/selected-images/Family/7L3A2102.JPG',
      '/images/selected-images/Family/7L3A2105.JPG',
      '/images/selected-images/Family/7L3A2265.JPG',
      '/images/selected-images/Family/7L3A2279.JPG',
      '/images/selected-images/Family/7L3A2306.JPG',
    ],
  },
  {
    id: 'resort',
    name: 'Resort & Activities',
    description: 'Relaxation and fun across our lush property.',
    images: [
      '/images/selected-images/Resort/7L3A1963.JPG',
      '/images/selected-images/Resort/7L3A2204.JPG',
      '/images/selected-images/Resort/7L3A2214.JPG',
    ],
  },
  {
    id: 'interior',
    name: 'Interiors & Comfort',
    description: 'Elegant spaces designed for your utmost relaxation.',
    images: [
      '/images/selected-images/Interior/7L3A2112.JPG',
      '/images/selected-images/Interior/7L3A2314.JPG',
      '/images/selected-images/Interior/7L3A2317.JPG',
    ],
  }
];

export default function Gallery() {
  const container = useRef<HTMLDivElement>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0].id);

  // We only show images for the active category for better performance and UX
  const currentCategory = useMemo(() => categories.find(c => c.id === activeCategory) || categories[0], [activeCategory]);
  
  // Split images into 3 columns for Masonry
  const cols = useMemo(() => {
    const columns = [[], [], []] as string[][];
    currentCategory.images.forEach((img, i) => columns[i % 3].push(img));
    return columns;
  }, [currentCategory]);

  useGSAP(
    () => {
      // Fade in images when category changes
      gsap.fromTo(
        '.gallery-item',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.05,
          ease: 'power3.out',
          clearProps: 'all' // prevents interference with layout changes
        }
      );
    },
    { dependencies: [activeCategory], scope: container }
  );

  return (
    <div className="min-h-screen bg-cream pt-32 pb-24 overflow-hidden" ref={container}>
      <Seo title="Gallery - Shraddha Garden" description="A visual glimpse of paradise." />
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 mb-12 text-center">
        <Reveal>
          <h1 className="font-serif text-5xl md:text-6xl text-ink">A Glimpse of Paradise</h1>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            Explore the serene spaces, lush landscapes, and thoughtful details that define Shraddha Garden.
          </p>
        </Reveal>
      </div>

      {/* Category Filter */}
      <div className="container mx-auto px-6 mb-12">
        <Reveal delay={0.2}>
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2 rounded-full border transition-all duration-300 ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-white border-primary shadow-md' 
                    : 'bg-transparent text-ink border-ink/20 hover:border-primary hover:text-primary'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Section Description */}
      <div className="container mx-auto px-6 mb-12 text-center h-8">
        <Reveal>
           <p className="text-lg text-muted font-medium italic">{currentCategory.description}</p>
        </Reveal>
      </div>

      {/* Masonry Grid */}
      <div className="container mx-auto px-6 min-h-[60vh]">
        <div className="flex gap-4 md:gap-6 items-start">
          {cols.map((colImages, colIndex) => (
            <div
              key={`${activeCategory}-${colIndex}`}
              className="flex flex-1 flex-col gap-4 md:gap-6"
            >
              {colImages.map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  className="gallery-item group relative cursor-pointer overflow-hidden rounded-xl bg-paper shadow-sm"
                  onClick={() => setLightboxImg(src)}
                >
                  <img
                    src={src}
                    alt={`Gallery item ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Brand Overlay Hover Effect */}
                  <div className="absolute inset-0 bg-ink/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
                    <img
                      src="/images/brand/icon-gold.png"
                      alt=""
                      className="w-16 h-16 object-contain opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-6 backdrop-blur-md transition-opacity"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Expanded view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 text-cream opacity-70 hover:opacity-100 transition-opacity p-2 bg-ink/50 rounded-full"
            aria-label="Close lightbox"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
