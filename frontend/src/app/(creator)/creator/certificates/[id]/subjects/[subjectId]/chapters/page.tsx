'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { 
  ChapterTreeNode, 
  Textbook, 
  ChapterCreateRequest,
  TextbookCreateRequest,
  FileUploadResponse 
} from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Video, Loader2 } from 'lucide-react';

// 목차 트리 아이템 컴포넌트
function ChapterTreeItem({ 
  chapter, 
  depth = 0,
  onAddChild,
  onEdit,
  onDelete,
  onSelect,
  selectedId
}: {
  chapter: ChapterTreeNode;
  depth?: number;
  onAddChild: (parentId: string) => void;
  onEdit: (chapter: ChapterTreeNode) => void;
  onDelete: (chapterId: string) => void;
  onSelect: (chapterId: string) => void;
  selectedId: string | null;
}) {
  const isSelected = selectedId === chapter.id;
  const hasTextbook = chapter.textbook_page !== null;
  const hasVideo = chapter.video_id !== null;

  return (
    <div className="group">
      <div 
        className={`flex items-center gap-2 py-2 px-3 rounded cursor-pointer hover:bg-gray-100 transition-colors ${
          isSelected ? 'bg-blue-50 border border-blue-200' : ''
        }`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => onSelect(chapter.id)}
      >
        {/* 계층 표시 */}
        <span className="text-gray-400 text-sm w-6">
          {depth === 0 ? '📁' : depth === 1 ? '📄' : '📝'}
        </span>
        
        {/* 제목 */}
        <span className="flex-1 font-medium">{chapter.title}</span>
        
        {/* 매핑 상태 아이콘 */}
        <span className={`text-sm ${hasTextbook ? 'text-green-500' : 'text-gray-300'}`} title="교재 매핑">
          📖
        </span>
        <span className={`text-sm ${hasVideo ? 'text-green-500' : 'text-gray-300'}`} title="영상 매핑">
          🎬
        </span>
        
        {/* 액션 버튼들 */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onAddChild(chapter.id); }}
            title="하위 목차 추가"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); onEdit(chapter); }}
            title="수정"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            onClick={(e) => { e.stopPropagation(); onDelete(chapter.id); }}
            title="삭제"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 하위 목차 */}
      {chapter.children && chapter.children.length > 0 && (
        <div>
          {chapter.children.map((child) => (
            <ChapterTreeItem
              key={child.id}
              chapter={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChaptersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id as string;
  const subjectId = params.subjectId as string;

  const [chapters, setChapters] = useState<ChapterTreeNode[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Dialog 상태
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterTreeNode | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 교재 업로드 상태
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileUploadResponse | null>(null);
  const [newTextbookTitle, setNewTextbookTitle] = useState('');
  const [newTextbookPages, setNewTextbookPages] = useState<number>(0);

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      const [chaptersData, textbooksData] = await Promise.all([
        apiClient<ChapterTreeNode[]>(`/api/v1/subjects/${subjectId}/chapters/tree`),
        apiClient<Textbook[]>(`/api/v1/subjects/${subjectId}/textbooks`)
      ]);
      setChapters(chaptersData);
      setTextbooks(textbooksData);
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

  // 목차 추가 Dialog 열기
  const handleOpenAddChapter = (parentId: string | null = null) => {
    setParentIdForNew(parentId);
    setNewChapterTitle('');
    setIsAddChapterOpen(true);
  };

  // 목차 수정 Dialog 열기
  const handleOpenEditChapter = (chapter: ChapterTreeNode) => {
    setEditingChapter(chapter);
    setNewChapterTitle(chapter.title);
    setIsEditChapterOpen(true);
  };

  // 목차 생성
  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient(`/api/v1/subjects/${subjectId}/chapters`, {
        method: 'POST',
        body: {
          title: newChapterTitle,
          parent_id: parentIdForNew,
          order_index: 0
        } as ChapterCreateRequest
      });

      await fetchData(); // 트리 새로고침
      setIsAddChapterOpen(false);
      setNewChapterTitle('');
      setParentIdForNew(null);
    } catch (error) {
      console.error('Failed to create chapter:', error);
      alert('목차 추가에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 목차 수정
  const handleUpdateChapter = async () => {
    if (!editingChapter || !newChapterTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient(`/api/v1/subjects/${subjectId}/chapters/${editingChapter.id}`, {
        method: 'PUT',
        body: {
          title: newChapterTitle
        }
      });

      await fetchData();
      setIsEditChapterOpen(false);
      setEditingChapter(null);
      setNewChapterTitle('');
    } catch (error) {
      console.error('Failed to update chapter:', error);
      alert('목차 수정에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 목차 삭제
  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('하위 목차도 함께 삭제됩니다. 계속하시겠습니까?')) return;

    try {
      await apiClient(`/api/v1/subjects/${subjectId}/chapters/${chapterId}`, {
        method: 'DELETE'
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      alert('목차 삭제에 실패했습니다');
    }
  };

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/subjects/${subjectId}/textbooks/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Upload failed');
      }

      const data: FileUploadResponse = await response.json();
      setUploadedFile(data);
      setNewTextbookTitle(file.name.replace('.pdf', ''));
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('파일 업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
    }
  };

  // 교재 정보 저장
  const handleCreateTextbook = async () => {
    if (!uploadedFile || !newTextbookTitle || newTextbookPages <= 0) return;

    setIsSubmitting(true);
    try {
      await apiClient(`/api/v1/subjects/${subjectId}/textbooks`, {
        method: 'POST',
        body: {
          title: newTextbookTitle,
          file_url: uploadedFile.file_url,
          total_pages: newTextbookPages
        } as TextbookCreateRequest
      });

      await fetchData();
      setUploadedFile(null);
      setNewTextbookTitle('');
      setNewTextbookPages(0);
      alert('교재가 등록되었습니다');
    } catch (error) {
      console.error('Failed to create textbook:', error);
      alert('교재 등록에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 교재 삭제
  const handleDeleteTextbook = async (textbookId: string) => {
    if (!confirm('교재를 삭제하시겠습니까?')) return;

    try {
      await apiClient(`/api/v1/subjects/${subjectId}/textbooks/${textbookId}`, {
        method: 'DELETE'
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to delete textbook:', error);
      alert('교재 삭제에 실패했습니다');
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/creator/certificates/${certificateId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              과목 목록
            </Button>
            <h1 className="text-xl font-bold">목차 관리</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 목차 트리 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>목차 구조</CardTitle>
                <Button onClick={() => handleOpenAddChapter(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  최상위 목차
                </Button>
              </CardHeader>
              <CardContent>
                {chapters.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    아직 목차가 없습니다. 새 목차를 추가해보세요!
                  </div>
                ) : (
                  <div className="space-y-1">
                    {chapters.map((chapter) => (
                      <ChapterTreeItem
                        key={chapter.id}
                        chapter={chapter}
                        onAddChild={handleOpenAddChapter}
                        onEdit={handleOpenEditChapter}
                        onDelete={handleDeleteChapter}
                        onSelect={setSelectedChapterId}
                        selectedId={selectedChapterId}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 교재 관리 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  교재 PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 교재 목록 */}
                {textbooks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    등록된 교재가 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {textbooks.map((textbook) => (
                      <div 
                        key={textbook.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{textbook.title}</p>
                          <p className="text-xs text-gray-500">{textbook.total_pages}페이지</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTextbook(textbook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 새 교재 업로드 */}
                <div className="border-t pt-4">
                  <Label htmlFor="pdf-upload">새 교재 업로드</Label>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="mt-2"
                  />
                  
                  {isUploading && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      업로드 중...
                    </div>
                  )}

                  {uploadedFile && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <span>✓</span>
                        <span>{uploadedFile.file_name} 업로드 완료</span>
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="textbook-title">교재 제목</Label>
                        <Input
                          id="textbook-title"
                          value={newTextbookTitle}
                          onChange={(e) => setNewTextbookTitle(e.target.value)}
                          placeholder="교재 제목을 입력하세요"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="textbook-pages">총 페이지 수</Label>
                        <Input
                          id="textbook-pages"
                          type="number"
                          min="1"
                          value={newTextbookPages || ''}
                          onChange={(e) => setNewTextbookPages(parseInt(e.target.value) || 0)}
                          placeholder="페이지 수"
                        />
                      </div>
                      <Button 
                        onClick={handleCreateTextbook}
                        disabled={isSubmitting || !newTextbookTitle || newTextbookPages <= 0}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            저장 중...
                          </>
                        ) : (
                          '교재 등록'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 목차 추가 Dialog */}
      <Dialog open={isAddChapterOpen} onOpenChange={setIsAddChapterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {parentIdForNew ? '하위 목차 추가' : '최상위 목차 추가'}
            </DialogTitle>
            <DialogDescription>
              목차 제목을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chapterTitle">목차 제목</Label>
              <Input
                id="chapterTitle"
                placeholder="예: 1장. 컴퓨터 개요"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newChapterTitle.trim()) {
                    handleCreateChapter();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddChapterOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleCreateChapter}
              disabled={isSubmitting || !newChapterTitle.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  추가 중...
                </>
              ) : (
                '추가'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 목차 수정 Dialog */}
      <Dialog open={isEditChapterOpen} onOpenChange={setIsEditChapterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>목차 수정</DialogTitle>
            <DialogDescription>
              목차 제목을 수정하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editChapterTitle">목차 제목</Label>
              <Input
                id="editChapterTitle"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newChapterTitle.trim()) {
                    handleUpdateChapter();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditChapterOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleUpdateChapter}
              disabled={isSubmitting || !newChapterTitle.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  수정 중...
                </>
              ) : (
                '수정'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

