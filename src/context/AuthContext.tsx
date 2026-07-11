import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthContextType } from '../types';
import { loginOnce as loginRequest } from '../api/services';
import { STORAGE_KEYS, AUTH_LOGOUT_EVENT } from '../api/config';
import type { ApiError } from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type SessionUser = { email: string; name: string; role?: string };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  // True while we restore/obtain a session on first load.
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const authenticate = async (email: string, password: string) => {
    // Calls POST /api/auth/login and persists the JWT for admin requests.
    const { token, user: apiUser } = await loginRequest(email, password);

    const sessionUser: SessionUser = {
      email: apiUser?.email ?? email,
      name:
        (apiUser?.name as string | undefined) ??
        (apiUser?.email ?? email).split('@')[0].toUpperCase(),
      role: (apiUser?.role_display_name as string | undefined) ?? apiUser?.role,
    };

    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setAuthError(null);
    return sessionUser;
  };

  const login = async (email: string, password: string) => {
    await authenticate(email, password);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
  };

  // On first load: restore a saved session, otherwise sign in with the
  // configured auth-API credentials automatically.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const savedUser = localStorage.getItem(STORAGE_KEYS.user);
      const savedToken = localStorage.getItem(STORAGE_KEYS.token);

      if (savedUser && savedToken) {
        try {
          if (!cancelled) setUser(JSON.parse(savedUser));
          if (!cancelled) setInitializing(false);
          return;
        } catch {
          logout();
        }
      }

      if (!cancelled) setInitializing(false);
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // The API client fires this event on a 401 (expired/invalid token).
  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        initializing,
        authError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

/** Narrowed helper for surfacing a friendly login error message. */
export function toErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as ApiError).message;
  }
  return 'Login failed. Please try again.';
}
