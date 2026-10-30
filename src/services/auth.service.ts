import { API } from '@/lib/api';

export const authService = {
  signupRequestOtp: (data: { fullName: string; email: string; password: string }) =>
    API.post('/auth/signup/request-otp', data),

  signupVerifyOtp: (data: { email: string; otp: string }) =>
    API.post('/auth/signup/verify-otp', data),

  signin: (data: { email: string; password: string }) =>
    API.post('/auth/signin', data),

  logout: (refreshToken: string) =>
    API.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${refreshToken}` } }),

  logoutAll: () => API.post('/auth/logout-all'),

  /** Who an emailed "set your password" link is for. */
  setPasswordInfo: (token: string) => API.get(`/auth/set-password/${encodeURIComponent(token)}`),

  /** Choose a password from an emailed link; returns tokens (signs in). */
  setPassword: (token: string, newPassword: string) => API.post('/auth/set-password', { token, newPassword }),

  forgotPassword: (data: { email: string }) =>
    API.post('/auth/forgot-password', data),

  verifyResetOtp: (data: { email: string; otp: string }) =>
    API.post('/auth/verify-otp', data),

  resetPassword: (resetToken: string, newPassword: string) =>
    API.post('/auth/reset-password', { newPassword }, {
      headers: { Authorization: `Bearer ${resetToken}` },
    }),

  resendOtp: (email: string, type: 'signup' | 'reset') =>
    API.post(`/auth/resend-otp?type=${type}`, { email }),

  refreshTokens: (refreshToken: string) =>
    API.post('/auth/refresh', {}, { headers: { Authorization: `Bearer ${refreshToken}` } }),

  getMe: () => API.get('/auth/me'),
};
