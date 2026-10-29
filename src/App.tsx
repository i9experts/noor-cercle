import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { AuthProvider, homeFor } from '@/context/AuthContext';

const Index              = lazy(() => import('./pages/Index.tsx'));
const MurabbiIndex       = lazy(() => import('./pages/murabbi/MurabbiIndex.tsx'));
const SignInPage         = lazy(() => import('./pages/SignInPage.tsx'));
const SignUpPage         = lazy(() => import('./pages/SignUpPage.tsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.tsx'));
const VerifyOtpPage      = lazy(() => import('./pages/VerifyOtpPage.tsx'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage.tsx'));
const ResetSuccessPage   = lazy(() => import('./pages/ResetSuccessPage.tsx'));
const NotFound           = lazy(() => import('./pages/NotFound.tsx'));
const FamilyPage         = lazy(() => import('./pages/FamilyPage.tsx'));
const ParentHome         = lazy(() => import('./pages/ParentHome.tsx'));
const SetPasswordPage    = lazy(() => import('./pages/SetPasswordPage.tsx'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

const isLoggedIn = () => !!localStorage.getItem('accessToken');
const storedUser = (): { role?: string; mustChangePassword?: boolean } => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: 'admin' | 'murabbi' | 'parent' }) {
  if (!isLoggedIn()) return <Navigate to="/signin" replace />;
  const u = storedUser();
  // A temporary password must be replaced before anything else.
  if (u.mustChangePassword) return <Navigate to="/set-password" replace />;
  if (role && u.role !== role) return <Navigate to={homeFor(u.role)} replace />;
  return children;
}

function PublicRoute({ children }: { children: JSX.Element }) {
  if (isLoggedIn()) {
    const u = storedUser();
    return <Navigate to={u.mustChangePassword ? '/set-password' : homeFor(u.role)} replace />;
  }
  return children;
}

function SetPasswordRoute() {
  if (!isLoggedIn()) return <Navigate to="/signin" replace />;
  if (!storedUser().mustChangePassword) return <Navigate to={homeFor(storedUser().role)} replace />;
  return <SetPasswordPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center h-screen text-nc-muted text-sm">Loading…</div>}>
            <Routes>
              {/* ── Auth routes (public only) ── */}
              <Route path="/signin"          element={<PublicRoute><SignInPage /></PublicRoute>} />
              <Route path="/sign-up"         element={<PublicRoute><SignUpPage /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
              <Route path="/verify-otp"      element={<VerifyOtpPage />} />
              <Route path="/reset-password"  element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
              <Route path="/reset-success"   element={<ResetSuccessPage />} />
              <Route path="/set-password"    element={<SetPasswordRoute />} />

              {/* ── Family page: public, opened from the link the team shares ── */}
              <Route path="/family/:token" element={<FamilyPage />} />

              {/* ── Admin routes ── */}
              <Route path="/"  element={<ProtectedRoute role="admin"><Index /></ProtectedRoute>} />
              <Route path="/*" element={<ProtectedRoute role="admin"><Index /></ProtectedRoute>} />

              {/* ── Parent routes ── */}
              <Route path="/parent"   element={<ProtectedRoute role="parent"><ParentHome /></ProtectedRoute>} />
              <Route path="/parent/*" element={<ProtectedRoute role="parent"><ParentHome /></ProtectedRoute>} />

              {/* ── Murabbi routes ── */}
              <Route path="/murabbi"   element={<ProtectedRoute role="murabbi"><MurabbiIndex /></ProtectedRoute>} />
              <Route path="/murabbi/*" element={<ProtectedRoute role="murabbi"><MurabbiIndex /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
