// src/services/auth.service.ts  (frontend)
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

export const authService = {
  signup: (data: { fullName: string; email: string; password: string }) =>
    API.post('/auth/signup', data),
  signin: (data) => API.post('/auth/signin', data),
  forgotPassword:  (data) => API.post('/auth/forgot-password', data),  // ✅
  verifyOtp:       (data) => API.post('/auth/verify-otp', data),       // ✅
  resetPassword:   (data) => API.post('/auth/reset-password', data),   // ✅
};

