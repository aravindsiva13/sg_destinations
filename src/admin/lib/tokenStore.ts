import type { AdminUser } from '../types';

const ACCESS = 'sg.accessToken';
const REFRESH = 'sg.refreshToken';
const USER = 'sg.user';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  get refresh() {
    return localStorage.getItem(REFRESH);
  },
  get user(): AdminUser | null {
    const raw = localStorage.getItem(USER);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  },
  set(access: string, refresh: string, user: AdminUser) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
    localStorage.setItem(USER, JSON.stringify(user));
  },
  setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
  },
};
