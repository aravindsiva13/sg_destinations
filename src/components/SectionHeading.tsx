import SectionEyebrow from './SectionEyebrow';
import Reveal from './Reveal';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtext?: string;
  align?: 'center' | 'left';
  className?: string;
}

/** Recurring opener: italic eyebrow + large serif heading + optional subtext. */
export default function SectionHeading({
  eyebrow,
  title,
  subtext,
  align = 'center',
  className = '',
}: SectionHeadingProps) {
  return (
    <Reveal
      className={`${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl text-left'} ${className}`}
    >
      <SectionEyebrow align={align}>{eyebrow}</SectionEyebrow>
      <h2 className="mt-2 font-serif text-3xl leading-[1.1] text-ink md:text-[2.7rem]">
        {title}
      </h2>
      {subtext && (
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
          {subtext}
        </p>
      )}
    </Reveal>
  );
}
