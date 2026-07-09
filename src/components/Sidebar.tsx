import React from 'react';
import { LogOut, Home, BarChart3, Package, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';

interface SidebarProps {
  /** Whether the mobile drawer is open. */
  open: boolean;
  /** Close the mobile drawer. */
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const { currentPage, setPage } = useNavigation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory', icon: Package },
  ];

  const go = (id: string) => {
    setPage(id as 'dashboard' | 'reports' | 'inventory');
    onClose(); // close the drawer on mobile after navigating
  };

  return (
    <>
      {/* Backdrop (mobile only, when open) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer on mobile, static column on desktop */}
      <aside
        className={`fixed sm:static inset-y-0 left-0 z-40 w-72 sm:w-64 h-screen sm:h-auto bg-slate-900 text-white p-4 sm:p-6 flex flex-col grow-0 shrink-0 transform transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } sm:translate-x-0`}
      >
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-blue-400">StoreMaster</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Admin Dashboard</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="sm:hidden p-1 text-gray-300 hover:bg-slate-800 rounded-lg"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mb-8 p-3 sm:p-4 bg-slate-800 border border-slate-700 rounded-xl">
          <p className="text-xs text-gray-400">Logged in as</p>
          <p className="text-sm sm:text-base font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`w-full p-3 rounded-xl flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm sm:text-base">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm sm:text-base">Logout</span>
        </button>
      </aside>
    </>
  );
};
