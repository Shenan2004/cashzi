import axios from 'axios';

// In production (GitHub Pages), VITE_API_URL must be set to your Render backend URL.
// In local dev, fall back to the Vite proxy (/api → localhost:5001).
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cashzi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cashzi_token');
      localStorage.removeItem('cashzi_user');
      window.location.href = '/cashzi/#/login';
    }
    return Promise.reject(error);
  }
);

export default api;
