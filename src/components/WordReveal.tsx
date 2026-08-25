import { Fragment, useEffect, useRef } from 'react';

interface WordRevealProps {
  /** Heading text. Split on spaces; each word slides up in sequence. */
  text: string;
  className?: string;
  as?: 'h1' | 'h2';
  /** Per-word delay in ms. */
  stagger?: number;
}

/**
 * Layer 4 — word-by-word reveal, implemented as a React component so the
 * word spans live in the virtual DOM (safe on pages that re-render their
 * heading, unlike DOM mutation). Falls back to plain text under
 * `prefers-reduced-motion`.
 */
export default function WordReveal({
  text,
  className,
  as = 'h1',
  stagger = 70,
}: WordRevealProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const reveal = () => {
      if (cancelled) return;
      el.querySelectorAll('.word-inner').forEach((s) =>
        s.classList.add('is-visible'),
      );
    };
    // Reveal after fonts load so there's no layout shift mid-animation.
    document.fonts.ready.then(() => {
      if (!cancelled) requestAnimationFrame(reveal);
    });
    // Safety net: guarantee the heading is never left invisible if rAF is
    // paused (e.g. the page loaded in a background tab) or fonts stall.
    const fallback = window.setTimeout(reveal, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [reduced, text]);

  const Tag = as;

  if (reduced) return <Tag className={className}>{text}</Tag>;

  const words = text.split(' ');
  return (
    <Tag className={className} ref={ref}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="word-wrap">
            <span className="word-inner" style={{ transitionDelay: `${i * stagger}ms` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </Tag>
  );
}
