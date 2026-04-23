// src/services/auth.service.ts  (frontend)
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

export const authService = {
  signup: (data: { fullName: string; email: string; password: string }) =>
    API.post('/auth/signup', data),

  signin: (data: { email: string; password: string }) =>
    API.post('/auth/signin', data),

  forgotPassword: (data: { email: string }) =>
    API.post('/auth/forgot-password', data),

  // email localStorage se — user ko nahi dikhta
  verifyOtp: (otp: string) =>
    API.post('/auth/verify-otp', {
      email: localStorage.getItem('resetEmail') || '',
      otp,
    }),

  // resend — email localStorage se
  resendOtp: () =>
    API.post('/auth/resend-otp', {
      email: localStorage.getItem('resetEmail') || '',
    }),

  resetPassword: (newPassword: string, resetToken: string) =>
    API.post(
      '/auth/reset-password',
      { newPassword },
      { headers: { Authorization: `Bearer ${resetToken}` } }
    ),
};

