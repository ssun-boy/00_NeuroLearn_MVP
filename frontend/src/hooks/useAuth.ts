'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 현재 사용자 정보 가져오기
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiClient<User>('/api/v1/auth/me');
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 로그인
  const login = async (data: LoginRequest): Promise<void> => {
    const response = await apiClient<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: data,
    });

    localStorage.setItem('access_token', response.access_token);
    setUser(response.user);

    // 역할에 따라 리다이렉트
    if (response.user.role === 'creator') {
      router.push('/creator/dashboard');
    } else {
      router.push('/learner/dashboard');
    }
  };

  // 회원가입
  const register = async (data: RegisterRequest): Promise<void> => {
    const response = await apiClient<LoginResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: data,
    });

    localStorage.setItem('access_token', response.access_token);
    setUser(response.user);

    // 역할에 따라 리다이렉트
    if (response.user.role === 'creator') {
      router.push('/creator/dashboard');
    } else {
      router.push('/learner/dashboard');
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    router.push('/');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    fetchUser,
  };
}
