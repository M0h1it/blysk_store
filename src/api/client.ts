import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS, AUTH_LOGOUT_EVENT } from './config';

/** Config flag so a request is only auto-retried a limited number of times. */
type RetryConfig = InternalAxiosRequestConfig & { _retryCount?: number };

/** Max auto-retries for a transient failure. */
const MAX_RETRIES = 2;

/** How long we're willing to auto-wait on a 429 before giving up (seconds). */
const MAX_RETRY_WAIT_S = 60;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** Statuses worth retrying: rate limit + transient server errors. */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

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
    const status = error.response?.status;
    const attempt = config?._retryCount ?? 0;

    // Retry rate limits (429) and transient server errors (500/502/503/504).
    // Login is idempotent, so retrying it is safe.
    if (config && status && RETRYABLE.has(status) && attempt < MAX_RETRIES) {
      config._retryCount = attempt + 1;

      let waitS: number;
      if (status === 429) {
        const headers = error.response!.headers as Record<string, string>;
        const retryAfter =
          Number(headers['retry-after']) || Number(headers['ratelimit-reset']) || 5;
        waitS = Math.min(retryAfter, MAX_RETRY_WAIT_S);
      } else {
        waitS = Math.min(2 ** attempt, 5); // 1s, 2s backoff for transient 5xx
      }

      await sleep(waitS * 1000);
      return apiClient(config);
    }

    if (status === 401) {
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

  const errField = data?.error;
  let message =
    data?.message ||
    (typeof errField === 'string' ? errField : errField?.message) ||
    error.message;

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