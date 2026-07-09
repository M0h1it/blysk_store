import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getSales, getSalesStats, getStoreOrders, getAllStores, getAllOrders } from '../api/services';
import type { SalesQuery } from '../api/types';
import { useApi } from '../hooks/useApi';
import { LoadingState, ErrorState } from '../components/States';
import { SearchBox } from '../components/TableTools';
import { inr, count, num, shortDate } from '../utils/format';

type Tab = 'sales' | 'orders';

export const Reports: React.FC = () => {
  const [tab, setTab] = useState<Tab>('sales');

  // Filters (apply to both the sales ledger and — where relevant — orders).
  const [storeId, setStoreId] = useState('');
  const [source, setSource] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [salesPage, setSalesPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState('');

  const storesReq = useApi(() => getAllStores(), []);
  const stores = storesReq.data?.data ?? [];

  const salesQuery: SalesQuery = useMemo(
    () => ({
      store_id: storeId ? Number(storeId) : undefined,
      source: (source || undefined) as SalesQuery['source'],
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      search: search || undefined,
      page: salesPage,
    }),
    [storeId, source, dateFrom, dateTo, search, salesPage],
  );

  const salesReq = useApi(() => getSales(salesQuery), [
    storeId,
    source,
    dateFrom,
    dateTo,
    search,
    salesPage,
  ]);
  const statsReq = useApi(() => getSalesStats(storeId ? Number(storeId) : undefined), [storeId]);
  const ordersReq = useApi(
    () => getStoreOrders({ store_id: storeId ? Number(storeId) : undefined, page: ordersPage }),
    [storeId, ordersPage],
  );
  // Every POS order (all pages) — powers the summary tiles on the POS Orders tab.
  const posAllReq = useApi(() => getAllOrders(storeId ? Number(storeId) : undefined), [storeId]);

  const sales = salesReq.data?.data ?? [];
  const stats = statsReq.data;
  const allOrders = ordersReq.data?.data ?? [];

  // POS aggregates from the full order set (paid orders only).
  // Net Sale Amount per order = total (gross) − discount.
  const posPaid = useMemo(
    () => (posAllReq.data ?? []).filter((o) => o.status === 1),
    [posAllReq.data],
  );
  const posTotal = posPaid.reduce((s, o) => s + num(o.total) - num(o.discount), 0);
  const posDiscount = posPaid.reduce((s, o) => s + num(o.discount), 0);
  const posCount = posPaid.length;
  const posAov = posCount ? posTotal / posCount : 0;

  // Client-side search over the current orders page.
  const orders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return allOrders;
    return allOrders.filter((o) =>
      [o.order_id, o.store_name, o.customer_name, o.type].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    );
  }, [allOrders, orderSearch]);

  // Daily gross-sales trend from the current sales page.
  const dailyTrend = useMemo(() => {
    const byDate = new Map<string, { date: string; gross: number; units: number }>();
    for (const s of sales) {
      const cur = byDate.get(s.sale_date) ?? { date: s.sale_date, gross: 0, units: 0 };
      cur.gross += num(s.gross_amount);
      cur.units += s.quantity;
      byDate.set(s.sale_date, cur);
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [sales]);

  const resetFilters = () => {
    setStoreId('');
    setSource('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setSalesPage(1);
    setOrdersPage(1);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-gray-800 dark:text-white">
            Sales Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Imported sales ledger and own-store POS orders across all stores.
          </p>
        </div>

        {/* Summary tiles — POS Orders tab shows live order totals; Sales History
            tab shows the imported-ledger stats (from /api/admin/sales/stats). */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tab === 'orders' ? (
            <>
              <Tile label="Total Sales" value={posAllReq.loading ? '…' : inr(posTotal)} emoji="💰" color="bg-blue-600" />
              <Tile label="Orders" value={posAllReq.loading ? '…' : count(posCount)} emoji="🧾" color="bg-emerald-600" />
              <Tile label="Avg Order Value" value={posAllReq.loading ? '…' : inr(posAov)} emoji="📈" color="bg-violet-600" />
              <Tile label="Total Discount" value={posAllReq.loading ? '…' : inr(posDiscount)} emoji="🏷️" color="bg-amber-500" />
            </>
          ) : (
            <>
              <Tile label="Gross Sales" value={statsReq.loading ? '…' : inr(stats?.gross)} emoji="💰" color="bg-blue-600" />
              <Tile label="Units Sold" value={statsReq.loading ? '…' : count(stats?.units)} emoji="📦" color="bg-emerald-600" />
              <Tile label="Sale Lines" value={statsReq.loading ? '…' : count(stats?.lines)} emoji="🧾" color="bg-violet-600" />
              <Tile label="Total Discount" value={statsReq.loading ? '…' : inr(stats?.discount)} emoji="🏷️" color="bg-amber-500" />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Field label="Store">
              <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setSalesPage(1); setOrdersPage(1); }} className="select">
                <option value="">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Source">
              <select value={source} onChange={(e) => { setSource(e.target.value); setSalesPage(1); }} className="select">
                <option value="">All</option>
                <option value="email">Email</option>
                <option value="csv">CSV</option>
                <option value="api">API</option>
              </select>
            </Field>
            <Field label="From">
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setSalesPage(1); }} className="input-field" />
            </Field>
            <Field label="To">
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setSalesPage(1); }} className="input-field" />
            </Field>
            <Field label="Search">
              <input type="text" value={search} placeholder="Product…" onChange={(e) => { setSearch(e.target.value); setSalesPage(1); }} className="input-field" />
            </Field>
            <div className="flex items-end">
              <button onClick={resetFilters} className="btn-secondary w-full text-sm">Reset</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <TabButton active={tab === 'sales'} onClick={() => setTab('sales')}>
            Sales History
          </TabButton>
          <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>
            POS Orders
          </TabButton>
        </div>

        {tab === 'sales' && (
          <>
            {/* Empty-ledger notice — the sales ledger only holds imported/third-party sales. */}
            {!salesReq.loading && (salesReq.data?.meta.total ?? 0) === 0 && (
              <div className="card mb-6 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  No imported sales yet
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  This tab shows third-party / imported sales (CSV &amp; email). Nothing has been
                  imported, so the totals are ₹0. For your own-store sales, open the{' '}
                  <button
                    onClick={() => setTab('orders')}
                    className="underline font-medium hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    POS Orders
                  </button>{' '}
                  tab or the Dashboard.
                </p>
              </div>
            )}

            {/* Daily trend */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Daily Sales Trend (current page)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="gross" stroke="#3B82F6" name="Gross (₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="units" stroke="#10B981" name="Units" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sales ledger table */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Sales History
              </h3>
              {salesReq.loading && <LoadingState />}
              {salesReq.error && <ErrorState message={salesReq.error} onRetry={salesReq.refetch} />}
              {!salesReq.loading && !salesReq.error && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <Th>Date</Th><Th>Product</Th><Th>SKU</Th><Th>Channel</Th>
                          <Th className="text-right">Qty</Th><Th className="text-right">Unit ₹</Th>
                          <Th className="text-right">Gross ₹</Th><Th>Source</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((s) => (
                          <tr key={s.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{shortDate(s.sale_date)}</td>
                            <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{s.product_name ?? `#${s.sku}`}</td>
                            <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{s.sku}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{s.channel}</td>
                            <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">{s.quantity}</td>
                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{inr(s.unit_price)}</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">{inr(s.gross_amount)}</td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded capitalize">{s.source}</span>
                            </td>
                          </tr>
                        ))}
                        {sales.length === 0 && (
                          <tr><td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">No sales match the filters.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Pagination meta={salesReq.data?.meta} onPage={setSalesPage} />
                </>
              )}
            </div>
          </>
        )}

        {tab === 'orders' && (
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Own-Store POS Orders
              </h3>
              <SearchBox
                value={orderSearch}
                onChange={setOrderSearch}
                placeholder="Search order, store, customer…"
              />
            </div>
            {ordersReq.loading && <LoadingState />}
            {ordersReq.error && <ErrorState message={ordersReq.error} onRetry={ordersReq.refetch} />}
            {!ordersReq.loading && !ordersReq.error && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <Th>Order ID</Th><Th>Date</Th><Th>Store</Th><Th>Customer</Th>
                        <Th>Payment</Th><Th className="text-right">Amount</Th>
                        <Th className="text-right">GST</Th><Th className="text-right">Total</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{o.order_id}</td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{shortDate(o.created_at)}</td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{o.store_name}</td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{o.customer_name}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">{o.type}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{inr(o.total)}</td>
                          <td className="py-3 px-4 text-right text-gray-500 dark:text-gray-400">{inr(o.gst)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-gray-200">{inr(o.final_amount)}</td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">No orders found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination meta={ordersReq.data?.meta} onPage={setOrdersPage} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Tile: React.FC<{ label: string; value: string; emoji: string; color: string }> = ({
  label,
  value,
  emoji,
  color,
}) => (
  <div className={`rounded-2xl p-5 shadow-md text-white ${color} transition-transform hover:-translate-y-0.5`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white/90 mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
      <div className="text-2xl bg-black/15 rounded-xl h-11 w-11 flex items-center justify-center">
        {emoji}
      </div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    {children}
  </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);

const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = 'text-left',
}) => (
  <th className={`${className} py-3 px-4 font-semibold text-gray-700 dark:text-gray-300`}>
    {children}
  </th>
);

const Pagination: React.FC<{
  meta?: { current_page: number; last_page: number; total: number };
  onPage: (page: number) => void;
}> = ({ meta, onPage }) => {
  if (!meta || meta.last_page <= 1) {
    return meta ? (
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{count(meta.total)} record(s)</p>
    ) : null;
  }
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Page {meta.current_page} of {meta.last_page} · {count(meta.total)} record(s)
      </p>
      <div className="flex gap-2">
        <button
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Prev
        </button>
        <button
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};
