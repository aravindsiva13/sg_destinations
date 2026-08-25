import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1.5">
            {c.to ? (
              <Link to={c.to} className="transition-colors hover:text-terracotta">
                {c.label}
              </Link>
            ) : (
              <span className="text-ink">{c.label}</span>
            )}
            {i < items.length - 1 && <span className="text-line">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
