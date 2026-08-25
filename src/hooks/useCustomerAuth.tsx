import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { publicApi, CUSTOMER_KEYS } from '../lib/publicApi';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
}

interface AuthState {
  user: CustomerUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  signOut: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

function readUser(): CustomerUser | null {
  const raw = localStorage.getItem(CUSTOMER_KEYS.user);
  return raw ? (JSON.parse(raw) as CustomerUser) : null;
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(readUser);

  const persist = useCallback((accessToken: string, u: CustomerUser) => {
    localStorage.setItem(CUSTOMER_KEYS.access, accessToken);
    localStorage.setItem(CUSTOMER_KEYS.user, JSON.stringify(u));
    setUser(u);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data } = await publicApi.post('/api/auth/login', { email, password });
      persist(data.accessToken, data.user);
    },
    [persist],
  );

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const { data } = await publicApi.post('/api/auth/register', input);
      persist(data.accessToken, data.user);
    },
    [persist],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(CUSTOMER_KEYS.access);
    localStorage.removeItem(CUSTOMER_KEYS.user);
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await publicApi.post('/api/auth/forgot-password', { email });
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await publicApi.post('/api/auth/reset-password', { token, password });
  }, []);

  const value = useMemo(
    () => ({ user, signIn, register, signOut, forgotPassword, resetPassword }),
    [user, signIn, register, signOut, forgotPassword, resetPassword],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
