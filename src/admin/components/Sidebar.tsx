import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AdminIcon, { type AdminIconName } from './AdminIcon';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: AdminIconName;
  end?: boolean;
  roles?: Role[];
}

interface NavCategory {
  id: string;
  label: string;
  items: NavItem[];
}

const CATEGORIES: NavCategory[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
      { to: '/admin/reports', label: 'Reports', icon: 'reports', roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    id: 'stays',
    label: 'Stays & Bookings',
    items: [
      { to: '/admin/bookings', label: 'Bookings', icon: 'bookings' },
      { to: '/admin/stays', label: 'Stays', icon: 'stays' },
      { to: '/admin/availability', label: 'Availability & Pricing', icon: 'pricing', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/addons', label: 'Add-ons', icon: 'offers', roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    id: 'experiences',
    label: 'Dining & Activities',
    items: [
      { to: '/admin/dining', label: 'Dining', icon: 'content', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/menu', label: 'Food Menu', icon: 'content', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/amenities', label: 'Amenities', icon: 'content', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/events', label: 'Events', icon: 'content', roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Media',
    items: [
      { to: '/admin/media', label: 'Media Library', icon: 'media', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/gallery', label: 'Gallery', icon: 'media', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/page-content', label: 'Page Content', icon: 'content', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/banners', label: 'Home & Banners', icon: 'banners', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/offers', label: 'Offers', icon: 'offers', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/coupons', label: 'Coupons', icon: 'offers', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/campaigns', label: 'Campaigns', icon: 'enquiries', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations & Settings',
    items: [
      { to: '/admin/enquiries', label: 'Enquiries', icon: 'enquiries' },
      { to: '/admin/users', label: 'Users & Staff', icon: 'users', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/payments', label: 'Payment Settings', icon: 'offers', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/email', label: 'Email Settings', icon: 'enquiries', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/settings', label: 'General Settings', icon: 'settings', roles: ['SUPER_ADMIN', 'MANAGER'] },
      { to: '/admin/audit', label: 'Audit Log', icon: 'audit', roles: ['SUPER_ADMIN'] },
    ],
  },
];

interface SidebarProps {
  role: Role;
  onNavigate?: () => void;
}

export default function Sidebar({ role, onNavigate }: SidebarProps) {
  const location = useLocation();

  // Track collapsed state for categories (empty object = all expanded by default)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleCategory(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex h-full flex-col bg-forest-deep text-cream/90 overflow-hidden select-none border-r border-cream/10">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 shrink-0 border-b border-cream/10 bg-forest-deep">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cream/10 font-serif text-lg italic text-cream shadow-2xs">
          S
        </span>
        <div className="leading-tight truncate">
          <p className="font-serif text-base text-cream truncate">Shraddha Garden</p>
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-cream/50">Admin Portal</p>
        </div>
      </div>

      {/* Scrollable Navigation Body */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
        }}
      >
        {CATEGORIES.map((category) => {
          const visibleItems = category.items.filter((i) => !i.roles || i.roles.includes(role));
          if (visibleItems.length === 0) return null;

          const isCollapsed = collapsed[category.id] ?? false;
          const hasActiveChild = visibleItems.some((i) =>
            i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)
          );

          return (
            <div key={category.id} className="space-y-1">
              {/* Expandable Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[0.68rem] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  hasActiveChild
                    ? 'text-cream bg-cream/5 font-bold'
                    : 'text-cream/50 hover:text-cream/80 hover:bg-cream/5'
                }`}
              >
                <span>{category.label}</span>
                <svg
                  className={`w-3.5 h-3.5 text-cream/40 transition-transform duration-200 ${
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Collapsible Menu List */}
              {!isCollapsed && (
                <div className="space-y-0.5 pt-0.5 animate-in fade-in duration-150">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-cream/15 text-cream shadow-2xs font-semibold'
                            : 'text-cream/70 hover:bg-cream/10 hover:text-cream'
                        }`
                      }
                    >
                      <AdminIcon name={item.icon} className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-cream/10 px-5 py-3 text-[0.65rem] text-cream/40 bg-forest-deep flex items-center justify-between">
        <span>© {new Date().getFullYear()} Shraddha Garden</span>
        <span className="text-[10px] bg-cream/10 px-1.5 py-0.5 rounded text-cream/60">v1.0</span>
      </div>
    </div>
  );
}
