import React, { useState } from 'react';
import { Loader2, Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { Login, Dashboard, Sidebar } from './components';
import { Reports } from './pages/Reports';
import { Inventory } from './pages/Inventory';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, initializing } = useAuth();
  const { currentPage } = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (initializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 text-gray-500 dark:text-gray-400">
        <Loader2 className="animate-spin mb-3" size={32} />
        <p className="text-sm">Signing in…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger toggle */}
        <header className="sm:hidden flex items-center gap-3 bg-slate-900 text-white px-4 py-3 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="p-1 hover:bg-slate-800 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <span className="text-lg font-extrabold text-blue-400">StoreMaster</span>
        </header>

        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'reports' && <Reports />}
        {currentPage === 'inventory' && <Inventory />}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
