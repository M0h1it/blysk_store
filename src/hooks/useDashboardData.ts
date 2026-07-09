import { useEffect, useState } from 'react';
import {
  getAllStoreInventory,
  getAllOrders,
  getAllOrderLines,
} from '../api/services';
import type { StoreInventory, StoreInventoryMeta, OrderInvoice, OrderDetailLine } from '../api/types';
import type { ApiError } from '../api/client';

interface DashboardData {
  inventory: StoreInventory[];
  inventoryMeta: StoreInventoryMeta | null;
  orders: OrderInvoice[];
  lines: OrderDetailLine[];
  /** Inventory + orders are ready (headline metrics + trend can render). */
  loading: boolean;
  /** Line items still streaming in (top items + category breakdown). */
  linesLoading: boolean;
  progress: { done: number; total: number };
  error: string | null;
  reload: () => void;
}

const toMsg = (err: unknown): string =>
  err && typeof err === 'object' && 'message' in err
    ? (err as ApiError).message
    : 'Failed to load dashboard data.';

/**
 * Loads everything the dashboard needs, once: store inventory, every order
 * (all pages), and every order's line items (bounded concurrency, with
 * progress). Store filtering happens client-side, so this never re-fetches.
 */
export function useDashboardData(): DashboardData {
  const [inventory, setInventory] = useState<StoreInventory[]>([]);
  const [inventoryMeta, setInventoryMeta] = useState<StoreInventoryMeta | null>(null);
  const [orders, setOrders] = useState<OrderInvoice[]>([]);
  const [lines, setLines] = useState<OrderDetailLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [linesLoading, setLinesLoading] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLinesLoading(true);
    setError(null);
    setProgress({ done: 0, total: 0 });

    (async () => {
      try {
        // Inventory + all orders in parallel — these drive the headline cards.
        const [inv, allOrders] = await Promise.all([getAllStoreInventory(), getAllOrders()]);
        if (cancelled) return;

        setInventory(inv.data);
        setInventoryMeta(inv.meta);
        setOrders(allOrders);
        setLoading(false);

        // Then stream in every order's line items for item/category analytics.
        const ids = allOrders.map((o) => o.order_id);
        setProgress({ done: 0, total: ids.length });
        const allLines = await getAllOrderLines(ids, {
          concurrency: 12,
          onProgress: (done, total) => {
            if (!cancelled) setProgress({ done, total });
          },
        });
        if (cancelled) return;
        setLines(allLines);
        setLinesLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(toMsg(err));
          setLoading(false);
          setLinesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return {
    inventory,
    inventoryMeta,
    orders,
    lines,
    loading,
    linesLoading,
    progress,
    error,
    reload: () => setNonce((n) => n + 1),
  };
}
