interface SectionEyebrowProps {
  children: string;
  align?: 'center' | 'left';
  tone?: 'terracotta' | 'cream';
}

/** Small italic script word in terracotta, the recurring section opener. */
export default function SectionEyebrow({
  children,
  align = 'center',
  tone = 'terracotta',
}: SectionEyebrowProps) {
  return (
    <p
      className={`eyebrow text-lg md:text-xl ${
        align === 'center' ? 'text-center' : 'text-left'
      } ${tone === 'cream' ? '!text-terracotta/90' : ''}`}
    >
      {children}
    </p>
  );
}
