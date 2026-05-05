// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Route, Routes } from "react-router-dom";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import Index from "./pages/Index.tsx";
// import MurabbiIndex from "./pages/murabbi/MurabbiIndex.tsx";
// import SignInPage from "./pages/SignInPage.tsx";
// import SignUpPage from "./pages/SignUpPage.tsx";
// import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
// import VerifyOtpPage from "./pages/VerifyOtpPage.tsx";
// import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
// import ResetSuccessPage from "./pages/ResetSuccessPage.tsx";
// import NotFound from "./pages/NotFound.tsx";

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<Index />} />
//           <Route path="/murabbi" element={<MurabbiIndex />} />
//           <Route path="/signin" element={<SignInPage />} />
//           <Route path="/sign-up" element={<SignUpPage />} />
//           <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//           <Route path="/verify-otp" element={<VerifyOtpPage />} />
//           <Route path="/reset-password" element={<ResetPasswordPage />} />
//           <Route path="/reset-success" element={<ResetSuccessPage />} />
//           {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Pages
import Index           from './pages/Index';
import MurabbiIndex    from './pages/murabbi/MurabbiIndex';
import SignInPage      from './pages/SignInPage';
import SignUpPage      from './pages/SignUpPage';
import VerifyOtpPage   from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import ResetSuccessPage   from './pages/ResetSuccessPage';
import NotFound        from './pages/NotFound';

const queryClient = new QueryClient();

// ── Protected Route — redirects to signin if not logged in ────────────────────
function ProtectedRoute({ children, requiredRole }: { children: JSX.Element; requiredRole?: 'admin' | 'murabbi' }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-nc-muted">Loading...</div>;
  if (!user)   return <Navigate to="/signin" replace />;
  if (requiredRole && user.role !== requiredRole) {
    // Wrong role → redirect to their correct panel
    return <Navigate to={user.role === 'admin' ? '/' : '/murabbi'} replace />;
  }
  return children;
}

// ── Public Route — redirect logged-in users to their panel ────────────────────
function PublicRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-nc-muted">Loading...</div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/' : '/murabbi'} replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            {/* ── Public auth pages ──────────────────────────────────────── */}
            <Route path="/signin"          element={<PublicRoute><SignInPage /></PublicRoute>} />
            <Route path="/sign-in"         element={<Navigate to="/signin" replace />} />
            <Route path="/sign-up"         element={<PublicRoute><SignUpPage /></PublicRoute>} />
            <Route path="/verify-otp"      element={<VerifyOtpPage />} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
            <Route path="/reset-success"   element={<ResetSuccessPage />} />

            {/* ── Admin panel (role = admin) ──────────────────────────────── */}
            <Route path="/" element={
              <ProtectedRoute requiredRole="admin"><Index /></ProtectedRoute>
            } />

            {/* ── Murabbi panel (role = murabbi) ─────────────────────────── */}
            <Route path="/murabbi" element={
              <ProtectedRoute requiredRole="murabbi"><MurabbiIndex /></ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
