import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setOnAuthExpired } from '../lib/apiClient';
import { tokenStore } from '../lib/tokenStore';
import type { AdminUser, AuthResponse, Role } from '../types';

interface AuthState {
  user: AdminUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AdminAuthContext = createContext<AuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => tokenStore.user);
  const [ready, setReady] = useState(false);

  // Clear state if a refresh chain ultimately fails.
  useEffect(() => {
    setOnAuthExpired(() => setUser(null));
  }, []);

  // Validate the stored session on first load.
  useEffect(() => {
    let active = true;
    async function bootstrap() {
      if (!tokenStore.access) {
        setReady(true);
        return;
      }
      try {
        const { data } = await api.get<{ user: AdminUser }>('/api/auth/me');
        if (active) setUser(data.user);
      } catch {
        tokenStore.clear();
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
    tokenStore.set(data.accessToken, data.refreshToken, data.user);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh;
    if (refresh) {
      await api.post('/api/auth/logout', { refreshToken: refresh }).catch(() => undefined);
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo(
    () => ({ user, ready, login, logout, hasRole }),
    [user, ready, login, logout, hasRole],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
