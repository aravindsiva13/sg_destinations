import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon';
import Button from './Button';
import AnnouncementBar from './AnnouncementBar';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { navLinks, site } from '../data/site';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  const { user } = useCustomerAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape and trap focus inside the mobile menu
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger?.focus();
        return;
      }
      if (e.key !== 'Tab' || !menu) return;
      const focusables = menu.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    // Move focus into the menu when it opens (before the close button toggles back).
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? 'border-b border-line/70 bg-cream/90 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <AnnouncementBar />
      <div className="container-pad flex h-16 items-center justify-between md:h-[72px]">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center"
          aria-label={`${site.name} — home`}
        >
          <img 
            src="/images/brand/logo-dark.png" 
            alt={site.name} 
            className="h-12 w-auto object-contain md:h-16" 
          />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-sm transition-colors hover:text-terracotta ${
                  isActive ? 'text-terracotta' : 'text-ink/80'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link
            to={user ? '/account' : '/signin'}
            className="hidden items-center gap-1.5 text-sm text-ink/80 transition-colors hover:text-terracotta sm:inline-flex"
          >
            <Icon name="star" className="h-4 w-4" />
            {user ? user.name.split(' ')[0] : 'Sign in'}
          </Link>
          <Button to="/reserve" variant="forest" size="sm" className="hidden sm:inline-flex">
            RESERVE NOW
          </Button>
          <button
            ref={triggerRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            ref={menuRef}
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative overflow-hidden border-t border-cream/10 bg-forest text-cream shadow-2xl lg:hidden"
          >
            <div 
              className="absolute inset-0 opacity-40 mix-blend-overlay" 
              style={{ backgroundImage: 'url(/images/brand/brand-pattern.png)', backgroundSize: '240px' }}
            />
            <ul className="container-pad relative flex flex-col py-4">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `block border-b border-cream/10 py-3.5 font-serif text-lg ${
                        isActive ? 'text-[#D4AF37]' : 'text-cream'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink
                  to={user ? '/account' : '/signin'}
                  className="block border-b border-cream/10 py-3.5 font-serif text-lg text-cream"
                >
                  {user ? 'My account' : 'Sign in'}
                </NavLink>
              </li>
              <li className="pt-4">
                <Button to="/reserve" variant="light" className="w-full">
                  RESERVE NOW
                </Button>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
