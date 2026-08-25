import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStore } from './tokenStore';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// Skip ngrok's free-tier browser-warning interstitial for API requests.
const skipNgrokWarning = { 'ngrok-skip-browser-warning': 'true' };

export const api = axios.create({ baseURL, headers: skipNgrokWarning });

/** Plain client (no interceptors) used for the refresh call to avoid loops. */
const refreshClient = axios.create({ baseURL, headers: skipNgrokWarning });

// Attach the access token to every request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

/** Called when a refresh ultimately fails — wired up by the auth context. */
let onAuthExpired: () => void = () => {};
export function setOnAuthExpired(fn: () => void) {
  onAuthExpired = fn;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.refresh;
  if (!refresh) return null;
  try {
    const { data } = await refreshClient.post('/api/auth/refresh', {
      refreshToken: refresh,
    });
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

// On 401, try a single refresh + replay.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retried && tokenStore.refresh) {
      original._retried = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api(original);
      }
      tokenStore.clear();
      onAuthExpired();
    }
    return Promise.reject(error);
  },
);

/** Normalize an Axios error into a readable message. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string })?.error ?? err.message ?? fallback;
  }
  return fallback;
}
