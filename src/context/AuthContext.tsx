import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/services/auth.service';

export interface AuthUser {
  id      : string;
  fullName: string;
  email   : string;
  role    : 'admin' | 'murabbi';
  image  ?: string;
}

interface AuthContextType {
  user      : AuthUser | null;
  loading   : boolean;
  isAdmin   : boolean;
  isMurabbi : boolean;
  saveTokens: (access: string, refresh: string, user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
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

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
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
      updateUser,
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
