'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Question, QuestionCreateRequest, QuestionStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function QuestionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id as string;
  const subjectId = params.subjectId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog 상태
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState<number>(0);
  const [newExplanation, setNewExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 필터
  const [filterMapped, setFilterMapped] = useState<boolean | null>(null);

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      let url = `/api/v1/subjects/${subjectId}/questions`;
      if (filterMapped !== null) {
        url += `?mapped_only=${filterMapped}`;
      }
      
      const [questionsData, statsData] = await Promise.all([
        apiClient<Question[]>(url),
        apiClient<QuestionStats>(`/api/v1/subjects/${subjectId}/questions/stats`)
      ]);
      
      setQuestions(questionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
      setQuestions([]);
      setStats({ total_count: 0, mapped_count: 0, unmapped_count: 0 });
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

  // 보기 추가
  const addOption = () => {
    if (newOptions.length < 5) {
      setNewOptions([...newOptions, '']);
    }
  };

  // 보기 삭제
  const removeOption = (index: number) => {
    if (newOptions.length > 2) {
      const updated = newOptions.filter((_, i) => i !== index);
      setNewOptions(updated);
      // 정답 인덱스 조정
      if (newCorrectAnswer >= updated.length) {
        setNewCorrectAnswer(updated.length - 1);
      } else if (newCorrectAnswer > index) {
        setNewCorrectAnswer(newCorrectAnswer - 1);
      }
    }
  };

  // 보기 내용 변경
  const updateOption = (index: number, value: string) => {
    const updated = [...newOptions];
    updated[index] = value;
    setNewOptions(updated);
  };

  // 문제 추가
  const handleAddQuestion = async () => {
    if (!newContent.trim()) {
      alert('문제 내용을 입력해주세요');
      return;
    }
    
    const filledOptions = newOptions.filter(o => o.trim() !== '');
    if (filledOptions.length < 2) {
      alert('최소 2개의 보기를 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient(`/api/v1/subjects/${subjectId}/questions`, {
        method: 'POST',
        body: {
          content: newContent,
          options: filledOptions,
          correct_answer: newCorrectAnswer,
          explanation: newExplanation || null,
          order_index: questions.length,
        } as QuestionCreateRequest,
      });

      await fetchData();
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add question:', error);
      const errorMessage = error instanceof Error ? error.message : '문제 등록에 실패했습니다';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setNewContent('');
    setNewOptions(['', '', '', '']);
    setNewCorrectAnswer(0);
    setNewExplanation('');
  };

  // 문제 삭제
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('이 문제를 삭제하시겠습니까?')) return;

    try {
      await apiClient(`/api/v1/subjects/${subjectId}/questions/${questionId}`, {
        method: 'DELETE',
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to delete question:', error);
      const errorMessage = error instanceof Error ? error.message : '문제 삭제에 실패했습니다';
      alert(errorMessage);
    }
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push(
                `/creator/certificates/${certificateId}/subjects/${subjectId}/chapters`
              )}
            >
              ← 목차 관리
            </Button>
            <h1 className="text-xl font-bold">문제 관리</h1>
          </div>
          <Button
            onClick={() => router.push(
              `/creator/certificates/${certificateId}/subjects/${subjectId}/question-mapping`
            )}
          >
            문제-교재 매핑 →
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 통계 */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card 
              className={`cursor-pointer ${filterMapped === null ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setFilterMapped(null)}
            >
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{stats.total_count}</p>
                <p className="text-sm text-gray-500">전체 문제</p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer ${filterMapped === true ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setFilterMapped(true)}
            >
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{stats.mapped_count}</p>
                <p className="text-sm text-gray-500">매핑 완료</p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer ${filterMapped === false ? 'ring-2 ring-orange-500' : ''}`}
              onClick={() => setFilterMapped(false)}
            >
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-orange-600">{stats.unmapped_count}</p>
                <p className="text-sm text-gray-500">미매핑</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 상단 액션 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => { alert('양식 다운로드 기능은 준비 중입니다.'); }}
            >
              <Download className="h-4 w-4 mr-2" /> 양식 다운로드
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => { alert('문제 업로드 기능은 준비 중입니다.'); }}
            >
              <Upload className="h-4 w-4 mr-2" /> 문제 업로드
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              disabled 
              className="opacity-50 cursor-not-allowed"
            >
              🤖 AI문제 추출 (개발중)
            </Button>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>+ 새 문제</Button>
        </div>

        {/* 문제 목록 */}
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              {filterMapped !== null 
                ? '해당하는 문제가 없습니다' 
                : '등록된 문제가 없습니다. 새 문제를 추가해보세요!'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      {/* 문제 번호 및 내용 */}
                      <div className="flex items-start gap-3">
                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm font-medium flex-shrink-0">
                          Q{index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium mb-3">{question.content}</p>
                          
                          {/* 보기 */}
                          <div className="space-y-1 mb-3">
                            {question.options.map((option, optIdx) => (
                              <div 
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  optIdx === question.correct_answer 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-gray-50'
                                }`}
                              >
                                <span className="font-medium">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span>{option}</span>
                                {optIdx === question.correct_answer && (
                                  <span className="ml-auto text-xs bg-green-200 px-2 py-0.5 rounded">
                                    정답
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* 해설 */}
                          {question.explanation && (
                            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                              <span className="font-medium">해설:</span> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 매핑 상태 및 액션 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {question.textbook_page ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          📖 p.{question.textbook_page}
                        </span>
                      ) : (
                        <>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                            미매핑
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="h-6 text-xs px-2 py-0"
                          >
                            삭제
                          </Button>
                        </>
                      )}
                      {question.textbook_page && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="h-6 text-xs px-2 py-0"
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 문제 추가 Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 문제 추가</DialogTitle>
            <DialogDescription>문제 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 문제 내용 */}
            <div className="space-y-2">
              <Label>문제 내용 *</Label>
              <Textarea
                placeholder="문제 내용을 입력하세요"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
              />
            </div>

            {/* 보기 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>보기 (최소 2개, 최대 5개) *</Label>
                {newOptions.length < 5 && (
                  <Button size="sm" variant="outline" onClick={addOption}>
                    + 보기 추가
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {newOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={newCorrectAnswer === index}
                      onChange={() => setNewCorrectAnswer(index)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium w-6">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <Input
                      placeholder={`보기 ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1"
                    />
                    {newOptions.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                라디오 버튼을 클릭하여 정답을 선택하세요
              </p>
            </div>

            {/* 해설 */}
            <div className="space-y-2">
              <Label>해설 (선택)</Label>
              <Textarea
                placeholder="정답에 대한 해설을 입력하세요"
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsAddDialogOpen(false);
            }}>
              취소
            </Button>
            <Button
              onClick={handleAddQuestion}
              disabled={isSubmitting || !newContent.trim()}
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

