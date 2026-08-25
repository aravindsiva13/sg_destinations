import { Link } from 'react-router-dom';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'forest' | 'outline' | 'light' | 'dark' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 focus-visible:outline-none disabled:opacity-60 disabled:pointer-events-none';

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-[0.8rem]',
  md: 'px-6 py-3 text-sm',
  lg: 'px-7 py-3.5 text-[0.95rem]',
};

const variants: Record<Variant, string> = {
  forest:
    'bg-forest text-cream hover:bg-forest-deep shadow-sm hover:shadow-md',
  dark: 'bg-ink text-cream hover:bg-charcoal shadow-sm',
  light: 'bg-cream text-ink hover:bg-paper shadow-sm',
  outline:
    'border border-current/60 bg-transparent hover:bg-current/5',
  ghost: 'bg-transparent text-ink hover:text-terracotta',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  to?: string;
  href?: string;
}

export default function Button({
  variant = 'forest',
  size = 'md',
  children,
  className = '',
  to,
  href,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  // `rest` is typed for a <button>; when rendering as a Link/anchor we spread
  // the same handlers (onClick, etc.) which are structurally compatible.
  const linkRest = rest as Record<string, unknown>;
  if (to) {
    return (
      <Link to={to} className={cls} {...linkRest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...linkRest}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
