import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

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

  // Check current user session on mount
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            const userData = res.data.user;
            if (userData.email && userData.email.toLowerCase() === 'kentfloyd02@gmail.com') {
              userData.role = 'admin';
            }
            setUser(userData);
            localStorage.setItem('student_user', JSON.stringify(userData));
            if (userData.themePreference) {
              setTheme(userData.themePreference);
            }
          }
        } catch (err) {
          console.error('Session verify failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password, rememberMe = false) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const userData = res.data.user;
      if (userData.email && userData.email.toLowerCase() === 'kentfloyd02@gmail.com') {
        userData.role = 'admin';
      }
      setToken(res.data.token);
      setUser(userData);

      // Clean old states
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      sessionStorage.removeItem('student_token');
      sessionStorage.removeItem('student_user');

      // If Remember Me is checked, persist in localStorage; otherwise, use sessionStorage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('student_token', res.data.token);
      storage.setItem('student_user', JSON.stringify(userData));

      if (userData.themePreference) {
        setTheme(userData.themePreference);
      }
      return res.data;
    }
  };

  const register = async (formData, rememberMe = false) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);

      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      sessionStorage.removeItem('student_token');
      sessionStorage.removeItem('student_user');

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('student_token', res.data.token);
      storage.setItem('student_user', JSON.stringify(res.data.user));
      return res.data;
    }
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.data.success) {
      setUser(res.data.user);
      if (localStorage.getItem('student_token')) {
        localStorage.setItem('student_user', JSON.stringify(res.data.user));
      }
      if (sessionStorage.getItem('student_token')) {
        sessionStorage.setItem('student_user', JSON.stringify(res.data.user));
      }
      if (data.themePreference) {
        setTheme(data.themePreference);
      }
      return res.data;
    }
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
