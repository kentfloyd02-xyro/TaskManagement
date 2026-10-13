import axios from 'axios';
import { dbPutMany } from '../db/indexedDB';
import { handleOfflineGet, handleOfflineMutation } from '../utils/offlineSync';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Helper to get active user
const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('student_user') || sessionStorage.getItem('student_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

// Request interceptor to inject JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('student_token') || sessionStorage.getItem('student_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Background auto-cache into IndexedDB on successful GET
    const url = response.config?.url || '';
    if (response.config?.method?.toLowerCase() === 'get' && response.data) {
      try {
        if (url.startsWith('/tasks') && Array.isArray(response.data.tasks)) {
          dbPutMany('tasks', response.data.tasks).catch(() => {});
        } else if (url.startsWith('/schedule') && Array.isArray(response.data.schedules)) {
          dbPutMany('schedules', response.data.schedules).catch(() => {});
        } else if (url.startsWith('/subjects') && Array.isArray(response.data.data)) {
          dbPutMany('subjects', response.data.data).catch(() => {});
        } else if (url.startsWith('/reviewer/materials')) {
          const mats = response.data.data || response.data.materials;
          if (Array.isArray(mats)) {
            dbPutMany('reviewers', mats).catch(() => {});
          }
        }
      } catch (e) {}
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      sessionStorage.removeItem('student_token');
      sessionStorage.removeItem('student_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Check if network error, timeout, server 502/503/504, or offline
    const isNetworkOrServerError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      [502, 503, 504].includes(error.response?.status) ||
      !navigator.onLine;

    if (isNetworkOrServerError && config) {
      const currentUser = getCurrentUser();
      const method = (config.method || 'get').toUpperCase();
      const url = config.url || '';

      try {
        if (method === 'GET') {
          const offlineRes = await handleOfflineGet(url, currentUser);
          if (offlineRes) {
            console.warn(`[IndexedDB Offline Fallback] Served ${url} from local storage`);
            return Promise.resolve({
              ...offlineRes,
              status: 200,
              statusText: 'OK (Offline IndexedDB)',
              headers: {},
              config,
            });
          }
        } else if (['POST', 'PUT', 'DELETE'].includes(method)) {
          let payload = config.data;
          if (typeof payload === 'string') {
            try {
              payload = JSON.parse(payload);
            } catch (e) {}
          }
          const offlineRes = await handleOfflineMutation(method, url, payload, currentUser);
          if (offlineRes) {
            console.warn(`[IndexedDB Offline Fallback] Mutated ${url} into local storage`);
            return Promise.resolve({
              ...offlineRes,
              status: 200,
              statusText: 'OK (Offline IndexedDB)',
              headers: {},
              config,
            });
          }
        }
      } catch (fallbackErr) {
        console.error('Offline fallback execution error:', fallbackErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
