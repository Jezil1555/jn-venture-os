import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
