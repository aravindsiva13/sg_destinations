import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminIcon from './AdminIcon';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { ROLE_LABELS } from '../constants';

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = user?.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-cream/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="rounded-lg p-2 text-ink hover:bg-line/60 lg:hidden"
        >
          <AdminIcon name="menu" />
        </button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          View live site ↗
        </a>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-line/50"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-xs font-semibold text-cream">
            {initials}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium text-ink">{user?.name}</span>
            <span className="block text-[0.65rem] uppercase tracking-wider text-muted">
              {user ? ROLE_LABELS[user.role] : ''}
            </span>
          </span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-paper shadow-lg">
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-sm font-medium text-ink">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
              >
                <AdminIcon name="logout" className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
