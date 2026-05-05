// // src/services/auth.service.ts  (frontend)
// import axios from 'axios';

// const API = axios.create({
//   baseURL: 'http://localhost:3000/api/v1',
// });

// export const authService = {
//   signup: (data: { fullName: string; email: string; password: string }) =>
//     API.post('/auth/signup', data),

//   signin: (data: { email: string; password: string }) =>
//     API.post('/auth/signin', data),

//   forgotPassword: (data: { email: string }) =>
//     API.post('/auth/forgot-password', data),

//   // email localStorage se — user ko nahi dikhta
//   verifyOtp: (otp: string) =>
//     API.post('/auth/verify-otp', {
//       email: localStorage.getItem('resetEmail') || '',
//       otp,
//     }),

//   // resend — email localStorage se
//   resendOtp: () =>
//     API.post('/auth/resend-otp', {
//       email: localStorage.getItem('resetEmail') || '',
//     }),

//   resetPassword: (newPassword: string, resetToken: string) =>
//     API.post(
//       '/auth/reset-password',
//       { newPassword },
//       { headers: { Authorization: `Bearer ${resetToken}` } }
//     ),
// };




import { API } from '@/lib/api';

export const authService = {
  // ── Signup (2 steps) ──────────────────────────────────────────────────────
  signupRequestOtp: (data: { fullName: string; email: string; password: string }) =>
    API.post('/auth/signup/request-otp', data),

  signupVerifyOtp: (data: { email: string; otp: string }) =>
    API.post('/auth/signup/verify-otp', data),

  // ── Signin ────────────────────────────────────────────────────────────────
  signin: (data: { email: string; password: string }) =>
    API.post('/auth/signin', data),

  // ── Forgot Password ───────────────────────────────────────────────────────
  forgotPassword: (data: { email: string }) =>
    API.post('/auth/forgot-password', data),

  verifyOtp: (data: { email: string; otp: string }) =>
    API.post('/auth/verify-otp', data),

  resetPassword: (newPassword: string, resetToken: string) =>
    API.post('/auth/reset-password', { newPassword }, {
      headers: { Authorization: `Bearer ${resetToken}` },
    }),

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  resendOtp: (email: string, type: 'signup' | 'reset') =>
    API.post(`/auth/resend-otp?type=${type}`, { email }),

  // ── Me ─────────────────────────────────────────────────────────────────────
  getMe: () => API.get('/auth/me'),
};

// ── Admin APIs ────────────────────────────────────────────────────────────────
export const adminService = {
  getStats      : ()                   => API.get('/admin/stats'),
  getAllMurabbis : ()                   => API.get('/admin/murabbis'),
  createMurabbi : (data: { fullName: string; email: string; password: string }) =>
    API.post('/admin/murabbis', data),
  deactivate    : (id: string)         => API.patch(`/admin/murabbis/${id}/deactivate`),
  activate      : (id: string)         => API.patch(`/admin/murabbis/${id}/activate`),
  deleteMurabbi : (id: string)         => API.delete(`/admin/murabbis/${id}`),
};

// ── Murabbi APIs ───────────────────────────────────────────────────────────────
export const murabbiService = {
  getProfile    : ()                         => API.get('/murabbi/profile'),
  updateProfile : (data: { fullName: string }) => API.patch('/murabbi/profile', data),
};

// ── Error helper ──────────────────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  const msg = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] as string;
  if (typeof msg === 'string' && msg.length) return msg;
  return 'Something went wrong. Please try again.';
}