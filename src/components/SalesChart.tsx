import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { SalesData } from '../types';

interface SalesChartProps {
  data: SalesData[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
  // Prepare daily sales data
  const dailySales = data.reduce((acc, sale) => {
    const existing = acc.find(item => item.date === sale.date);
    if (existing) {
      existing.total += sale.amount;
      existing.quantity += sale.quantity;
    } else {
      acc.push({
        date: sale.date,
        total: sale.amount,
        quantity: sale.quantity,
      });
    }
    return acc;
  }, [] as Array<{ date: string; total: number; quantity: number }>);

  // Prepare category sales data
  const categorySales = data.reduce((acc, sale) => {
    const existing = acc.find(item => item.category === sale.category);
    if (existing) {
      existing.value += sale.amount;
    } else {
      acc.push({
        category: sale.category,
        value: sale.amount,
      });
    }
    return acc;
  }, [] as Array<{ category: string; value: number }>);

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Daily Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Sales (₹)" />
            <Line type="monotone" dataKey="quantity" stroke="#10B981" name="Quantity (units)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categorySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" name="Sales (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categorySales}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.category}: ₹${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categorySales.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
