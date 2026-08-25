import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { AdminToaster } from '../lib/notify';

export default function AdminLayout() {
  const { user } = useAdminAuth();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar role={user!.role} />
      </aside>

      {/* Mobile sidebar */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-charcoal/50"
            onClick={() => setMobileNav(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-64">
            <Sidebar role={user!.role} onNavigate={() => setMobileNav(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <Topbar onMenu={() => setMobileNav(true)} />
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
      <AdminToaster />
    </div>
  );
}
