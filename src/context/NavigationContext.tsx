import React, { createContext, useContext, useState } from 'react';

type Page = 'dashboard' | 'reports' | 'inventory';

interface NavigationContextType {
  currentPage: Page;
  setPage: (page: Page) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setPage] = useState<Page>('dashboard');

  return (
    <NavigationContext.Provider value={{ currentPage, setPage }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used inside NavigationProvider');
  }
  return context;
};
