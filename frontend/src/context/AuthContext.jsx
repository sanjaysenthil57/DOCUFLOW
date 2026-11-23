import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [studentMeta, setStudentMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('docuflow_token');
      const storedUser = localStorage.getItem('docuflow_user');
      const storedMeta = localStorage.getItem('docuflow_meta');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          if (storedMeta) setStudentMeta(JSON.parse(storedMeta));
          // Refresh from backend to verify validity
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            setStudentMeta(res.data.studentMeta);
            localStorage.setItem('docuflow_user', JSON.stringify(res.data.user));
            if (res.data.studentMeta) {
              localStorage.setItem('docuflow_meta', JSON.stringify(res.data.studentMeta));
            }
          }
        } catch (err) {
          console.warn('Session verification failed, please log in again.');
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const res = await authApi.login({ email, password, rememberMe });
    if (res.data.success) {
      const { token, user: loggedUser, studentMeta: meta } = res.data;
      localStorage.setItem('docuflow_token', token);
      localStorage.setItem('docuflow_user', JSON.stringify(loggedUser));
      if (rememberMe) {
        localStorage.setItem('docuflow_remembered_email', email);
      } else {
        localStorage.removeItem('docuflow_remembered_email');
      }
      if (meta) {
        localStorage.setItem('docuflow_meta', JSON.stringify(meta));
      }
      setUser(loggedUser);
      setStudentMeta(meta || null);
      return loggedUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const loginWithGoogle = async (googlePayload) => {
    const res = await authApi.googleAuth(googlePayload);
    if (res.data.success && res.data.token) {
      const { token, user: loggedUser, studentMeta: meta } = res.data;
      localStorage.setItem('docuflow_token', token);
      localStorage.setItem('docuflow_user', JSON.stringify(loggedUser));
      if (meta) {
        localStorage.setItem('docuflow_meta', JSON.stringify(meta));
      }
      setUser(loggedUser);
      setStudentMeta(meta || null);
      return loggedUser;
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('docuflow_token');
    localStorage.removeItem('docuflow_user');
    localStorage.removeItem('docuflow_meta');
    setUser(null);
    setStudentMeta(null);
  };

  return (
    <AuthContext.Provider value={{ user, studentMeta, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
