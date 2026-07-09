/**
 * Response shapes for the Blysk Admin API.
 * Mirrors the API documentation (Store Management module, 5 endpoints).
 */

/** Authenticated admin profile returned by the login endpoint. */
export interface ApiUser {
  id: number;
  email: string;
  role: string;
  [key: string]: unknown;
}

/** POST /api/auth/login (API 1). */
export interface LoginResponse {
  token: string;
  user: ApiUser;
}

/** A store record — GET /api/admin/stores/all (API 2). */
export interface ApiStore {
  id: number;
  name: string;
  email: string | null;
  location: string | null;
  store_type: 'main' | 'third_party' | 'popup' | string;
  start_date: string | null;
  end_date: string | null;
  status: number; // 1 = active, 0 = inactive
  created_at: string;
  updated_at: string;
}

/** A single inventory row within a store (API 3, inventories[]). */
export interface InventoryRow {
  id: number;
  store_id: number;
  product_id: number; // shown as "Product SKU"
  category_id: number | null;
  collection_id: number | null;
  stock: number;
  status: string | number;
  product_name: string | null;
  product_image: string | null;
  category_name: string | null;
  collection_name: string | null;
  /** Unit purchase/cost price — optional; enables profit analytics when present. */
  cost_price?: string | number | null;
}

/** A store together with its inventory + per-store counts (API 3). */
export interface StoreInventory {
  store_id: number;
  store_name: string;
  location: string | null;
  store_type: string;
  status: number;
  inventories: InventoryRow[];
  totalProductStock: number; // dashboard "Total Product Stock"
  totalStock: number; // dashboard "Total Stock"
  totalAmount: string; // billed total, 2 decimals — "Total Billing"
  totalOrder: number; // dashboard "Total Order"
}

/** Grand totals across all stores (API 3 meta). */
export interface StoreInventoryMeta {
  total_stores: number;
  grand_total_product_stock: number;
  grand_total_stock: number;
  grand_total_order: number;
  grand_total_billing: string;
}

/** An own-store POS order invoice — GET /api/admin/store-inventory/orders/all (API 4). */
export interface OrderInvoice {
  id: number;
  customer_id: number;
  store_id: number;
  order_id: string; // POS order number ("Order ID")
  total: string; // "Order Amount"
  gst: string;
  final_amount: string;
  type: string; // "Payment Type" (e.g. Cash)
  discount: string;
  status: number;
  created_at: string; // "Date"
  updated_at: string;
  customer_name: string;
  store_name: string;
}

/** A line item within a POS order — GET /api/admin/store-inventory/orders/details/:orderId. */
export interface OrderDetailLine {
  id: number;
  customer_id: number;
  store_id: number;
  product_id: number; // SKU
  category_id: number | null;
  collection_id: number | null;
  qty: number;
  amount: string; // line net amount
  order_id: string;
  status: number;
  product_name: string | null;
}

/** Response of the order-details endpoint: line items + the order header. */
export interface OrderDetailsResponse {
  data: OrderDetailLine[];
  header: OrderInvoice;
}

/** A sold line in the sales ledger — GET /api/admin/sales (API 5). */
export interface SaleLine {
  id: number;
  sku: number;
  product_name: string | null;
  store_id: number | null;
  channel: string;
  sale_date: string; // "Date"
  quantity: number; // "Qty"
  unit_price: string; // "Unit ₹"
  gross_amount: string; // "Gross ₹"
  discount: string;
  source: 'email' | 'csv' | 'api' | string; // "Source"
  source_ref: string;
  stock_reduced: number; // "Stock −"
  category_id: number | null;
}

/** Aggregate tiles — GET /api/admin/sales/stats (API 5 companion). */
export interface SalesStats {
  lines: number;
  units: number;
  gross: string;
  discount: string;
  count: number;
  store_id: number | null;
  store_name: string | null;
}

/** Standard `{ data, meta }` envelope. */
export interface ListResponse<T, M = { total: number }> {
  data: T[];
  meta: M;
}

/** Pagination meta used by the paginated list endpoints (API 4 & 5). */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  store_id?: number | null;
}

export type PaginatedResponse<T> = ListResponse<T, PaginationMeta>;

/** Query params for the store orders list (API 4). */
export interface OrdersQuery {
  store_id?: number;
  page?: number;
}

/** Query params for the sales ledger (API 5). */
export interface SalesQuery {
  store_id?: number;
  source?: 'email' | 'csv' | 'api';
  channel?: string;
  sku?: number;
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  search?: string;
  page?: number;
}
