import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// ── Attach access token to every request ──────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 ───────────────────────────────────
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const rt = localStorage.getItem("refreshToken");
        if (!rt) throw new Error("no refresh token");
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/auth/refresh`,
          { refreshToken: rt }
        );
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(original);
      } catch {
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);