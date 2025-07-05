import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import api from '../utils/api';

const AuthContext = createContext();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: authToken, user: userData } = response.data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (email, password, fullName, organization) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        organization
      });
      
      const { token: authToken, user: userData } = response.data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Profile update failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};