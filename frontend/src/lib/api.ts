import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_PREFIX = '/api';

const api = axios.create({
  baseURL: `${API_BASE}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        // Only redirect to login if the user had an active session that got rejected.
        // Anonymous users hitting a protected endpoint should NOT be redirected.
        if (token) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export function imgUrl(path?: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('http')) return path;
  return `${API_URL}/upload/static/${path}`;
}

export function getImgUrl(path?: string | null | undefined): string {
  return imgUrl(path) ?? '';
}

export default api;