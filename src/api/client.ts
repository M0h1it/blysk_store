import axios, { AxiosError } from 'axios';
import { API_BASE_URL, STORAGE_KEYS, AUTH_LOGOUT_EVENT } from './config';

/**
 * Shared axios instance pointed at the Blysk Admin API base URL.
 *
 * - A request interceptor attaches the Bearer token from localStorage.
 * - A response interceptor clears the session and emits `blysk:auth-logout`
 *   on a 401 so the UI can bounce back to the login screen.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token missing/expired — drop the session and let the app react.
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
    return Promise.reject(normalizeError(error));
  },
);

/** Human-readable message extracted from an axios error. */
export interface ApiError {
  status?: number;
  message: string;
}

function normalizeError(error: AxiosError): ApiError {
  const status = error.response?.status;
  const data = error.response?.data as { message?: string; error?: string } | undefined;

  let message = data?.message || data?.error || error.message;

  // Friendlier defaults for the documented status codes.
  switch (status) {
    case 401:
      message = 'Session expired or not authorized. Please log in again.';
      break;
    case 403:
      message = 'You do not have admin access for this resource.';
      break;
    case 422:
      message = message || 'Invalid request parameters.';
      break;
    case 429:
      message = 'Too many attempts. Please wait a minute and try again.';
      break;
    default:
      if (error.code === 'ERR_NETWORK') {
        message = `Cannot reach the API at ${API_BASE_URL}. Is the backend running?`;
      }
  }

  return { status, message };
}
