import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS, AUTH_LOGOUT_EVENT } from './config';

/** Config flag so a request is only auto-retried once after a 429. */
type RetryConfig = InternalAxiosRequestConfig & { _retried429?: boolean };

/** How long we're willing to auto-wait on a 429 before giving up (seconds). */
const MAX_RETRY_WAIT_S = 60;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Shared axios instance pointed at the Blysk Admin API base URL.
 *
 * - A request interceptor attaches the Bearer token from localStorage.
 * - A response interceptor: on 429 it waits out the server's Retry-After and
 *   retries once; on 401 it clears the session and emits `blysk:auth-logout`.
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
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;

    // Rate limited: honor Retry-After (capped) and retry the request once.
    if (error.response?.status === 429 && config && !config._retried429) {
      const headers = error.response.headers as Record<string, string>;
      const retryAfter =
        Number(headers['retry-after']) ||
        Number(headers['ratelimit-reset']) ||
        5;
      config._retried429 = true;
      await sleep(Math.min(retryAfter, MAX_RETRY_WAIT_S) * 1000);
      return apiClient(config);
    }

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
  const data = error.response?.data as
    | { message?: string; error?: string | { code?: string; message?: string } }
    | undefined;

  // The API returns errors as { error: { code, message } }, so `error` may be an
  // object — never assign it straight to `message` or React will crash (#31).
  const errField = data?.error;
  let message =
    data?.message ||
    (typeof errField === 'string' ? errField : errField?.message) ||
    error.message;

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