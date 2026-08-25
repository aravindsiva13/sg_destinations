import { useEffect, useState } from 'react';
import AdminIcon from '../components/AdminIcon';

type Toast = { id: number; tone: 'error' | 'success'; text: string };
type Listener = (toast: Toast) => void;

let nextId = 1;
const listeners = new Set<Listener>();

function push(tone: Toast['tone'], text: string) {
  const toast = { id: nextId++, tone, text };
  listeners.forEach((l) => l(toast));
}

/** Show a transient error/success pill in the admin shell. */
export const notifyError = (text: string) => push('error', text);
export const notifySuccess = (text: string) => push('success', text);

/** Extract a human-readable message from an unknown error (API or otherwise). */
export function errorText(err: unknown, fallback = 'Something went wrong — please try again.'): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Mounted once in AdminLayout; renders toasts triggered anywhere in admin. */
export function AdminToaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listen: Listener = (t) => {
      setToasts((prev) => [...prev.slice(-2), t]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 5000);
    };
    listeners.add(listen);
    return () => {
      listeners.delete(listen);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg backdrop-blur ${
            t.tone === 'error'
              ? 'border-rose-200 bg-rose-50/95 text-rose-700'
              : 'border-forest/20 bg-paper/95 text-ink'
          }`}
        >
          <AdminIcon
            name={t.tone === 'error' ? 'alert' : 'check'}
            className={`mt-0.5 h-4 w-4 shrink-0 ${t.tone === 'error' ? 'text-rose-500' : 'text-forest'}`}
          />
          <span className="min-w-0">{t.text}</span>
        </div>
      ))}
    </div>
  );
}