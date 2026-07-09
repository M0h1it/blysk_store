import { apiClient } from './client';
import type {
  LoginResponse,
  ApiStore,
  StoreInventory,
  StoreInventoryMeta,
  OrderInvoice,
  OrderDetailLine,
  OrderDetailsResponse,
  SaleLine,
  SalesStats,
  ListResponse,
  PaginatedResponse,
  OrdersQuery,
  SalesQuery,
} from './types';

/**
 * Typed wrappers around every documented Blysk Admin API endpoint.
 * All admin endpoints send the Bearer token automatically (see client.ts).
 */

/* ------------------------------------------------------------------ */
/* API 1 — Auth                                                        */
/* ------------------------------------------------------------------ */

/** POST /api/auth/login — obtain an auth token. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', { email, password });
  return data;
}

/* ------------------------------------------------------------------ */
/* API 2 — Stores                                                      */
/* ------------------------------------------------------------------ */

/** GET /api/admin/stores/all — every store, newest first, no pagination. */
export async function getAllStores(): Promise<ListResponse<ApiStore>> {
  const { data } = await apiClient.get<ListResponse<ApiStore>>('/api/admin/stores/all');
  return data;
}

/* ------------------------------------------------------------------ */
/* API 3 — Store inventory                                             */
/* ------------------------------------------------------------------ */

/** GET /api/admin/store-inventory/all — every store with inventory + grand totals. */
export async function getAllStoreInventory(): Promise<ListResponse<StoreInventory, StoreInventoryMeta>> {
  const { data } = await apiClient.get<ListResponse<StoreInventory, StoreInventoryMeta>>(
    '/api/admin/store-inventory/all',
  );
  return data;
}

/** GET /api/admin/store-inventory/stores/:storeId/view — one store's dashboard. */
export async function getStoreInventoryView(storeId: number): Promise<StoreInventory> {
  const { data } = await apiClient.get<StoreInventory>(
    `/api/admin/store-inventory/stores/${storeId}/view`,
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* API 4 — Store orders (own-store POS)                                */
/* ------------------------------------------------------------------ */

/** GET /api/admin/store-inventory/orders/all — POS orders across stores (paginated 20/page). */
export async function getStoreOrders(query: OrdersQuery = {}): Promise<PaginatedResponse<OrderInvoice>> {
  const { data } = await apiClient.get<PaginatedResponse<OrderInvoice>>(
    '/api/admin/store-inventory/orders/all',
    { params: query },
  );
  return data;
}

/** GET /api/admin/store-inventory/orders/details/:orderId — line items for one order. */
export async function getOrderDetails(orderId: string | number): Promise<OrderDetailsResponse> {
  const { data } = await apiClient.get<OrderDetailsResponse>(
    `/api/admin/store-inventory/orders/details/${orderId}`,
  );
  return data;
}

/**
 * Fetch EVERY order across all pages (optionally for one store). Page 1 is
 * fetched first to learn the page count, then the rest are fetched in parallel.
 */
export async function getAllOrders(storeId?: number): Promise<OrderInvoice[]> {
  const first = await getStoreOrders({ store_id: storeId, page: 1 });
  const all = [...first.data];
  const lastPage = first.meta?.last_page ?? 1;
  if (lastPage > 1) {
    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        getStoreOrders({ store_id: storeId, page: i + 2 }),
      ),
    );
    for (const r of rest) all.push(...r.data);
  }
  return all;
}

/**
 * Fetch the line items for many orders with bounded concurrency. Failed
 * fetches are skipped so one bad order can't break the whole aggregation.
 */
export async function getAllOrderLines(
  orderIds: string[],
  opts: { concurrency?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<OrderDetailLine[]> {
  const { concurrency = 10, onProgress } = opts;
  const lines: OrderDetailLine[] = [];
  let idx = 0;
  let done = 0;

  const worker = async () => {
    while (idx < orderIds.length) {
      const my = idx++;
      try {
        const res = await getOrderDetails(orderIds[my]);
        if (res?.data) lines.push(...res.data);
      } catch {
        /* skip a failed order */
      }
      done++;
      onProgress?.(done, orderIds.length);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, orderIds.length || 1) }, worker));
  return lines;
}

/** GET /api/admin/store-inventory/stores/:storeId/orders — per-store paginated orders. */
export async function getStoreOrdersByStore(
  storeId: number,
  page = 1,
): Promise<PaginatedResponse<OrderInvoice>> {
  const { data } = await apiClient.get<PaginatedResponse<OrderInvoice>>(
    `/api/admin/store-inventory/stores/${storeId}/orders`,
    { params: { page } },
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* API 5 — Sales history (third-party / imported)                      */
/* ------------------------------------------------------------------ */

/** GET /api/admin/sales — imported sales ledger with rich filtering (paginated 20/page). */
export async function getSales(query: SalesQuery = {}): Promise<PaginatedResponse<SaleLine>> {
  const { data } = await apiClient.get<PaginatedResponse<SaleLine>>('/api/admin/sales', {
    params: query,
  });
  return data;
}

/** GET /api/admin/sales/stats — aggregate tiles for the sales summary cards. */
export async function getSalesStats(storeId?: number): Promise<SalesStats> {
  const { data } = await apiClient.get<SalesStats>('/api/admin/sales/stats', {
    params: storeId ? { store_id: storeId } : undefined,
  });
  return data;
}
