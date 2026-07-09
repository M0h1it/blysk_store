import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getAllStoreInventory } from '../api/services';
import { useApi } from '../hooks/useApi';
import { LoadingState, ErrorState } from '../components/States';
import { SearchBox, Paginator, PAGE_SIZE } from '../components/TableTools';
import { count } from '../utils/format';

const LOW_STOCK_THRESHOLD = 5;

// Deterministic pastel color per category name, so each category reads distinctly.
const CATEGORY_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-200',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200',
];
const categoryColor = (name: string | null): string => {
  if (!name) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
};

export const Inventory: React.FC = () => {
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'stock'>('name');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const req = useApi(() => getAllStoreInventory(), []);
  const stores = req.data?.data ?? [];
  const meta = req.data?.meta;

  // Flatten every store's inventory rows into one list with store name attached.
  const allRows = useMemo(
    () =>
      stores.flatMap((s) =>
        s.inventories.map((row) => ({ ...row, store_name: s.store_name })),
      ),
    [stores],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(allRows.map((r) => r.category_name).filter((c): c is string => !!c)),
      ).sort(),
    [allRows],
  );

  const filtered = useMemo(() => {
    return allRows
      .filter((row) => {
        if (selectedStore && String(row.store_id) !== selectedStore) return false;
        if (selectedCategory && row.category_name !== selectedCategory) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name')
          return (a.product_name ?? '').localeCompare(b.product_name ?? '');
        return b.stock - a.stock;
      });
  }, [allRows, selectedStore, selectedCategory, sortBy]);

  const totalStock = filtered.reduce((sum, r) => sum + r.stock, 0);
  const lowStock = filtered.filter((r) => r.stock > 0 && r.stock <= LOW_STOCK_THRESHOLD);
  const outOfStock = filtered.filter((r) => r.stock === 0);

  // Free-text search over the filtered rows (table only — metrics use the full set).
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter((r) =>
      [r.product_name, r.category_name, r.collection_name, r.store_name, String(r.product_id)]
        .some((v) => v?.toLowerCase().includes(q)),
    );
  }, [filtered, search]);

  const pageCount = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const paged = searched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [search, selectedStore, selectedCategory, sortBy]);

  const categoryAnalysis = useMemo(
    () =>
      categories.map((category) => {
        const items = filtered.filter((r) => r.category_name === category);
        return {
          category,
          products: items.length,
          stock: items.reduce((sum, r) => sum + r.stock, 0),
        };
      }),
    [categories, filtered],
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-gray-800 dark:text-white">
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Live stock levels across all stores.
          </p>
        </div>

        {req.loading && <LoadingState />}
        {req.error && <ErrorState message={req.error} onRetry={req.refetch} />}

        {!req.loading && !req.error && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Metric label="Total Products" value={count(filtered.length)} emoji="📦" color="bg-blue-600" />
              <Metric label="Total Stock" value={count(totalStock)} emoji="🔢" color="bg-emerald-600" />
              <Metric label="Low Stock" value={count(lowStock.length)} emoji="⚠️" color="bg-amber-500" />
              <Metric label="Out of Stock" value={count(outOfStock.length)} emoji="🚫" color="bg-rose-600" />
            </div>

            {meta && (
              <div className="card mb-8 text-sm text-gray-600 dark:text-gray-400">
                Showing {stores.length} store(s) · grand total stock {count(meta.grand_total_stock)} ·{' '}
                {count(meta.grand_total_product_stock)} products
              </div>
            )}

            {/* Filters */}
            <div className="card mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Store">
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="select"
                  >
                    <option value="">All Stores</option>
                    {stores.map((s) => (
                      <option key={s.store_id} value={s.store_id}>
                        {s.store_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Category">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="select"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Sort By">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'stock')}
                    className="select"
                  >
                    <option value="name">Name</option>
                    <option value="stock">Stock</option>
                  </select>
                </Field>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedStore('');
                      setSelectedCategory('');
                      setSortBy('name');
                    }}
                    className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Category Analysis */}
            <div className="card mb-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Inventory by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="products" fill="#3B82F6" name="Products" />
                  <Bar dataKey="stock" fill="#10B981" name="Total Stock" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Inventory Table */}
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  All Items ({searched.length})
                </h3>
                <SearchBox value={search} onChange={setSearch} placeholder="Search product, SKU, store…" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <Th>Product</Th>
                      <Th>SKU</Th>
                      <Th>Category</Th>
                      <Th>Collection</Th>
                      <Th>Store</Th>
                      <Th className="text-right">Stock</Th>
                      <Th className="text-center">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((row) => {
                      const isOut = row.stock === 0;
                      const isLow = row.stock > 0 && row.stock <= LOW_STOCK_THRESHOLD;
                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-gray-200 dark:border-gray-800 ${
                            isOut
                              ? 'bg-orange-50 dark:bg-orange-950'
                              : isLow
                                ? 'bg-red-50 dark:bg-red-950'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">
                            {row.product_name ?? `Product ${row.product_id}`}
                          </td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                            {row.product_id}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${categoryColor(row.category_name)}`}
                            >
                              {row.category_name ?? '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                            {row.collection_name ?? '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                            {row.store_name}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200 font-semibold">
                            {count(row.stock)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isOut ? (
                              <Badge className="bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200">
                                Out of Stock
                              </Badge>
                            ) : isLow ? (
                              <Badge className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge className="bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200">
                                In Stock
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {searched.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No items match the filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Paginator page={page} pageCount={pageCount} total={searched.length} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; emoji: string; color: string }> = ({
  label,
  value,
  emoji,
  color,
}) => (
  <div className={`rounded-2xl p-5 shadow-md text-white ${color} transition-transform hover:-translate-y-0.5`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white/90 mb-1">{label}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
      <div className="text-2xl bg-black/15 rounded-xl h-11 w-11 flex items-center justify-center">
        {emoji}
      </div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </label>
    {children}
  </div>
);

const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = 'text-left',
}) => (
  <th className={`${className} py-3 px-4 font-semibold text-gray-700 dark:text-gray-300`}>
    {children}
  </th>
);

const Badge: React.FC<{ children: React.ReactNode; className: string }> = ({
  children,
  className,
}) => (
  <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${className}`}>
    {children}
  </span>
);
