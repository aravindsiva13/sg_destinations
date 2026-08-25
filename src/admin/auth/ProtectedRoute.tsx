import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext';
import { ADMIN_ROLES } from '../constants';
import type { Role } from '../types';

interface ProtectedRouteProps {
  /** If given, the user must hold one of these roles (in addition to being an admin). */
  roles?: Role[];
}

/** Guards admin routes: requires auth, an admin role, and optionally a specific role. */
export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, ready } = useAdminAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream text-muted">
        <span className="animate-pulse text-sm tracking-wide">Loading…</span>
      </div>
    );
  }

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
