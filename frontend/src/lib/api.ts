const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token') 
    : null;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API 요청 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // 네트워크 오류 또는 fetch 실패
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (${API_BASE_URL})`);
    }
    throw error;
  }
}

// API 함수들
export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      apiClient('/api/v1/auth/login', { method: 'POST', body: data }),
    register: (data: { email: string; password: string; name: string; role: string }) =>
      apiClient('/api/v1/auth/register', { method: 'POST', body: data }),
    me: () => apiClient('/api/v1/auth/me'),
  },
};
