export interface Store {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive';
}

export interface SalesData {
  id: string;
  storeId: string;
  date: string;
  amount: number;
  quantity: number;
  category: string;
}

export interface InventoryItem {
  id: string;
  storeId: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  price: number;
  lastUpdated: string;
}

export interface AuthContextType {
  user: { email: string; name: string; role?: string } | null;
  isAuthenticated: boolean;
  /** True while the app is restoring or obtaining a session on first load. */
  initializing: boolean;
  /** Message set when auto-authentication fails. */
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface DashboardFilter {
  storeId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  category?: string;
}
