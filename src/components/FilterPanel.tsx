import React from 'react';
import { Filter } from 'lucide-react';
import type { Store, DashboardFilter } from '../types';
import { CATEGORIES } from '../data/mockData';

interface FilterProps {
  stores: Store[];
  onChange: (filter: DashboardFilter) => void;
  currentFilter: DashboardFilter;
}

export const FilterPanel: React.FC<FilterProps> = ({ stores, onChange, currentFilter }) => {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const handleStoreChange = (storeId: string) => {
    onChange({
      ...currentFilter,
      storeId: storeId || undefined,
    });
  };

  const handleCategoryChange = (category: string) => {
    onChange({
      ...currentFilter,
      category: category || undefined,
    });
  };

  const handleDateChange = () => {
    onChange({
      ...currentFilter,
      dateRange:
        startDate && endDate
          ? { start: startDate, end: endDate }
          : undefined,
    });
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    onChange({});
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={20} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Store
          </label>
          <select
            value={currentFilter.storeId || ''}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={currentFilter.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleDateChange}
          className="btn-primary text-sm"
        >
          Apply Date Filter
        </button>
        <button
          onClick={handleReset}
          className="btn-secondary text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
