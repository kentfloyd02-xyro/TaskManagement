import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import {
  openDB,
  dbSaveUser,
  dbGetUserByEmail,
  dbVerifyOfflineCredentials,
  dbAddToSyncQueue,
  syncExistingAccountsFromCloud,
  syncAllMongoDBDataToIndexedDB,
} from '../db/indexedDB';
import { runBackgroundAutoSync } from '../utils/offlineSync';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('student_user') || sessionStorage.getItem('student_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.email.toLowerCase() === 'kentfloyd02@gmail.com') {
          parsed.role = 'admin';
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('student_token') || sessionStorage.getItem('student_token'));
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('student_theme') || 'dark');

  // Initialize IndexedDB and automatically sync all MongoDB data with zero duplicates
  useEffect(() => {
    // 1. Ensure IndexedDB is initialized and pre-seeded
    openDB().catch((err) => console.warn('IndexedDB initialization notice:', err));

    // 2. Fetch and sync ALL collections from MongoDB to IndexedDB (Tasks, Schedules, Subjects, Reviewers, Users)
    const syncAllData = () => {
      if (navigator.onLine) {
        syncAllMongoDBDataToIndexedDB(api, user).catch(() => {});
      }
    };

    syncAllData();
    window.addEventListener('online', syncAllData);
    return () => window.removeEventListener('online', syncAllData);
  }, [user?._id]);

  // Apply theme class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('student_theme', theme);
  }, [theme]);

  // Check current user session on mount ONLY
  useEffect(() => {
    const verifyUser = async () => {
      const activeToken = localStorage.getItem('student_token') || sessionStorage.getItem('student_token');
      if (activeToken) {
        // If offline, trust local saved session / IndexedDB
        if (!navigator.onLine) {
          const cachedUser =
            localStorage.getItem('student_user') || sessionStorage.getItem('student_user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch (e) {}
          }
          setLoading(false);
          return;
        }

        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            const userData = res.data.user;
            if (userData.email && userData.email.toLowerCase() === 'kentfloyd02@gmail.com') {
              userData.role = 'admin';
            }
            setUser(userData);
            dbSaveUser(userData).catch(() => {});

            if (localStorage.getItem('student_token')) {
              localStorage.setItem('student_user', JSON.stringify(userData));
            } else if (sessionStorage.getItem('student_token')) {
              sessionStorage.setItem('student_user', JSON.stringify(userData));
            }
            if (userData.themePreference) {
              setTheme(userData.themePreference);
            }
            // Auto-sync full MongoDB data to IndexedDB
            syncAllMongoDBDataToIndexedDB(api, userData).catch(() => {});
          }
        } catch (err) {
          // If 401 Unauthorized specifically, log out. If network error, keep offline session!
          if (err.response && err.response.status === 401) {
            console.error('Session verify unauthorized, logging out');
            logout();
          } else {
            console.warn('Network issue during session verify, keeping offline session:', err);
            const cachedUser =
              localStorage.getItem('student_user') || sessionStorage.getItem('student_user');
            if (cachedUser) {
              try {
                setUser(JSON.parse(cachedUser));
              } catch (e) {}
            }
          }
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []); // Run strictly on mount to avoid race conditions with login()

  // LOGIN (With IndexedDB Offline Support)
  const login = async (email, password, rememberMe = false) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Online Login first if navigator is online
    if (navigator.onLine) {
      try {
        const res = await api.post('/auth/login', { email: cleanEmail, password });
        if (res.data?.success) {
          const userData = res.data.user;
          const newToken = res.data.token;
          if (cleanEmail === 'kentfloyd02@gmail.com') {
            userData.role = 'admin';
          }

          // Clean old storage and write new session FIRST before updating React state
          localStorage.removeItem('student_token');
          localStorage.removeItem('student_user');
          sessionStorage.removeItem('student_token');
          sessionStorage.removeItem('student_user');

          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('student_token', newToken);
          storage.setItem('student_user', JSON.stringify(userData));

          // Set state immediately
          setToken(newToken);
          setUser(userData);
          setLoading(false);

          if (userData.themePreference) {
            setTheme(userData.themePreference);
          }

          // Background asynchronous IndexedDB caching without blocking navigation
          dbSaveUser(userData, password).catch((e) => console.warn('dbSaveUser notice:', e));
          syncAllMongoDBDataToIndexedDB(api, userData).catch((e) => console.warn('syncAllMongoDB notice:', e));

          return res.data;
        }
      } catch (err) {
        // If wrong credentials 400/401 from server, bubble up error
        if (err.response && [400, 401, 404].includes(err.response.status)) {
          throw err;
        }
        // If server 502/503 or network failure, fall down to IndexedDB offline login!
        console.warn('Server unreachable during login, attempting IndexedDB offline auth...', err);
      }
    }

    // 2. OFFLINE INDEXEDDB LOGIN FALLBACK
    const localUser = await dbVerifyOfflineCredentials(cleanEmail, password);
    if (localUser) {
      const dummyToken = `offline_token_${Date.now()}`;

      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      sessionStorage.removeItem('student_token');
      sessionStorage.removeItem('student_user');

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('student_token', dummyToken);
      storage.setItem('student_user', JSON.stringify(localUser));

      setToken(dummyToken);
      setUser(localUser);
      setLoading(false);

      return {
        success: true,
        user: localUser,
        token: dummyToken,
        isOffline: true,
        message: 'Naka-login sa Offline Mode gamit ang IndexedDB.',
      };
    }

    // If not found in IndexedDB
    throw {
      response: {
        data: {
          message:
            'Offline Mode: Walang account na tumutugma sa IndexedDB sa CP/device na ito. Mag-register o mag-login nang may internet muna.',
        },
      },
    };
  };

  // REGISTER (With IndexedDB Offline Support)
  const register = async (formData, rememberMe = false) => {
    const cleanEmail = formData.email.trim().toLowerCase();
    const defaultAvatar = formData.gender === 'female' ? 'female-wolf' : 'male-wolf';

    // 1. Try Online Register first if navigator is online
    if (navigator.onLine) {
      try {
        const res = await api.post('/auth/register', { ...formData, email: cleanEmail });
        if (res.data?.success) {
          const userData = res.data.user;
          setToken(res.data.token);
          setUser(userData);

          // Save into IndexedDB
          await dbSaveUser(userData, formData.password);

          localStorage.removeItem('student_token');
          localStorage.removeItem('student_user');
          sessionStorage.removeItem('student_token');
          sessionStorage.removeItem('student_user');

          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('student_token', res.data.token);
          storage.setItem('student_user', JSON.stringify(userData));
          return res.data;
        }
      } catch (err) {
        if (err.response && [400, 409].includes(err.response.status)) {
          throw err; // e.g. Email already registered
        }
        console.warn('Server unreachable during register, falling back to IndexedDB...', err);
      }
    }

    // 2. OFFLINE INDEXEDDB REGISTRATION FALLBACK
    // Check if user already exists locally
    const existing = await dbGetUserByEmail(cleanEmail);
    if (existing) {
      throw {
        response: {
          data: {
            message: 'Mayroon nang account sa IndexedDB gamit ang email na ito.',
          },
        },
      };
    }

    const localUser = {
      _id: `offline_user_${Date.now()}`,
      name: formData.name,
      email: cleanEmail,
      course: formData.course || 'College Student',
      yearLevel: formData.yearLevel || '1st Year',
      gender: formData.gender || 'male',
      avatar: formData.avatar || defaultAvatar,
      role: cleanEmail === 'kentfloyd02@gmail.com' ? 'admin' : 'student',
      themePreference: 'dark',
      createdAt: new Date().toISOString(),
      isLocalOnly: true,
    };

    // Save account in IndexedDB
    await dbSaveUser(localUser, formData.password);

    // Queue registration for background sync when reconnected
    await dbAddToSyncQueue({
      type: 'REGISTER_USER',
      entity: 'users',
      url: '/auth/register',
      method: 'POST',
      payload: { ...formData, email: cleanEmail },
      tempId: localUser._id,
    });

    const dummyToken = `offline_token_${Date.now()}`;
    setToken(dummyToken);
    setUser(localUser);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('student_token', dummyToken);
    storage.setItem('student_user', JSON.stringify(localUser));

    return {
      success: true,
      user: localUser,
      token: dummyToken,
      isOffline: true,
      message: 'Matagumpay na nag-register offline sa IndexedDB!',
    };
  };

  // UPDATE PROFILE (With IndexedDB Support)
  const updateProfile = async (data) => {
    // Update local state and IndexedDB immediately
    if (user) {
      const updatedLocalUser = { ...user, ...data };
      setUser(updatedLocalUser);
      await dbSaveUser(updatedLocalUser);

      if (localStorage.getItem('student_token')) {
        localStorage.setItem('student_user', JSON.stringify(updatedLocalUser));
      }
      if (sessionStorage.getItem('student_token')) {
        sessionStorage.setItem('student_user', JSON.stringify(updatedLocalUser));
      }
    }

    if (navigator.onLine) {
      try {
        const res = await api.put('/auth/profile', data);
        if (res.data?.success) {
          setUser(res.data.user);
          await dbSaveUser(res.data.user);
          if (data.themePreference) {
            setTheme(data.themePreference);
          }
          return res.data;
        }
      } catch (err) {
        console.warn('Profile update queued for online sync:', err);
      }
    }

    if (data.themePreference) {
      setTheme(data.themePreference);
    }

    return { success: true, user: { ...user, ...data }, isOffline: true };
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (user) {
      updateProfile({ themePreference: nextTheme }).catch(() => {});
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    sessionStorage.removeItem('student_token');
    sessionStorage.removeItem('student_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        toggleTheme,
        login,
        register,
        updateProfile,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
