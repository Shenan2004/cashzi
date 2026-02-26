import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
