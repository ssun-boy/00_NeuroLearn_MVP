'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { ChapterTreeNode, Textbook, ChapterMappingUpdateRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';

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

// 목차 트리 아이템 (매핑용)
function MappingChapterItem({
  chapter,
  depth = 0,
  selectedId,
  onSelect,
}: {
  chapter: ChapterTreeNode;
  depth?: number;
  selectedId: string | null;
  onSelect: (chapter: ChapterTreeNode) => void;
}) {
  const isSelected = selectedId === chapter.id;
  const hasTextbookMapping = chapter.textbook_page !== null;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-blue-100 border-2 border-blue-400' 
            : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        onClick={() => onSelect(chapter)}
      >
        {/* 제목 */}
        <span className="flex-1 text-sm font-medium truncate">
          {chapter.title}
        </span>

        {/* 매핑 상태 아이콘 및 페이지 번호 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-sm ${hasTextbookMapping ? 'text-green-500' : 'text-gray-400'}`}>
            📖
          </span>
          
          {/* 매핑된 페이지 번호 - 항상 동일한 공간 확보 */}
          <span className="text-xs min-w-[32px] text-center">
            {hasTextbookMapping ? (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                {chapter.textbook_page}
              </span>
            ) : null}
          </span>
        </div>
      </div>

      {/* 하위 목차 */}
      {chapter.children && chapter.children.length > 0 && (
        <div>
          {chapter.children.map((child) => (
            <MappingChapterItem
              key={child.id}
              chapter={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MappingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id as string;
  const subjectId = params.subjectId as string;

  const [chapters, setChapters] = useState<ChapterTreeNode[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [selectedTextbook, setSelectedTextbook] = useState<Textbook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterTreeNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      const [chaptersData, textbooksData] = await Promise.all([
        apiClient<ChapterTreeNode[]>(`/api/v1/subjects/${subjectId}/chapters/tree`),
        apiClient<Textbook[]>(`/api/v1/subjects/${subjectId}/textbooks`)
      ]);
      setChapters(chaptersData);
      setTextbooks(textbooksData);
      
      // 첫 번째 교재 자동 선택
      if (textbooksData.length > 0 && !selectedTextbook) {
        setSelectedTextbook(textbooksData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('데이터를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, subjectId]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user?.role !== 'creator') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  // 목차 선택
  const handleChapterSelect = (chapter: ChapterTreeNode) => {
    setSelectedChapter(chapter);
  };

  // 페이지 매핑
  const handlePageSelect = async (pageNumber: number) => {
    if (!selectedChapter) {
      alert('먼저 목차를 선택해주세요');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient(
        `/api/v1/subjects/${subjectId}/chapters/${selectedChapter.id}/textbook-mapping`,
        {
          method: 'PATCH',
          body: { textbook_page: pageNumber } as ChapterMappingUpdateRequest
        }
      );

      // 목차 데이터 새로고침
      await fetchData();
      
      // 선택 상태 업데이트
      setSelectedChapter((prev) => 
        prev ? { ...prev, textbook_page: pageNumber } : null
      );

      alert(`"${selectedChapter.title}"에 ${pageNumber}페이지가 매핑되었습니다`);
    } catch (error) {
      console.error('Failed to save mapping:', error);
      alert('매핑 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  // 매핑 해제
  const handleClearMapping = async () => {
    if (!selectedChapter) return;

    if (!confirm('이 목차의 교재 매핑을 해제하시겠습니까?')) return;

    setIsSaving(true);
    try {
      await apiClient(
        `/api/v1/subjects/${subjectId}/chapters/${selectedChapter.id}/textbook-mapping`,
        {
          method: 'PATCH',
          body: { textbook_page: null } as ChapterMappingUpdateRequest
        }
      );

      await fetchData();
      setSelectedChapter((prev) => 
        prev ? { ...prev, textbook_page: null } : null
      );
      alert('매핑이 해제되었습니다');
    } catch (error) {
      console.error('Failed to clear mapping:', error);
      alert('매핑 해제에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  // 교재 선택 변경
  const handleTextbookChange = (textbookId: string) => {
    const textbook = textbooks.find((t) => t.id === textbookId);
    if (textbook) {
      setSelectedTextbook(textbook);
      // 교재 변경 시 선택된 목차 초기화
      setSelectedChapter(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white shadow flex-shrink-0">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(
                `/creator/certificates/${certificateId}/subjects/${subjectId}/chapters`
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              목차 관리
            </Button>
            <h1 className="text-lg font-bold">목차-교재 매핑</h1>
          </div>

          {/* 교재 선택 */}
          {textbooks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">교재:</span>
              <Select
                value={selectedTextbook?.id || ''}
                onValueChange={handleTextbookChange}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="교재 선택" />
                </SelectTrigger>
                <SelectContent>
                  {textbooks.map((textbook) => (
                    <SelectItem key={textbook.id} value={textbook.id}>
                      {textbook.title} ({textbook.total_pages}p)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 목차 트리 */}
        <div className="w-1/3 border-r bg-white overflow-auto">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">목차 선택</h2>
            <p className="text-sm text-gray-500 mt-1">
              매핑할 목차를 클릭하세요
            </p>
          </div>
          
          <div className="p-2">
            {chapters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                목차가 없습니다
              </div>
            ) : (
              chapters.map((chapter) => (
                <MappingChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  selectedId={selectedChapter?.id || null}
                  onSelect={handleChapterSelect}
                />
              ))
            )}
          </div>
        </div>

        {/* 우측: PDF 뷰어 */}
        <div className="w-2/3 flex flex-col">
          {/* 선택된 목차 정보 */}
          {selectedChapter && (
            <div className="p-3 bg-blue-50 border-b flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">선택된 목차: </span>
                <span className="font-semibold">{selectedChapter.title}</span>
                {selectedChapter.textbook_page && (
                  <span className="ml-2 text-sm text-green-600">
                    (현재 매핑: {selectedChapter.textbook_page}페이지)
                  </span>
                )}
              </div>
              {selectedChapter.textbook_page && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleClearMapping}
                  disabled={isSaving}
                >
                  매핑 해제
                </Button>
              )}
            </div>
          )}

          {/* PDF 뷰어 */}
          {!selectedTextbook ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">등록된 교재가 없습니다</p>
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
                fileUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${selectedTextbook.file_url}`}
                onPageSelect={handlePageSelect}
                selectedPage={selectedChapter?.textbook_page || null}
                height={600}
              />
            </div>
          )}
        </div>
      </div>

      {/* 저장 중 오버레이 */}
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <span>저장 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}

