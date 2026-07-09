/**
 * Central API configuration.
 *
 * The base URL comes from the Vite env var `VITE_API_BASE_URL` (see `.env`),
 * falling back to the documented local backend at http://localhost:4000.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:4000';

/**
 * Credentials used to authenticate against the auth API automatically.
 * These are the API sign-in details (not a manual admin-login form).
 */
export const API_AUTH_CREDENTIALS = {
  email: (import.meta.env.VITE_API_AUTH_EMAIL as string | undefined) ?? 'admin@gmail.com',
  password: (import.meta.env.VITE_API_AUTH_PASSWORD as string | undefined) ?? 'Rana@123',
} as const;

/** localStorage keys used for the auth session. */
export const STORAGE_KEYS = {
  token: 'blysk_token',
  user: 'blysk_user',
} as const;

/** Window event fired when the API returns 401 so the app can log out. */
export const AUTH_LOGOUT_EVENT = 'blysk:auth-logout';
