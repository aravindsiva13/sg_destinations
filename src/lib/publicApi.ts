import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? '';

export const CUSTOMER_KEYS = {
  access: 'sg.cust.accessToken',
  refresh: 'sg.cust.refreshToken',
  user: 'sg.cust.user',
} as const;

/** Plain client used for refresh calls to avoid interceptor loops */
const refreshClient = axios.create({
  baseURL,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

/** Public API client for the marketing site + booking flow. Attaches the
 *  customer access token when a guest is signed in. */
export const publicApi = axios.create({
  baseURL,
  // Skip ngrok's free-tier browser-warning interstitial for API requests.
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

publicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(CUSTOMER_KEYS.access);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;
let onCustomerExpired: () => void = () => {};

export function setOnCustomerAuthExpired(fn: () => void) {
  onCustomerExpired = fn;
}

async function refreshCustomerToken(): Promise<string | null> {
  const refresh = localStorage.getItem(CUSTOMER_KEYS.refresh);
  if (!refresh) return null;
  try {
    const { data } = await refreshClient.post('/api/auth/refresh', {
      refreshToken: refresh,
    });
    localStorage.setItem(CUSTOMER_KEYS.access, data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(CUSTOMER_KEYS.refresh, data.refreshToken);
    }
    return data.accessToken as string;
  } catch {
    localStorage.removeItem(CUSTOMER_KEYS.access);
    localStorage.removeItem(CUSTOMER_KEYS.refresh);
    localStorage.removeItem(CUSTOMER_KEYS.user);
    return null;
  }
}

// On 401, attempt to refresh token once and retry
publicApi.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retried) {
      original._retried = true;
      const refreshToken = localStorage.getItem(CUSTOMER_KEYS.refresh);
      if (refreshToken) {
        refreshing = refreshing ?? refreshCustomerToken();
        const newToken = await refreshing;
        refreshing = null;

        if (newToken) {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return publicApi(original);
        }
      }

      // If refresh is unavailable or failed, clear stale customer credentials
      localStorage.removeItem(CUSTOMER_KEYS.access);
      localStorage.removeItem(CUSTOMER_KEYS.refresh);
      localStorage.removeItem(CUSTOMER_KEYS.user);
      onCustomerExpired();
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string })?.error ?? err.message ?? fallback;
  }
  return fallback;
}
