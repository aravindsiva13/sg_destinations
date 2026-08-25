import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/** Public API client for the marketing site + booking flow. Attaches the
 *  customer access token when a guest is signed in. */
export const publicApi = axios.create({
  baseURL,
  // Skip ngrok's free-tier browser-warning interstitial for API requests.
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

export const CUSTOMER_KEYS = {
  access: 'sg.cust.accessToken',
  user: 'sg.cust.user',
} as const;

publicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(CUSTOMER_KEYS.access);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string })?.error ?? err.message ?? fallback;
  }
  return fallback;
}
