import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { InventoryItem } from '../types';

interface InventoryTableProps {
  data: InventoryItem[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ data }) => {
  const lowStockItems = data.filter(item => item.quantity < item.reorderLevel);

  return (
    <div className="space-y-6">
      {lowStockItems.length > 0 && (
        <div className="card border-l-4 border-red-500 bg-red-50 dark:bg-red-950">
          <div className="flex gap-3 items-start">
            <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">Low Stock Alert</h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                {lowStockItems.length} item(s) below reorder level
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Inventory by Store</h3>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-300 dark:border-gray-700">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Product</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Category</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Min Level</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Price</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const isLowStock = item.quantity < item.reorderLevel;
              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-200 dark:border-gray-800 ${
                    isLowStock ? 'bg-red-50 dark:bg-red-950' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{item.name}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200 font-semibold">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {item.reorderLevel}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">
                    ₹{item.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isLowStock ? (
                      <span className="inline-block px-2 py-1 text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full font-semibold">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Items</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Inventory Value</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            ₹{(data.reduce((sum, item) => sum + item.quantity * item.price, 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
        </div>
      </div>
    </div>
  );
};
