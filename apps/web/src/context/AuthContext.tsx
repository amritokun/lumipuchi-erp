'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@lumipuchi/shared';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('lp_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Token might have expired
        logout();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const authToken = data.access_token;
        localStorage.setItem('lp_token', authToken);
        setToken(authToken);
        await fetchUserProfile(authToken);
        return true;
      } else {
        const errData = await res.json();
        setError(parseErrorDetail(errData.detail) || 'Login failed. Incorrect email or password.');
        return false;
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
      return false;
    }
  };

  const parseErrorDetail = (detail: any): string => {
    if (!detail) return '';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (first && typeof first === 'object') {
        const field = first.loc ? first.loc.filter((x: any) => x !== 'body').join('.') : '';
        return `${field ? `[${field}] ` : ''}${first.msg || 'Validation failed'}`;
      }
    }
    if (typeof detail === 'object') {
      return detail.message || JSON.stringify(detail);
    }
    return String(detail);
  };

  const signup = async (email: string, password: string, name: string, role: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (res.ok) {
        // Auto-login after successful signup
        return await login(email, password);
      } else {
        const errData = await res.json();
        setError(parseErrorDetail(errData.detail) || 'Signup failed. Please try again.');
        return false;
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('lp_token');
    setToken(null);
    setUser(null);
    setError(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
