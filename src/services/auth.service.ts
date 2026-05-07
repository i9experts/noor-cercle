import { API } from "@/lib/api";

export const authService = {
  // ── Signup Step 1: account banao, OTP email jata hai ────
  signup: (data: { fullName: string; email: string; password: string }) =>
    API.post("/auth/signup", data),

  // ── Signup Step 2: OTP verify → tokens milte hain ──────
  verifyEmail: (data: { email: string; otp: string }) =>
    API.post("/auth/verify-email", data),

  // ── Sign In ─────────────────────────────────────────────
  signin: (data: { email: string; password: string }) =>
    API.post("/auth/signin", data),

  // ── Logout ──────────────────────────────────────────────
  logout: () => API.post("/auth/logout"),

  // ── Forgot Password Step 1: OTP email jata hai ──────────
  forgotPassword: (data: { email: string }) =>
    API.post("/auth/forgot-password", data),

  // ── Forgot Password Step 2: OTP + newPassword ek call ───
  verifyOtpAndReset: (data: {
    email: string;
    otp: string;
    newPassword: string;
  }) => API.post("/auth/verify-otp-reset", data),

  // ── Resend OTP ───────────────────────────────────────────
  resendOtp: (email: string, type: "signup" | "reset") =>
    API.post("/auth/resend-otp", { email, type }),
};