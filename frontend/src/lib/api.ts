import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3000/api',
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bookleaf_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;