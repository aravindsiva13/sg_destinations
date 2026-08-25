import { useEffect } from 'react';

const SITE = 'Shraddha Garden Resort';
const DEFAULT_DESCRIPTION =
  'A sanctuary of celebration and stays amidst lush green gardens, rooted in Tamil tradition.';

/**
 * Per-page SEO: title, meta description, canonical URL and Open Graph tags.
 * A fallback (og:image) is set once and reused across pages.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
}: {
  title: string;
  description?: string;
  path?: string;
}) {
  useEffect(() => {
    const fullTitle = title.includes(SITE) ? title : `${title} · ${SITE}`;
    document.title = fullTitle;

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', `https://www.sgdestinations.com${path}`);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://www.sgdestinations.com${path}`);
  }, [title, description, path]);

  return null;
}