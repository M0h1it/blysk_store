import React, { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Percent,
  Package,
  AlertTriangle,
  Trophy,
  Wallet,
  Boxes,
  LineChart as LineIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardData } from '../hooks/useDashboardData';
import { LoadingState, ErrorState } from './States';
import { SearchBox, Paginator, PAGE_SIZE } from './TableTools';
import { inr, count, num, periodKey, periodLabel, type TrendMode } from '../utils/format';

const CAT_COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0891b2', '#db2777'];
const PAY_COLORS: Record<string, string> = { Cash: '#059669', UPI: '#2563eb', Card: '#7c3aed' };

type Tab = 'overview' | 'sales' | 'inventory' | 'profit';

export const Dashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const [storeId, setStoreId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [trendMode, setTrendMode] = useState<TrendMode>('daily');
  const [profitMode, setProfitMode] = useState<TrendMode>('daily');
  const [lowSearch, setLowSearch] = useState('');
  const [lowPage, setLowPage] = useState(1);

  const { inventory, orders, lines, loading, linesLoading, progress, error, reload } =
    useDashboardData();

  const sid = storeId ? Number(storeId) : null;

  const inRange = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;
    return (iso: string) => {
      if (from === null && to === null) return true;
      const t = new Date(iso).getTime();
      if (from !== null && t < from) return false;
      if (to !== null && t > to) return false;
      return true;
    };
  }, [dateFrom, dateTo]);

  // Product maps from inventory.
  const productMap = useMemo(() => {
    const m = new Map<number, { name: string; category: string }>();
    for (const s of inventory)
      for (const r of s.inventories)
        if (!m.has(r.product_id))
          m.set(r.product_id, {
            name: (r.product_name ?? '').trim() || `#${r.product_id}`,
            category: r.category_name ?? 'Uncategorized',
          });
    return m;
  }, [inventory]);

  const categoryById = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of inventory)
      for (const r of s.inventories)
        if (r.category_id != null && r.category_name) m.set(r.category_id, r.category_name);
    return m;
  }, [inventory]);

  // Unit cost per SKU (only if the API provides cost_price).
  const costMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of inventory)
      for (const r of s.inventories)
        if (r.cost_price != null && !m.has(r.product_id)) m.set(r.product_id, num(r.cost_price));
    return m;
  }, [inventory]);
  const hasCost = costMap.size > 0;

  // Paid orders within the store + date filter.
  const paidOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status === 1 && (sid === null || o.store_id === sid) && inRange(o.created_at),
      ),
    [orders, sid, inRange],
  );
  const paidIds = useMemo(() => new Set(paidOrders.map((o) => o.order_id)), [paidOrders]);

  // Line items belonging to the filtered orders.
  const filteredLines = useMemo(() => lines.filter((l) => paidIds.has(l.order_id)), [lines, paidIds]);
  const linesByOrder = useMemo(() => {
    const m = new Map<string, typeof lines>();
    for (const l of lines) {
      const arr = m.get(l.order_id) ?? [];
      arr.push(l);
      m.set(l.order_id, arr);
    }
    return m;
  }, [lines]);

  // Inventory rows (store filter only — stock is a current snapshot).
  const invRows = useMemo(
    () =>
      inventory
        .filter((s) => sid === null || s.store_id === sid)
        .flatMap((s) => s.inventories.map((r) => ({ ...r, store_name: s.store_name }))),
    [inventory, sid],
  );

  /* ---- headline metrics (Net Sale Amount = total − discount) ---- */
  const revenue = paidOrders.reduce((s, o) => s + num(o.total) - num(o.discount), 0);
  const orderCount = paidOrders.length;
  const discounts = paidOrders.reduce((s, o) => s + num(o.discount), 0);
  const aov = orderCount ? revenue / orderCount : 0;

  /* ---- profit ---- */
  const profit = useMemo(() => {
    let cogs = 0;
    let net = 0;
    const soldSkus = new Set<number>();
    const coveredSkus = new Set<number>();
    for (const o of paidOrders) {
      net += num(o.total) - num(o.discount);
      for (const l of linesByOrder.get(o.order_id) ?? []) {
        soldSkus.add(l.product_id);
        const c = costMap.get(l.product_id);
        if (c != null) {
          coveredSkus.add(l.product_id);
          cogs += l.qty * c;
        }
      }
    }
    return {
      net,
      cogs,
      total: net - cogs,
      margin: net ? ((net - cogs) / net) * 100 : 0,
      coverage: soldSkus.size ? coveredSkus.size / soldSkus.size : 0,
      soldSkus: soldSkus.size,
      coveredSkus: coveredSkus.size,
    };
  }, [paidOrders, linesByOrder, costMap]);

  /* ---- trends ---- */
  const buildTrend = (mode: TrendMode, valueFn: (o: (typeof orders)[number]) => number) => {
    const map = new Map<string, number>();
    for (const o of paidOrders) {
      const k = periodKey(o.created_at, mode);
      map.set(k, (map.get(k) ?? 0) + valueFn(o));
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({ label: periodLabel(key, mode), value }));
  };
  const salesTrend = useMemo(
    () => buildTrend(trendMode, (o) => num(o.total) - num(o.discount)),
    [paidOrders, trendMode],
  );
  const profitTrend = useMemo(
    () =>
      buildTrend(profitMode, (o) => {
        const cogs = (linesByOrder.get(o.order_id) ?? []).reduce(
          (s, l) => s + l.qty * (costMap.get(l.product_id) ?? 0),
          0,
        );
        return num(o.total) - num(o.discount) - cogs;
      }),
    [paidOrders, profitMode, linesByOrder, costMap],
  );

  /* ---- payment + store breakdowns ---- */
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const o of paidOrders) {
      const cur = map.get(o.type) ?? { count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += num(o.total) - num(o.discount);
      map.set(o.type, cur);
    }
    return [...map.entries()].map(([type, v]) => ({ type, ...v }));
  }, [paidOrders]);

  const revenueByStore = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of paidOrders) map.set(o.store_name, (map.get(o.store_name) ?? 0) + num(o.total) - num(o.discount));
    return [...map.entries()].map(([store, revenue]) => ({ store, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [paidOrders]);

  /* ---- items + categories ---- */
  const topItems = useMemo(() => {
    const map = new Map<number, { name: string; qty: number; revenue: number }>();
    for (const l of filteredLines) {
      const cur = map.get(l.product_id) ?? {
        name: (l.product_name ?? '').trim() || productMap.get(l.product_id)?.name || `#${l.product_id}`,
        qty: 0,
        revenue: 0,
      };
      cur.qty += l.qty;
      cur.revenue += num(l.amount);
      map.set(l.product_id, cur);
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [filteredLines, productMap]);

  const salesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of filteredLines) {
      const cat =
        productMap.get(l.product_id)?.category ??
        (l.category_id != null ? categoryById.get(l.category_id) : undefined) ??
        'Uncategorized';
      map.set(cat, (map.get(cat) ?? 0) + num(l.amount));
    }
    return [...map.entries()].map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
  }, [filteredLines, productMap, categoryById]);

  /* ---- inventory ---- */
  const totalStock = invRows.reduce((s, r) => s + r.stock, 0);
  const inventoryByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of invRows) map.set(r.category_name ?? 'Uncategorized', (map.get(r.category_name ?? 'Uncategorized') ?? 0) + r.stock);
    return [...map.entries()].map(([category, stock]) => ({ category, stock })).sort((a, b) => b.stock - a.stock);
  }, [invRows]);

  const lowStockAll = useMemo(() => invRows.filter((r) => r.stock <= 2).sort((a, b) => a.stock - b.stock), [invRows]);
  const lowStock = useMemo(() => {
    const q = lowSearch.trim().toLowerCase();
    if (!q) return lowStockAll;
    return lowStockAll.filter((r) =>
      [r.product_name, r.category_name, r.store_name, String(r.product_id)].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [lowStockAll, lowSearch]);
  const lowPageCount = Math.max(1, Math.ceil(lowStock.length / PAGE_SIZE));
  const lowPaged = lowStock.slice((lowPage - 1) * PAGE_SIZE, lowPage * PAGE_SIZE);
  useEffect(() => setLowPage(1), [lowSearch, storeId]);

  if (loading) return <PageShell><LoadingState label="Loading orders & inventory…" /></PageShell>;
  if (error)
    return (
      <PageShell>
        <ErrorState message={error} onRetry={reload} />
      </PageShell>
    );

  const analyzing = linesLoading;

  return (
    <PageShell>
      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Store">
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="select">
              <option value="">All Stores</option>
              {inventory.map((s) => (
                <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
              ))}
            </select>
          </Field>
          <Field label="From">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
          </Field>
          <Field label="To">
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
          </Field>
          <div className="flex items-end">
            <button
              onClick={() => { setStoreId(''); setDateFrom(''); setDateTo(''); }}
              className="btn-secondary w-full text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={<LineIcon size={16} />}>Overview</TabButton>
        <TabButton active={tab === 'sales'} onClick={() => setTab('sales')} icon={<TrendingUp size={16} />}>Sales</TabButton>
        <TabButton active={tab === 'inventory'} onClick={() => setTab('inventory')} icon={<Boxes size={16} />}>Inventory</TabButton>
        <TabButton active={tab === 'profit'} onClick={() => setTab('profit')} icon={<Wallet size={16} />}>Profit</TabButton>
      </div>

      {/* ---------------- OVERVIEW ---------------- */}
      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Metric label="Total Revenue" value={inr(revenue)} icon={<DollarSign size={22} className="text-white" />} color="bg-blue-600" />
            <Metric label="Orders" value={count(orderCount)} icon={<ShoppingCart size={22} className="text-white" />} color="bg-emerald-600" />
            <Metric label="Avg Order Value" value={inr(aov)} icon={<TrendingUp size={22} className="text-white" />} color="bg-violet-600" />
            <Metric
              label="Net Profit"
              value={!hasCost ? 'N/A' : analyzing ? '…' : inr(profit.total)}
              icon={<Wallet size={22} className="text-white" />}
              color="bg-rose-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Metric label="Discounts Given" value={inr(discounts)} icon={<Percent size={22} className="text-white" />} color="bg-amber-500" />
            <Metric label="Total Stock" value={count(totalStock)} icon={<Package size={22} className="text-white" />} color="bg-cyan-600" />
            <Metric label="Low Stock (≤2)" value={count(lowStockAll.length)} icon={<AlertTriangle size={22} className="text-white" />} color="bg-red-600" />
            <Metric label="Categories" value={count(inventoryByCategory.length)} icon={<Boxes size={22} className="text-white" />} color="bg-slate-600" />
          </div>

          <ChartCard title="Sales Trend" trailing={<TrendToggle mode={trendMode} onChange={setTrendMode} />}>
            <TrendChart data={salesTrend} name="Revenue (₹)" color="#2563eb" />
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <ChartCard title="Payment Methods">
              {paymentBreakdown.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={paymentBreakdown} dataKey="amount" nameKey="type" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.type}>
                      {paymentBreakdown.map((e, i) => (
                        <Cell key={i} fill={PAY_COLORS[e.type] ?? CAT_COLORS[i % CAT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => inr(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard title="Revenue by Store">
              {revenueByStore.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueByStore}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="store" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => inr(v)} />
                    <Bar dataKey="revenue" name="Revenue (₹)" radius={[4, 4, 0, 0]}>
                      {revenueByStore.map((_e, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </>
      )}

      {/* ---------------- SALES ---------------- */}
      {tab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Sales by Category">
            {analyzing ? <AnalyzingNote progress={progress} /> : salesByCategory.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={salesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => inr(v)} />
                  <Bar dataKey="value" name="Sales (₹)" radius={[4, 4, 0, 0]}>
                    {salesByCategory.map((_e, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Top Selling Items</h3>
            </div>
            {analyzing ? <AnalyzingNote progress={progress} /> : topItems.length === 0 ? <Empty /> : (
              <div className="space-y-2">
                {topItems.map((item, i) => (
                  <div key={item.name + i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-sm font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="flex-1 truncate text-gray-800 dark:text-gray-200 font-medium">{item.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{inr(item.revenue)}</span>
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200 text-xs font-semibold">{count(item.qty)} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- INVENTORY ---------------- */}
      {tab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Inventory Available (Category-wise)" icon={<Package size={18} className="text-violet-600" />}>
            {inventoryByCategory.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={inventoryByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="stock" name="Available Stock" radius={[0, 4, 4, 0]}>
                    {inventoryByCategory.map((_e, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Low Stock Items ({lowStock.length})</h3>
              </div>
              <SearchBox value={lowSearch} onChange={setLowSearch} placeholder="Search…" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <tr><Th>Product</Th><Th>Category</Th><Th>Store</Th><Th className="text-right">Stock</Th></tr>
                </thead>
                <tbody>
                  {lowPaged.map((r) => (
                    <tr key={r.id} className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-2.5 px-4 text-gray-800 dark:text-gray-200 font-medium">{r.product_name ?? `#${r.product_id}`}</td>
                      <td className="py-2.5 px-4 text-gray-600 dark:text-gray-400">{r.category_name ?? '—'}</td>
                      <td className="py-2.5 px-4 text-gray-600 dark:text-gray-400">{r.store_name}</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.stock === 0 ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-100' : 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100'}`}>{r.stock}</span>
                      </td>
                    </tr>
                  ))}
                  {lowStock.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">No low-stock items 🎉</td></tr>}
                </tbody>
              </table>
            </div>
            <Paginator page={lowPage} pageCount={lowPageCount} total={lowStock.length} onPage={setLowPage} />
          </div>
        </div>
      )}

      {/* ---------------- PROFIT ---------------- */}
      {tab === 'profit' && (
        <>
          {!hasCost ? (
            <div className="card border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={22} />
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200">Profit needs cost data</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    No item cost is available from the API yet. Add a <code className="px-1 rounded bg-amber-100 dark:bg-amber-900">cost_price</code>{' '}
                    field (unit purchase cost) to each inventory row in{' '}
                    <code className="px-1 rounded bg-amber-100 dark:bg-amber-900">GET /api/admin/store-inventory/all</code>. Profit is then computed as
                    (order total − discount) − Σ(qty × cost_price). This tab will fill in automatically once the field is present.
                  </p>
                </div>
              </div>
            </div>
          ) : analyzing ? (
            <div className="card"><AnalyzingNote progress={progress} /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Metric label="Net Profit" value={inr(profit.total)} icon={<Wallet size={22} className="text-white" />} color="bg-emerald-600" />
                <Metric label="Profit Margin" value={`${profit.margin.toFixed(1)}%`} icon={<Percent size={22} className="text-white" />} color="bg-blue-600" />
                <Metric label="Revenue (Net)" value={inr(profit.net)} icon={<DollarSign size={22} className="text-white" />} color="bg-violet-600" />
                <Metric label="Cost of Goods" value={inr(profit.cogs)} icon={<Package size={22} className="text-white" />} color="bg-rose-600" />
              </div>

              {profit.coverage < 1 && (
                <div className="card mb-6 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500">
                  Cost price is set for {profit.coveredSkus}/{profit.soldSkus} sold SKUs
                  ({Math.round(profit.coverage * 100)}%). Profit may be understated for SKUs without a cost.
                </div>
              )}

              <ChartCard title="Profit Trend" trailing={<TrendToggle mode={profitMode} onChange={setProfitMode} />}>
                <TrendChart data={profitTrend} name="Profit (₹)" color="#059669" />
              </ChartCard>
            </>
          )}
        </>
      )}
    </PageShell>
  );
};

/* ------------------------------ helpers ------------------------------ */

const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-gray-800 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Live sales, inventory & profit across all Blysk stores.</p>
      </div>
      {children}
    </div>
  </div>
);

const Metric: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className={`rounded-2xl p-5 shadow-md text-white ${color} transition-transform hover:-translate-y-0.5`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white/90 mb-1">{label}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
      <div className="bg-black/15 rounded-xl h-11 w-11 flex items-center justify-center">{icon}</div>
    </div>
  </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }> = ({ active, onClick, icon, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
      active ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    {icon}
    {children}
  </button>
);

const ChartCard: React.FC<{ title: string; icon?: React.ReactNode; trailing?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, trailing, children }) => (
  <div className="card">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
      </div>
      {trailing}
    </div>
    {children}
  </div>
);

const TrendToggle: React.FC<{ mode: TrendMode; onChange: (m: TrendMode) => void }> = ({ mode, onChange }) => (
  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
    {(['daily', 'weekly', 'monthly'] as TrendMode[]).map((m) => (
      <button
        key={m}
        onClick={() => onChange(m)}
        className={`px-3 py-1.5 text-sm rounded-md font-medium capitalize transition-colors ${
          mode === m ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {m}
      </button>
    ))}
  </div>
);

const TrendChart: React.FC<{ data: { label: string; value: number }[]; name: string; color: string }> = ({ data, name, color }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="label" />
      <YAxis />
      <Tooltip formatter={(v: number) => inr(v)} />
      <Legend />
      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} name={name} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

const AnalyzingNote: React.FC<{ progress: { done: number; total: number } }> = ({ progress }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
    <div className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
      <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
    </div>
    <p className="text-sm">Analyzing orders… {progress.done}/{progress.total}</p>
  </div>
);

const Empty: React.FC = () => (
  <div className="py-20 text-center text-gray-500 dark:text-gray-400 text-sm">No data for this filter.</div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    {children}
  </div>
);

const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = 'text-left' }) => (
  <th className={`${className} py-3 px-4 font-semibold text-gray-700 dark:text-gray-300`}>{children}</th>
);
