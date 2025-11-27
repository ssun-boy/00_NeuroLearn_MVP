// ===== 사용자 =====
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'creator' | 'learner';
  is_active: boolean;
  created_at: string;
}

// ===== 자격증 =====
export interface Certificate {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

// ===== 과목 =====
export interface Subject {
  id: string;
  certificate_id: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

// ===== 숙련도 가중치 =====
export interface ProficiencyWeight {
  id: string;
  subject_id: string;
  proficiency_level: number;  // 1~5
  time_weight: number;
}

// ===== 목차 (Chapter) =====
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

// ===== 교재 =====
export interface Textbook {
  id: string;
  subject_id: string;
  title: string;
  file_url: string;
  total_pages: number;
}

// ===== 영상 =====
export interface Video {
  id: string;
  subject_id: string;
  title: string;
  url: string;
  duration_seconds: number;
  order_index: number;
  created_at: string;
}

// ===== 문제 =====
export interface Question {
  id: string;
  subject_id: string;
  content: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  chapter_id: string | null;
  textbook_page: number | null;
  order_index: number;
  created_at: string;
}

// ===== 확장 타입 (관계 포함) =====

// 과목 (가중치 포함)
export interface SubjectWithWeights extends Subject {
  proficiency_weights: ProficiencyWeight[];
}

// 자격증 (과목 포함)
export interface CertificateWithSubjects extends Certificate {
  subjects: Subject[];
}

// ===== 인증 요청/응답 =====
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

// ===== 자격증 API 요청 =====
export interface CertificateCreateRequest {
  name: string;
  description?: string;
}

export interface CertificateUpdateRequest {
  name?: string;
  description?: string;
}

// ===== 과목 API 요청 =====
export interface SubjectCreateRequest {
  name: string;
  description?: string;
  order_index?: number;
}

export interface SubjectUpdateRequest {
  name?: string;
  description?: string;
  order_index?: number;
}

// ===== 숙련도 가중치 API 요청 =====
export interface ProficiencyWeightUpdateRequest {
  proficiency_level: number;
  time_weight: number;
}

// ===== 목차 트리 노드 =====
export interface ChapterTreeNode extends Chapter {
  children: ChapterTreeNode[];
}

// ===== 목차 API 요청 =====
export interface ChapterCreateRequest {
  title: string;
  parent_id?: string | null;
  order_index?: number;
}

export interface ChapterUpdateRequest {
  title?: string;
  parent_id?: string | null;
  order_index?: number;
}

export interface ChapterMappingUpdateRequest {
  textbook_page: number | null;
}

export interface ChapterVideoMappingUpdateRequest {
  video_id: string | null;
  video_start_seconds: number | null;
}

// ===== 교재 API 요청 =====
export interface TextbookCreateRequest {
  title: string;
  file_url: string;
  total_pages: number;
}

export interface TextbookUpdateRequest {
  title?: string;
  total_pages?: number;
}

// ===== 파일 업로드 응답 =====
export interface FileUploadResponse {
  file_url: string;
  file_name: string;
  file_size: number;
}

// ===== 영상 API 요청 =====
export interface VideoCreateRequest {
  title: string;
  url: string;
  duration_seconds: number;
  order_index?: number;
}

export interface VideoUpdateRequest {
  title?: string;
  url?: string;
  duration_seconds?: number;
  order_index?: number;
}

// ===== 시간 포맷 헬퍼 타입 =====
export interface TimeFormat {
  hours: number;
  minutes: number;
  seconds: number;
}

// ===== 문제 API 요청 =====
export interface QuestionCreateRequest {
  content: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  chapter_id?: string;
  textbook_page?: number;
  order_index?: number;
}

export interface QuestionUpdateRequest {
  content?: string;
  options?: string[];
  correct_answer?: number;
  explanation?: string;
  chapter_id?: string | null;
  textbook_page?: number | null;
  order_index?: number;
}

export interface QuestionMappingUpdateRequest {
  textbook_page: number | null;
  chapter_id?: string | null;
}

// ===== 문제 통계 =====
export interface QuestionStats {
  total_count: number;
  mapped_count: number;
  unmapped_count: number;
}

// ===== 공통 응답 =====
export interface MessageResponse {
  message: string;
}

// ===== API 에러 =====
export interface ApiError {
  detail: string;
}

// ===== 검수 =====
// 검수 상태
export type ValidationStatus = 'ok' | 'warning' | 'error';

// 목차 검수 항목
export interface ChapterValidationItem {
  id: string;
  title: string;
  depth: number;
  has_textbook_mapping: boolean;
  has_video_mapping: boolean;
  textbook_page: number | null;
  video_start_seconds: number | null;
  status: ValidationStatus;
  message: string | null;
}

// 문제 검수 항목
export interface QuestionValidationItem {
  id: string;
  content: string;
  has_textbook_mapping: boolean;
  textbook_page: number | null;
  status: ValidationStatus;
  message: string | null;
}

// 검수 요약
export interface ValidationSummary {
  total: number;
  with_textbook: number;
  with_video?: number;
  ok: number;
  warning: number;
  error?: number;
  textbook_percentage: number;
  video_percentage?: number;
}

// 목차 검수 결과
export interface ChapterValidationResult {
  summary: ValidationSummary;
  items: ChapterValidationItem[];
}

// 문제 검수 결과
export interface QuestionValidationResult {
  summary: ValidationSummary;
  items: QuestionValidationItem[];
}

// 전체 검수 결과
export interface FullValidationResult {
  subject_id: string;
  subject_name: string;
  chapter_validation: ChapterValidationResult;
  question_validation: QuestionValidationResult;
  overall_status: ValidationStatus;
  completion_percentage: number;
}
