import axios from 'axios';

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach access token to every request ──────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (r: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return API(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const rt = localStorage.getItem('refreshToken');
      if (!rt) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/signin';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${rt}` } },
        );

        const newAccess  = data.data?.accessToken  || data.accessToken;
        const newRefresh = data.data?.refreshToken || data.refreshToken;

        localStorage.setItem('accessToken',  newAccess);
        localStorage.setItem('refreshToken', newRefresh);

        API.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
        original.headers.Authorization = `Bearer ${newAccess}`;

        processQueue(null, newAccess);
        return API(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/signin';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
