import type { Store, SalesData, InventoryItem } from '../types';

export const mockStores: Store[] = [
  { id: '1', name: 'Mumbai Store', location: 'Mumbai, Maharashtra', status: 'active' },
  { id: '2', name: 'Delhi Store', location: 'Delhi, NCR', status: 'active' },
  { id: '3', name: 'Bangalore Store', location: 'Bangalore, Karnataka', status: 'active' },
  { id: '4', name: 'Hyderabad Store', location: 'Hyderabad, Telangana', status: 'inactive' },
];

export const mockSalesData: SalesData[] = [
  { id: '1', storeId: '1', date: '2024-01-15', amount: 45000, quantity: 3, category: 'Earrings' },
  { id: '2', storeId: '1', date: '2024-01-15', amount: 125000, quantity: 2, category: 'Necklace' },
  { id: '3', storeId: '1', date: '2024-01-16', amount: 85000, quantity: 5, category: 'Bracelet' },
  { id: '4', storeId: '2', date: '2024-01-15', amount: 150000, quantity: 2, category: 'Ring' },
  { id: '5', storeId: '2', date: '2024-01-15', amount: 35000, quantity: 2, category: 'Earrings' },
  { id: '6', storeId: '2', date: '2024-01-16', amount: 95000, quantity: 1, category: 'Necklace' },
  { id: '7', storeId: '3', date: '2024-01-15', amount: 55000, quantity: 4, category: 'Bracelet' },
  { id: '8', storeId: '3', date: '2024-01-15', amount: 120000, quantity: 1, category: 'Ring' },
  { id: '9', storeId: '3', date: '2024-01-16', amount: 65000, quantity: 3, category: 'Earrings' },
  { id: '10', storeId: '4', date: '2024-01-15', amount: 75000, quantity: 2, category: 'Necklace' },
  { id: '11', storeId: '4', date: '2024-01-16', amount: 140000, quantity: 1, category: 'Ring' },
  { id: '12', storeId: '1', date: '2024-01-17', amount: 90000, quantity: 3, category: 'Bracelet' },
  { id: '13', storeId: '2', date: '2024-01-17', amount: 45000, quantity: 3, category: 'Earrings' },
  { id: '14', storeId: '3', date: '2024-01-17', amount: 110000, quantity: 2, category: 'Necklace' },
  { id: '15', storeId: '4', date: '2024-01-17', amount: 40000, quantity: 2, category: 'Bracelet' },
];

export const mockInventoryData: InventoryItem[] = [
  { id: '1', storeId: '1', name: 'Gold Hoop Earrings', category: 'Earrings', quantity: 25, reorderLevel: 8, price: 15000, lastUpdated: '2024-01-16' },
  { id: '2', storeId: '1', name: 'Diamond Stud Earrings', category: 'Earrings', quantity: 15, reorderLevel: 5, price: 35000, lastUpdated: '2024-01-16' },
  { id: '3', storeId: '1', name: 'Pearl Necklace', category: 'Necklace', quantity: 10, reorderLevel: 3, price: 62500, lastUpdated: '2024-01-16' },
  { id: '4', storeId: '1', name: 'Gold Chain Necklace', category: 'Necklace', quantity: 8, reorderLevel: 3, price: 45000, lastUpdated: '2024-01-16' },
  { id: '5', storeId: '1', name: 'Silver Bracelet', category: 'Bracelet', quantity: 30, reorderLevel: 10, price: 17000, lastUpdated: '2024-01-16' },
  { id: '6', storeId: '1', name: 'Gold Bangle', category: 'Bracelet', quantity: 12, reorderLevel: 4, price: 25000, lastUpdated: '2024-01-16' },
  { id: '7', storeId: '1', name: 'Diamond Ring', category: 'Ring', quantity: 6, reorderLevel: 2, price: 95000, lastUpdated: '2024-01-16' },
  { id: '8', storeId: '1', name: 'Gold Ring', category: 'Ring', quantity: 18, reorderLevel: 5, price: 45000, lastUpdated: '2024-01-16' },
  
  { id: '9', storeId: '2', name: 'Gold Hoop Earrings', category: 'Earrings', quantity: 20, reorderLevel: 8, price: 15000, lastUpdated: '2024-01-16' },
  { id: '10', storeId: '2', name: 'Diamond Stud Earrings', category: 'Earrings', quantity: 12, reorderLevel: 5, price: 35000, lastUpdated: '2024-01-16' },
  { id: '11', storeId: '2', name: 'Pearl Necklace', category: 'Necklace', quantity: 8, reorderLevel: 3, price: 62500, lastUpdated: '2024-01-16' },
  { id: '12', storeId: '2', name: 'Gold Chain Necklace', category: 'Necklace', quantity: 6, reorderLevel: 3, price: 45000, lastUpdated: '2024-01-16' },
  { id: '13', storeId: '2', name: 'Silver Bracelet', category: 'Bracelet', quantity: 25, reorderLevel: 10, price: 17000, lastUpdated: '2024-01-16' },
  { id: '14', storeId: '2', name: 'Gold Bangle', category: 'Bracelet', quantity: 10, reorderLevel: 4, price: 25000, lastUpdated: '2024-01-16' },
  { id: '15', storeId: '2', name: 'Diamond Ring', category: 'Ring', quantity: 5, reorderLevel: 2, price: 95000, lastUpdated: '2024-01-16' },
  { id: '16', storeId: '2', name: 'Gold Ring', category: 'Ring', quantity: 16, reorderLevel: 5, price: 45000, lastUpdated: '2024-01-16' },
  
  { id: '17', storeId: '3', name: 'Gold Hoop Earrings', category: 'Earrings', quantity: 22, reorderLevel: 8, price: 15000, lastUpdated: '2024-01-16' },
  { id: '18', storeId: '3', name: 'Diamond Stud Earrings', category: 'Earrings', quantity: 14, reorderLevel: 5, price: 35000, lastUpdated: '2024-01-16' },
  { id: '19', storeId: '3', name: 'Pearl Necklace', category: 'Necklace', quantity: 9, reorderLevel: 3, price: 62500, lastUpdated: '2024-01-16' },
  { id: '20', storeId: '3', name: 'Gold Chain Necklace', category: 'Necklace', quantity: 7, reorderLevel: 3, price: 45000, lastUpdated: '2024-01-16' },
  { id: '21', storeId: '3', name: 'Silver Bracelet', category: 'Bracelet', quantity: 28, reorderLevel: 10, price: 17000, lastUpdated: '2024-01-16' },
  { id: '22', storeId: '3', name: 'Gold Bangle', category: 'Bracelet', quantity: 11, reorderLevel: 4, price: 25000, lastUpdated: '2024-01-16' },
  { id: '23', storeId: '3', name: 'Diamond Ring', category: 'Ring', quantity: 4, reorderLevel: 2, price: 95000, lastUpdated: '2024-01-16' },
  { id: '24', storeId: '3', name: 'Gold Ring', category: 'Ring', quantity: 17, reorderLevel: 5, price: 45000, lastUpdated: '2024-01-16' },
  
  { id: '25', storeId: '4', name: 'Gold Hoop Earrings', category: 'Earrings', quantity: 18, reorderLevel: 8, price: 15000, lastUpdated: '2024-01-16' },
  { id: '26', storeId: '4', name: 'Diamond Stud Earrings', category: 'Earrings', quantity: 10, reorderLevel: 5, price: 35000, lastUpdated: '2024-01-16' },
  { id: '27', storeId: '4', name: 'Pearl Necklace', category: 'Necklace', quantity: 7, reorderLevel: 3, price: 62500, lastUpdated: '2024-01-16' },
  { id: '28', storeId: '4', name: 'Gold Chain Necklace', category: 'Necklace', quantity: 5, reorderLevel: 3, price: 45000, lastUpdated: '2024-01-16' },
  { id: '29', storeId: '4', name: 'Silver Bracelet', category: 'Bracelet', quantity: 2, reorderLevel: 10, price: 17000, lastUpdated: '2024-01-16' },
  { id: '30', storeId: '4', name: 'Gold Bangle', category: 'Bracelet', quantity: 8, reorderLevel: 4, price: 25000, lastUpdated: '2024-01-16' },
  { id: '31', storeId: '4', name: 'Diamond Ring', category: 'Ring', quantity: 3, reorderLevel: 2, price: 95000, lastUpdated: '2024-01-16' },
  { id: '32', storeId: '4', name: 'Gold Ring', category: 'Ring', quantity: 14, reorderLevel: 5, price: 45000, lastUpdated: '2024-01-16' },
];

export const CATEGORIES = ['Earrings', 'Necklace', 'Bracelet', 'Ring'];
