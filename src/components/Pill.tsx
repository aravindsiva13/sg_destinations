import type { ReactNode } from 'react';

type Tone = 'dark' | 'light' | 'forest';

const tones: Record<Tone, string> = {
  dark: 'bg-black/55 text-cream backdrop-blur-sm',
  light: 'bg-cream/90 text-ink backdrop-blur-sm',
  forest: 'bg-forest text-cream',
};

/** Small overlay pill used for badges and price tags on cards. */
export default function Pill({
  children,
  tone = 'dark',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
