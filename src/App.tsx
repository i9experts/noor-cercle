/**
 * FIX: App.tsx
 *
 * BUGS FIXED:
 * 1. AuthProvider was not wrapping the app — tokens/user state wasn't shared
 * 2. ResetPasswordPage was imported in routes in original but missing import statement
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// FIX: Import and use AuthProvider
import { AuthProvider } from '@/context/AuthContext';

import Index              from './pages/Index.tsx';
import MurabbiIndex       from './pages/murabbi/MurabbiIndex.tsx';
import SignInPage         from './pages/SignInPage.tsx';
import SignUpPage         from './pages/SignUpPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import VerifyOtpPage      from './pages/VerifyOtpPage.tsx';
import ResetSuccessPage   from './pages/ResetSuccessPage.tsx';
import NotFound           from './pages/NotFound.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

const isLoggedIn = () => !!localStorage.getItem('accessToken');
const getUserRole = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').role || null;
  } catch {
    return null;
  }
};

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: 'admin' | 'murabbi' }) {
  if (!isLoggedIn()) return <Navigate to="/signin" replace />;
  if (role && getUserRole() !== role) {
    return <Navigate to={getUserRole() === 'admin' ? '/' : '/murabbi'} replace />;
  }
  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  if (isLoggedIn()) {
    return <Navigate to={getUserRole() === 'admin' ? '/' : '/murabbi'} replace />;
  }
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* FIX: Wrap entire app in AuthProvider so useAuth() works everywhere */}
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ── Auth routes (public only) ── */}
            <Route path="/signin"          element={<PublicRoute><SignInPage /></PublicRoute>} />
            <Route path="/sign-up"         element={<PublicRoute><SignUpPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/verify-otp"      element={<VerifyOtpPage />} />
            <Route path="/reset-success"   element={<ResetSuccessPage />} />

            {/* ── Admin routes ── */}
            <Route path="/"  element={<ProtectedRoute role="admin"><Index /></ProtectedRoute>} />
            <Route path="/*" element={<ProtectedRoute role="admin"><Index /></ProtectedRoute>} />

            {/* ── Murabbi routes ── */}
            <Route path="/murabbi"    element={<ProtectedRoute role="murabbi"><MurabbiIndex /></ProtectedRoute>} />
            <Route path="/murabbi/*"  element={<ProtectedRoute role="murabbi"><MurabbiIndex /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
