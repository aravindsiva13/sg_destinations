import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';

gsap.registerPlugin(ScrollTrigger);

const images = [
  'https://images.unsplash.com/photo-1542314831-c6a4d14cdce8?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1558616629-899031969d5e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=800&auto=format&fit=crop',
];

export default function Gallery() {
  const container = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Split images into 3 columns for Masonry
  const cols = [[], [], []] as string[][];
  images.forEach((img, i) => cols[i % 3].push(img));

  useGSAP(
    () => {
      // 1. Column Parallax
      colRefs.current.forEach((col, i) => {
        if (!col) return;
        const speed = i % 2 === 0 ? 0.05 : -0.05; // odd/even parallax
        
        gsap.to(col, {
          yPercent: speed * 100,
          ease: 'none',
          scrollTrigger: {
            trigger: container.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      // 2. Individual Image Stagger Reveal
      gsap.utils.toArray('.gallery-item').forEach((item: any) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
            },
          }
        );
      });
    },
    { scope: container }
  );

  return (
    <div className="min-h-screen bg-cream pt-32 pb-24 overflow-hidden" ref={container}>
      <Seo title="Gallery - Shraddha Garden" description="A visual glimpse of paradise." />
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 mb-16 text-center">
        <Reveal>
          <h1 className="font-serif text-5xl md:text-6xl text-ink">A Glimpse of Paradise</h1>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            Explore the serene spaces, lush landscapes, and thoughtful details that define Shraddha Garden.
          </p>
        </Reveal>
      </div>

      {/* Masonry Grid */}
      <div className="container mx-auto px-6">
        <div className="flex gap-4 md:gap-6 items-start">
          {cols.map((colImages, colIndex) => (
            <div
              key={colIndex}
              ref={(el) => (colRefs.current[colIndex] = el)}
              className="flex flex-1 flex-col gap-4 md:gap-6"
            >
              {colImages.map((src, idx) => (
                <div
                  key={idx}
                  className="gallery-item group relative cursor-pointer overflow-hidden rounded-xl bg-paper shadow-sm"
                  onClick={() => setLightboxImg(src)}
                >
                  <img
                    src={src}
                    alt="Gallery item"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Expanded view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // keep open if clicking image itself
          />
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 text-cream opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close lightbox"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
