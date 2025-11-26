// 사용자
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'creator' | 'learner';
  is_active: boolean;
  created_at: string;
}

// 자격증
export interface Certificate {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  created_at: string;
}

// 과목
export interface Subject {
  id: string;
  certificate_id: string;
  name: string;
  description: string;
  order_index: number;
}

// 목차 (Chapter)
export interface Chapter {
  id: string;
  subject_id: string;
  parent_id: string | null;
  title: string;
  order_index: number;
  depth: number;
  textbook_page: number | null;
  video_id: string | null;
  video_start_seconds: number | null;
  children?: Chapter[];
}

// 교재
export interface Textbook {
  id: string;
  subject_id: string;
  title: string;
  file_url: string;
  total_pages: number;
}

// 영상
export interface Video {
  id: string;
  subject_id: string;
  title: string;
  url: string;
  duration_seconds: number;
  order_index: number;
}

// 문제
export interface Question {
  id: string;
  subject_id: string;
  content: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  textbook_page: number | null;
  chapter_id: string | null;
}

// 인증 관련
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'creator' | 'learner';
}

