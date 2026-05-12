/**
 * FIX: AuthContext.tsx
 *
 * BUGS FIXED:
 * 1. Imported useNavigate but never used it (causes React warning)
 * 2. Duplicate file existed at src/components/auth/AuthContext.tsx - consolidated here
 * 3. logout() used hard-coded Authorization header correctly but wasn't updating
 *    the refreshToken key — fixed
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/services/auth.service';

export interface AuthUser {
  id      : string;
  fullName: string;
  email   : string;
  role    : 'admin' | 'murabbi';
}

interface AuthContextType {
  user      : AuthUser | null;
  loading   : boolean;
  isAdmin   : boolean;
  isMurabbi : boolean;
  saveTokens: (access: string, refresh: string, user: AuthUser) => void;
  logout    : () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token  = localStorage.getItem('accessToken');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); }
      catch { clearAll(); }
    }
    setLoading(false);
  }, []);

  const saveTokens = (access: string, refresh: string, u: AuthUser) => {
    localStorage.setItem('accessToken',  access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user',         JSON.stringify(u));
    setUser(u);
  };

  const clearAll = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('resetEmail');
    localStorage.removeItem('resetToken');
    localStorage.removeItem('pendingEmail');
    setUser(null);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // FIX: pass refreshToken to authService.logout (which sends it as Bearer header)
        await authService.logout(refreshToken);
      }
    } catch { /* ignore errors on logout */ }
    clearAll();
    window.location.href = '/signin';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin  : user?.role === 'admin',
      isMurabbi: user?.role === 'murabbi',
      saveTokens,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
