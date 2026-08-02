import axios from 'axios';

// In local dev, VITE_API_BASE_URL is unset and requests go to '/api',
// which vite.config.js proxies to the local server. In production, set
// VITE_API_BASE_URL to the deployed backend's full URL (e.g.
// https://jn-venture-os-api.onrender.com/api) at build time.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Attach the JWT (if we have one) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jnv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is missing/expired — clear it so AuthContext
// can drop back to the login screen instead of looping on stale auth.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jnv_token');
    }
    return Promise.reject(error);
  }
);

export default api;
