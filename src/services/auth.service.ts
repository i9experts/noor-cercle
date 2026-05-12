/**
 * FIX: Complete rewrite of auth.service.ts
 *
 * BUGS FOUND & FIXED:
 * 1. signup() called /auth/signup  → should be /auth/signup/request-otp
 * 2. verifyEmail() called /auth/verify-email → should be /auth/signup/verify-otp
 * 3. verifyOtpAndReset() called /auth/verify-otp-reset → backend splits into
 *    TWO calls: /auth/verify-otp (get resetToken) then /auth/reset-password
 * 4. resendOtp() sent type in body → backend reads it from query param ?type=
 * 5. Missing refreshTokens function
 */

import { API } from '@/lib/api';

export const authService = {
  // ── Signup Step 1: Send OTP to email ─────────────────────────────────────
  // FIX: was /auth/signup → now /auth/signup/request-otp
  signupRequestOtp: (data: { fullName: string; email: string; password: string }) =>
    API.post('/auth/signup/request-otp', data),

  // ── Signup Step 2: Verify OTP → account created + tokens returned ─────────
  // FIX: was /auth/verify-email → now /auth/signup/verify-otp
  signupVerifyOtp: (data: { email: string; otp: string }) =>
    API.post('/auth/signup/verify-otp', data),

  // ── Sign In ───────────────────────────────────────────────────────────────
  signin: (data: { email: string; password: string }) =>
    API.post('/auth/signin', data),

  // ── Logout (sends refreshToken as Bearer header) ──────────────────────────
  logout: (refreshToken: string) =>
    API.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }),

  // ── Logout All Devices ────────────────────────────────────────────────────
  logoutAll: () => API.post('/auth/logout-all'),

  // ── Forgot Password Step 1: Send reset OTP ───────────────────────────────
  forgotPassword: (data: { email: string }) =>
    API.post('/auth/forgot-password', data),

  // ── Forgot Password Step 2: Verify OTP → get resetToken ──────────────────
  // FIX: was combined verifyOtpAndReset → now split into 2 calls
  verifyResetOtp: (data: { email: string; otp: string }) =>
    API.post('/auth/verify-otp', data),

  // ── Reset Password: use resetToken from verifyResetOtp ───────────────────
  // FIX: was combined → now separate with resetToken in Authorization header
  resetPassword: (resetToken: string, newPassword: string) =>
    API.post(
      '/auth/reset-password',
      { newPassword },
      { headers: { Authorization: `Bearer ${resetToken}` } },
    ),

  // ── Resend OTP ────────────────────────────────────────────────────────────
  // FIX: type goes in query param, not body
  resendOtp: (email: string, type: 'signup' | 'reset') =>
    API.post(`/auth/resend-otp?type=${type}`, { email }),

  // ── Refresh Tokens ────────────────────────────────────────────────────────
  refreshTokens: (refreshToken: string) =>
    API.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }),

  // ── Get Current User ──────────────────────────────────────────────────────
  getMe: () => API.get('/auth/me'),
};
