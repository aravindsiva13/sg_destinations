import type { ReactNode } from 'react';

type Tone = 'amber' | 'green' | 'blue' | 'slate' | 'red';

const toneClasses: Record<Tone, string> = {
  amber: 'bg-amber-100 text-amber-800 ring-amber-200',
  green: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  blue: 'bg-sky-100 text-sky-800 ring-sky-200',
  slate: 'bg-slate-200 text-slate-700 ring-slate-300',
  red: 'bg-rose-100 text-rose-700 ring-rose-200',
};

export default function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
