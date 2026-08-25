import { NavLink } from 'react-router-dom';
import AdminIcon, { type AdminIconName } from './AdminIcon';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: AdminIconName;
  end?: boolean;
  roles?: Role[];
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: 'bookings' },
  { to: '/admin/stays', label: 'Stays', icon: 'stays' },
  { to: '/admin/availability', label: 'Availability', icon: 'pricing', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/amenities', label: 'Amenities', icon: 'content', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/dining', label: 'Dining', icon: 'content', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/menu', label: 'Food Menu', icon: 'content', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/addons', label: 'Add-ons', icon: 'offers', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/events', label: 'Events', icon: 'content', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/offers', label: 'Offers', icon: 'offers', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/coupons', label: 'Coupons', icon: 'offers', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/banners', label: 'Home & Banners', icon: 'banners', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
  { to: '/admin/enquiries', label: 'Enquiries', icon: 'enquiries' },
  { to: '/admin/media', label: 'Media', icon: 'media', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/reports', label: 'Reports', icon: 'reports', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/users', label: 'Users & Staff', icon: 'users', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/payments', label: 'Payments', icon: 'offers', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/email', label: 'Email', icon: 'enquiries', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/campaigns', label: 'Campaigns', icon: 'enquiries', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/settings', label: 'Settings', icon: 'settings', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/audit', label: 'Audit Log', icon: 'audit', roles: ['SUPER_ADMIN'] },
];

interface SidebarProps {
  role: Role;
  onNavigate?: () => void;
}

export default function Sidebar({ role, onNavigate }: SidebarProps) {
  const items = NAV.filter((i) => !i.roles || i.roles.includes(role));

  return (
    <div className="flex h-full flex-col bg-forest-deep text-cream/90">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cream/10 font-serif text-lg italic text-cream">
          S
        </span>
        <div className="leading-tight">
          <p className="font-serif text-lg text-cream">Shraddha Garden</p>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-cream/50">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-cream/15 text-cream'
                  : 'text-cream/70 hover:bg-cream/10 hover:text-cream'
              }`
            }
          >
            <AdminIcon name={item.icon} className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-cream/10 px-6 py-4 text-[0.65rem] text-cream/40">
        © {new Date().getFullYear()} Shraddha Garden Resort
      </div>
    </div>
  );
}
