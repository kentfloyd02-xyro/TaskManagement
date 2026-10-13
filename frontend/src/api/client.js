import axios from 'axios';
import { dbUpsertAndDeduplicate, dbPutMany } from '../db/indexedDB';
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

// Natural key extractors for deduplication
const taskNaturalKey = (t) => `${(t.title || '').trim().toLowerCase()}_${t.academicPeriod || ''}`;
const schedNaturalKey = (s) =>
  `${(s.subjectCode || s.subjectName || '').trim().toLowerCase()}_${(s.days || []).join('-')}_${s.startTime || ''}`;
const subNaturalKey = (s) => `${(s.code || s.name || '').trim().toLowerCase()}`;
const revNaturalKey = (r) => `${(r.title || r.subject || '').trim().toLowerCase()}_${r.category || ''}`;

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Background auto-cache and deduplicate into IndexedDB on successful GET
    const url = response.config?.url || '';
    if (response.config?.method?.toLowerCase() === 'get' && response.data) {
      try {
        if (url.startsWith('/tasks')) {
          const list = response.data.data || response.data.tasks;
          if (Array.isArray(list)) {
            dbUpsertAndDeduplicate('tasks', list, taskNaturalKey).catch(() => {});
          }
        } else if (url.startsWith('/schedule')) {
          const list = response.data.schedules || response.data.data;
          if (Array.isArray(list)) {
            dbUpsertAndDeduplicate('schedules', list, schedNaturalKey).catch(() => {});
          }
        } else if (url.startsWith('/subjects')) {
          const list = response.data.data || response.data.subjects;
          if (Array.isArray(list)) {
            dbUpsertAndDeduplicate('subjects', list, subNaturalKey).catch(() => {});
          }
        } else if (url.startsWith('/reviewer/materials')) {
          const mats = response.data.data || response.data.materials;
          if (Array.isArray(mats)) {
            dbUpsertAndDeduplicate('reviewers', mats, revNaturalKey).catch(() => {});
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
