import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

/**
 * Site-wide animation & interaction system (public site only).
 *
 * Bundles seven of the eight "instituteofhealth"-style layers that are
 * global behaviours rather than a single section:
 *   1. Custom magnetic cursor
 *   3. Staggered scroll reveals ([data-reveal] / [data-reveal-stagger])
 *   4. Word-by-word hero reveal ([data-word-reveal])
 *   5. Counter number animation ([data-counter])
 *   6. Page-in transition on route change
 *   7. Image parallax (.parallax-card > .parallax-img)
 *   8. Magnetic button pull ([data-magnetic])
 *
 * Layer 2 (the sticky scroll panel) lives in <StayScrollPanel>.
 *
 * All effects honour `prefers-reduced-motion` and skip entirely on
 * touch / no-hover devices where appropriate. The cursor-hiding body
 * class is removed on unmount, so the admin portal never inherits it.
 */
export default function SiteAnimations() {
  const location = useLocation();

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noHover =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: none)').matches;

  /* ── Smooth (inertia) scrolling — Lenis, mounted once ─────────
     Adds momentum to wheel/trackpad scrolling on the public site.
     Disabled under reduced-motion (keeps native scroll); touch is left
     native by default (smoothTouch off) so mobile feels normal. */
  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      lerp: 0.12, // lower = smoother / longer glide
      smoothWheel: true,
      wheelMultiplier: 1.2,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [reducedMotion]);

  /* ── Layer 1: Custom magnetic cursor (mounted once) ───────── */
  useEffect(() => {
    if (noHover || reducedMotion) return;

    const cursor = document.createElement('div');
    cursor.id = 'site-cursor';
    cursor.innerHTML = '<span class="cursor-label"></span>';
    document.body.appendChild(cursor);
    document.body.classList.add('has-custom-cursor');
    const label = cursor.querySelector('.cursor-label') as HTMLElement;

    let tx = -200,
      ty = -200,
      cx = -200,
      cy = -200,
      raf = 0,
      running = false,
      clicking = false;

    const render = () => {
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${
        clicking ? 0.7 : 1
      })`;
    };
    const loop = () => {
      const dx = tx - cx;
      const dy = ty - cy;
      cx += dx * 0.25;
      cy += dy * 0.25;
      render();
      // Keep ticking only while there's meaningful movement left; otherwise
      // park the loop so we don't burn a frame callback while idle.
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
      }
    };
    const startLoop = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.remove('is-hidden');
      startLoop();
    };
    const onLeave = () => cursor.classList.add('is-hidden');
    const onEnter = () => cursor.classList.remove('is-hidden');
    const onDown = () => {
      clicking = true;
      render(); // apply shrink immediately, even if the lerp loop is parked
    };
    const onUp = () => {
      clicking = false;
      render();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);

    // Expanded state + contextual label by element type / data-cursor.
    const SELECTORS: [string, string | null][] = [
      ['a[href]', 'Open'],
      ['button', 'Click'],
      ['[role="button"]', 'Click'],
      ['[data-cursor]', null],
    ];
    const getLabel = (node: EventTarget | null): string | null => {
      if (!(node instanceof Element)) return null;
      for (const [sel, fallback] of SELECTORS) {
        const el = node.closest<HTMLElement>(sel);
        if (el) return el.dataset.cursor !== undefined ? el.dataset.cursor : fallback;
      }
      return null;
    };

    const onOver = (e: MouseEvent) => {
      const lbl = getLabel(e.target);
      if (lbl !== null) {
        label.textContent = lbl;
        cursor.classList.add('is-hovering');
      }
    };
    const onOut = (e: MouseEvent) => {
      if (getLabel(e.relatedTarget) === null) cursor.classList.remove('is-hovering');
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cursor.remove();
      document.body.classList.remove('has-custom-cursor');
    };
  }, [noHover, reducedMotion]);

  /* ── Layer 6: Page-in fade on each route change ──────────── */
  useEffect(() => {
    if (reducedMotion) return;
    const main = document.querySelector('main');
    if (!main) return;
    main.classList.remove('page-enter');
    // Force reflow so the animation restarts on every navigation.
    void (main as HTMLElement).offsetWidth;
    main.classList.add('page-enter');
  }, [location.pathname, reducedMotion]);

  /* ── Layers 3, 4, 5, 7, 8 — (re)scan the DOM per route ───── */
  useEffect(() => {
    const root = document.getElementById('public-root');
    if (!root) return;

    const cleanups: Array<() => void> = [];

    /* Layer 4: Word-by-word hero reveal. Preserves child nodes
       (e.g. <br>) by only splitting text nodes. */
    if (!reducedMotion) {
      root.querySelectorAll<HTMLElement>('[data-word-reveal]').forEach((el) => {
        if (el.dataset.wrDone) return;
        el.dataset.wrDone = 'true';
        let i = 0;
        const frag = document.createDocumentFragment();
        el.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const words = (node.textContent ?? '').split(/(\s+)/);
            words.forEach((w) => {
              if (w.trim() === '') {
                frag.appendChild(document.createTextNode(w));
                return;
              }
              const wrap = document.createElement('span');
              wrap.className = 'word-wrap';
              const inner = document.createElement('span');
              inner.className = 'word-inner';
              inner.style.transitionDelay = `${i * 70}ms`;
              inner.textContent = w;
              wrap.appendChild(inner);
              frag.appendChild(wrap);
              i++;
            });
          } else {
            frag.appendChild(node.cloneNode(true));
          }
        });
        el.innerHTML = '';
        el.appendChild(frag);
      });

      const revealWords = () =>
        root
          .querySelectorAll<HTMLElement>('.word-inner')
          .forEach((el) => el.classList.add('is-visible'));
      document.fonts.ready.then(() => requestAnimationFrame(revealWords));
      // Safety net for paused rAF (background tab) or stalled fonts.
      const wordFallback = window.setTimeout(revealWords, 1200);
      cleanups.push(() => window.clearTimeout(wordFallback));
    }

    /* Layer 3: Staggered scroll reveals. */
    root.classList.add('reveal-ready');
    if (!reducedMotion) {
      const revealEls = root.querySelectorAll<HTMLElement>(
        '[data-reveal], [data-reveal-stagger]',
      );
      if (revealEls.length) {
        const obs = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add('is-revealed');
                obs.unobserve(e.target);
              }
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
        );
        revealEls.forEach((el) => obs.observe(el));
        cleanups.push(() => obs.disconnect());
      }
    }

    /* Layer 5: Counters. */
    const counters = root.querySelectorAll<HTMLElement>('[data-counter]');
    if (counters.length) {
      if (reducedMotion) {
        counters.forEach((el) => {
          el.textContent =
            (el.dataset.counter ?? '') + (el.dataset.counterSuffix ?? '');
        });
      } else {
        const obs = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const el = entry.target as HTMLElement;
              const end = parseInt(el.dataset.counter ?? '0', 10);
              const dur = parseInt(el.dataset.counterDur ?? '1800', 10);
              const suffix = el.dataset.counterSuffix ?? '';
              const start = performance.now();
              const tick = (now: number) => {
                const p = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 4);
                el.textContent = Math.round(eased * end) + suffix;
                if (p < 1) requestAnimationFrame(tick);
              };
              requestAnimationFrame(tick);
              obs.unobserve(el);
            });
          },
          { threshold: 0.5 },
        );
        counters.forEach((el) => obs.observe(el));
        cleanups.push(() => obs.disconnect());
      }
    }

    /* Layer 7: Image parallax. */
    if (!noHover && !reducedMotion) {
      const cards = root.querySelectorAll<HTMLElement>('.parallax-card');
      if (cards.length) {
        let rafId: number | null = null;
        const update = () => {
          const vh = window.innerHeight;
          cards.forEach((card) => {
            const img = card.querySelector<HTMLElement>('.parallax-img');
            if (!img) return;
            const rect = card.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            const pct = mid / vh - 0.5;
            img.style.transform = `translateY(${pct * rect.height * 0.3}px)`;
          });
          rafId = null;
        };
        const onScroll = () => {
          if (rafId == null) rafId = requestAnimationFrame(update);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        update();
        cleanups.push(() => {
          window.removeEventListener('scroll', onScroll);
          if (rafId != null) cancelAnimationFrame(rafId);
        });
      }
    }

    /* Layer 8: Magnetic button pull. */
    if (!noHover && !reducedMotion) {
      root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((btn) => {
        const strength = parseFloat(btn.dataset.magnetic || '') || 0.35;
        const onMove = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) * strength;
          const dy = (e.clientY - (r.top + r.height / 2)) * strength;
          btn.style.transform = `translate(${dx}px, ${dy}px)`;
          btn.style.transition = 'transform 0.12s ease';
        };
        const onLeave = () => {
          btn.style.transform = 'translate(0, 0)';
          btn.style.transition = 'transform 0.5s var(--anim-spring)';
        };
        btn.addEventListener('mousemove', onMove);
        btn.addEventListener('mouseleave', onLeave);
        cleanups.push(() => {
          btn.removeEventListener('mousemove', onMove);
          btn.removeEventListener('mouseleave', onLeave);
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [location.pathname, reducedMotion, noHover]);

  return null;
}
