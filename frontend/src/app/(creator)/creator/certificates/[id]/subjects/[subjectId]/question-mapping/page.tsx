'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Question, Textbook, QuestionMappingUpdateRequest } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// PdfViewer를 dynamic import로 로드 (SSR 비활성화)
const PdfViewer = dynamic(
  () => import('@/components/pdf/PdfViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-gray-500">PDF 뷰어 로딩 중...</p>
        </div>
      </div>
    ),
  }
);

export default function QuestionMappingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id as string;
  const subjectId = params.subjectId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedTextbook, setSelectedTextbook] = useState<Textbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filterMapped, setFilterMapped] = useState<string>('all');

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      let url = `/api/v1/subjects/${subjectId}/questions`;
      if (filterMapped === 'mapped') {
        url += '?mapped_only=true';
      } else if (filterMapped === 'unmapped') {
        url += '?mapped_only=false';
      }

      const [questionsData, textbooksData] = await Promise.all([
        apiClient<Question[]>(url),
        apiClient<Textbook[]>(`/api/v1/subjects/${subjectId}/textbooks`),
      ]);

      setQuestions(questionsData);
      setTextbooks(textbooksData);

      if (textbooksData.length > 0 && !selectedTextbook) {
        setSelectedTextbook(textbooksData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, subjectId, filterMapped]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // 페이지 매핑
  const handlePageSelect = async (pageNumber: number) => {
    if (!selectedQuestion) {
      alert('먼저 문제를 선택해주세요');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient(
        `/api/v1/subjects/${subjectId}/questions/${selectedQuestion.id}/mapping`,
        {
          method: 'PATCH',
          body: { textbook_page: pageNumber } as QuestionMappingUpdateRequest,
        }
      );

      // 목록 새로고침
      await fetchData();

      // 선택 상태 업데이트
      setSelectedQuestion((prev) =>
        prev ? { ...prev, textbook_page: pageNumber } : null
      );

      alert(`문제에 ${pageNumber}페이지가 매핑되었습니다`);

      // 다음 미매핑 문제로 자동 이동 (선택적)
      const nextUnmapped = questions.find(
        (q) => q.id !== selectedQuestion.id && q.textbook_page === null
      );
      if (nextUnmapped) {
        setSelectedQuestion(nextUnmapped);
      }
    } catch (error) {
      console.error('Failed to save mapping:', error);
      alert('매핑 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  // 매핑 해제
  const handleClearMapping = async () => {
    if (!selectedQuestion) return;
    if (!confirm('이 문제의 교재 매핑을 해제하시겠습니까?')) return;

    setIsSaving(true);
    try {
      await apiClient(
        `/api/v1/subjects/${subjectId}/questions/${selectedQuestion.id}/mapping`,
        {
          method: 'PATCH',
          body: { textbook_page: null } as QuestionMappingUpdateRequest,
        }
      );

      await fetchData();
      setSelectedQuestion((prev) =>
        prev ? { ...prev, textbook_page: null } : null
      );
    } catch (error) {
      console.error('Failed to clear mapping:', error);
      alert('매핑 해제에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  // 문제 삭제
  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;
    if (!confirm('이 문제를 삭제하시겠습니까?')) return;

    setIsSaving(true);
    try {
      await apiClient(
        `/api/v1/subjects/${subjectId}/questions/${selectedQuestion.id}`,
        {
          method: 'DELETE',
        }
      );

      await fetchData();
      setSelectedQuestion(null);
      alert('문제가 삭제되었습니다');
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('문제 삭제에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white shadow flex-shrink-0">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push(
                `/creator/certificates/${certificateId}/subjects/${subjectId}/questions`
              )}
            >
              ← 문제 관리
            </Button>
            <h1 className="text-lg font-bold">문제-교재 매핑</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* 필터 */}
            <Select value={filterMapped} onValueChange={setFilterMapped}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="mapped">매핑됨</SelectItem>
                <SelectItem value="unmapped">미매핑</SelectItem>
              </SelectContent>
            </Select>

            {/* 교재 선택 */}
            {textbooks.length > 0 && (
              <Select
                value={selectedTextbook?.id || ''}
                onValueChange={(id) => {
                  const textbook = textbooks.find((t) => t.id === id);
                  if (textbook) setSelectedTextbook(textbook);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="교재 선택" />
                </SelectTrigger>
                <SelectContent>
                  {textbooks.map((textbook) => (
                    <SelectItem key={textbook.id} value={textbook.id}>
                      {textbook.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 문제 리스트 */}
        <div className="w-2/5 border-r bg-white overflow-y-auto">
          <div className="p-3 border-b bg-gray-50 sticky top-0 flex items-center justify-between">
            <h2 className="font-semibold text-sm">
              문제 목록 ({questions.length}개)
            </h2>
            <Button
              size="sm"
              variant="outline"
              disabled
              className="opacity-50 cursor-not-allowed"
            >
              🤖 AI자동 매핑 (개발중)
            </Button>
          </div>

          {questions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filterMapped !== 'all' ? '해당하는 문제가 없습니다' : '문제가 없습니다'}
            </div>
          ) : (
            <div className="divide-y">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`transition-colors ${
                    selectedQuestion?.id === question.id
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* 문제 요약 */}
                  <div 
                    className="p-3 cursor-pointer"
                    onClick={() => {
                      // 같은 문제를 클릭하면 닫기, 다른 문제를 클릭하면 열기
                      if (selectedQuestion?.id === question.id) {
                        setSelectedQuestion(null);
                      } else {
                        setSelectedQuestion(question);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0">
                          Q{index + 1}
                        </span>
                        <p className="text-sm font-medium line-clamp-2">
                          {question.content}
                        </p>
                      </div>
                      {question.textbook_page && (
                        <div className="flex items-start gap-1 flex-shrink-0">
                          <span className="text-xs text-green-600 leading-none">📖</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded leading-none inline-block text-right tabular-nums" style={{ width: '3ch', minWidth: '3ch', maxWidth: '3ch' }}>
                            {question.textbook_page}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 확장된 문제 상세 정보 */}
                  {selectedQuestion?.id === question.id && (
                    <div className="px-3 pb-3 border-t pt-3">
                      {/* 보기 */}
                      <div className="space-y-2 mb-3">
                        {question.options.map((option, optIdx) => (
                          <div 
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 rounded ${
                              optIdx === question.correct_answer 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <span className="font-medium text-sm">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="text-sm flex-1">{option}</span>
                            {optIdx === question.correct_answer && (
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded font-medium">
                                정답
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* 해설 */}
                      {question.explanation && (
                        <div className="text-sm text-gray-700 bg-blue-100 p-2 rounded mb-3">
                          <span className="font-medium">해설:</span> {question.explanation}
                        </div>
                      )}
                      
                      {/* 매핑 정보 및 액션 */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t">
                        {question.textbook_page && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-600">📖</span>
                            <span className="text-xs text-green-600 font-medium">
                              현재 매핑: {question.textbook_page}페이지
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                          {question.textbook_page && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearMapping();
                              }}
                              disabled={isSaving}
                            >
                              매핑 해제
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion();
                            }}
                            disabled={isSaving}
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 우측: PDF 뷰어 */}
        <div className="w-3/5 flex flex-col">
          {/* PDF 뷰어 */}
          {!selectedTextbook ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">📚</p>
                <p>등록된 교재가 없습니다</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push(
                    `/creator/certificates/${certificateId}/subjects/${subjectId}/chapters`
                  )}
                >
                  교재 등록하기
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <PdfViewer
                fileUrl={`http://localhost:8000${selectedTextbook.file_url}`}
                onPageSelect={handlePageSelect}
                selectedPage={selectedQuestion?.textbook_page || null}
                height={500}
              />
            </div>
          )}
        </div>
      </div>

      {/* 저장 중 오버레이 */}
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg">저장 중...</div>
        </div>
      )}
    </div>
  );
}

