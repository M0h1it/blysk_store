import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

/** Search box for filtering a table client-side. */
export const SearchBox: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="relative w-full sm:w-72">
    <Search
      size={16}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

/** Client-side pagination footer (1-indexed pages). */
export const Paginator: React.FC<{
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}> = ({ page, pageCount, total, onPage }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {total === 0
        ? 'No records'
        : `Page ${page} of ${pageCount} · ${total.toLocaleString('en-IN')} record(s)`}
    </p>
    {pageCount > 1 && (
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <button
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    )}
  </div>
);

/** Page size used for client-side tables. */
export const PAGE_SIZE = 10;
