import { useEffect, type ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

/** Right-side slide-over panel used for detail/edit views. */
export default function Drawer({ open, onClose, title, children, width = 'max-w-xl' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute right-0 top-0 flex h-full w-full ${width} animate-[slidein_.25s_ease] flex-col bg-cream shadow-2xl`}
        style={{ animationName: 'slidein' }}
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted hover:bg-line/60 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
      <style>{`@keyframes slidein{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );
}
