/**
 * Central API configuration.
 *
 * The base URL comes from `VITE_API_BASE_URL`. When unset it defaults to an
 * empty string, so requests use relative `/api/...` paths that are handled by
 * the same-origin serverless proxy (see `api/[...path].js`).
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

/**
 * Credentials used to authenticate against the auth API automatically.
 * These are the API sign-in details (not a manual admin-login form).
 */
export const API_AUTH_CREDENTIALS = {
  email: (import.meta.env.VITE_API_AUTH_EMAIL as string | undefined) ?? '',
  password: (import.meta.env.VITE_API_AUTH_PASSWORD as string | undefined) ?? '',
} as const;

/** localStorage keys used for the auth session. */
export const STORAGE_KEYS = {
  token: 'blysk_token',
  user: 'blysk_user',
} as const;

/** Window event fired when the API returns 401 so the app can log out. */
export const AUTH_LOGOUT_EVENT = 'blysk:auth-logout';