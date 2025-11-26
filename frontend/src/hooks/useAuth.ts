'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.auth.me() as User;
      setUser(userData);
    } catch {
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password }) as { access_token: string; user: User };
    localStorage.setItem('access_token', response.access_token);
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const register = async (data: { email: string; password: string; name: string; role: string }) => {
    const response = await api.auth.register(data) as { access_token: string; user: User };
    localStorage.setItem('access_token', response.access_token);
    setUser(response.user);
    return response.user;
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    checkAuth,
  };
}
