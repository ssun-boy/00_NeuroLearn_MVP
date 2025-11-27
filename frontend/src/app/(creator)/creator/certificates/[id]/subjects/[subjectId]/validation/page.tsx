'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { 
  FullValidationResult, 
  ChapterValidationItem, 
  QuestionValidationItem,
  ValidationStatus 
} from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 상태에 따른 스타일
const statusStyles: Record<ValidationStatus, { bg: string; text: string; icon: string }> = {
  ok: { bg: 'bg-green-100', text: 'text-green-700', icon: '✓' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⚠' },
  error: { bg: 'bg-red-100', text: 'text-red-700', icon: '✕' },
};

// 프로그레스 바 컴포넌트
function ProgressBar({ percentage, status }: { percentage: number; status: ValidationStatus }) {
  const colorClass = status === 'ok' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-4">
      <div
        className={`${colorClass} h-4 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

export default function ValidationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id as string;
  const subjectId = params.subjectId as string;

  const [validationResult, setValidationResult] = useState<FullValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chapterFilter, setChapterFilter] = useState<string>('all');
  const [questionFilter, setQuestionFilter] = useState<string>('all');

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      const data = await apiClient<FullValidationResult>(
        `/api/v1/subjects/${subjectId}/validation`
      );
      setValidationResult(data);
    } catch (error) {
      console.error('Failed to fetch validation:', error);
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
  }, [authLoading, user, router]);

  // 필터링된 목차 항목
  const filteredChapters = validationResult?.chapter_validation.items.filter((item) => {
    if (chapterFilter === 'all') return true;
    return item.status === chapterFilter;
  }) || [];

  // 필터링된 문제 항목
  const filteredQuestions = validationResult?.question_validation.items.filter((item) => {
    if (questionFilter === 'all') return true;
    return item.status === questionFilter;
  }) || [];

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  if (!validationResult) {
    return <div className="min-h-screen flex items-center justify-center">데이터를 불러올 수 없습니다</div>;
  }

  const { chapter_validation, question_validation, overall_status, completion_percentage } = validationResult;

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
            <h1 className="text-xl font-bold">검수</h1>
          </div>
          <Button onClick={fetchData} variant="outline">
            🔄 새로고침
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 전체 완성도 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>전체 완성도</span>
              <span className={`text-2xl ${statusStyles[overall_status].text}`}>
                {completion_percentage}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar percentage={completion_percentage} status={overall_status} />
            <p className="text-sm text-gray-500 mt-2">
              {overall_status === 'ok' && '🎉 모든 매핑이 완료되었습니다!'}
              {overall_status === 'warning' && '⚠️ 일부 항목의 매핑이 누락되었습니다.'}
              {overall_status === 'error' && '❌ 많은 항목의 매핑이 필요합니다.'}
            </p>
          </CardContent>
        </Card>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{chapter_validation.summary.total}</p>
              <p className="text-sm text-gray-500">전체 목차</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {chapter_validation.summary.textbook_percentage}%
              </p>
              <p className="text-sm text-gray-500">교재 매핑률</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {chapter_validation.summary.video_percentage}%
              </p>
              <p className="text-sm text-gray-500">영상 매핑률</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">
                {question_validation.summary.textbook_percentage}%
              </p>
              <p className="text-sm text-gray-500">문제 매핑률</p>
            </CardContent>
          </Card>
        </div>

        {/* 탭 */}
        <Tabs defaultValue="chapters">
          <TabsList className="mb-6 bg-gray-100 p-1.5 h-auto gap-1">
            <TabsTrigger value="chapters" className="px-6 py-3 text-base">
              목차 검수 ({chapter_validation.summary.total})
            </TabsTrigger>
            <TabsTrigger value="questions" className="px-6 py-3 text-base">
              문제 검수 ({question_validation.summary.total})
            </TabsTrigger>
          </TabsList>

          {/* 목차 검수 */}
          <TabsContent value="chapters">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">목차-교재-영상 매핑 검수</CardTitle>
                <Select value={chapterFilter} onValueChange={setChapterFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="ok">✓ 완료</SelectItem>
                    <SelectItem value="warning">⚠ 경고</SelectItem>
                    <SelectItem value="error">✕ 오류</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {filteredChapters.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    해당하는 항목이 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredChapters.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${statusStyles[item.status].bg}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${statusStyles[item.status].text}`}>
                            {statusStyles[item.status].icon}
                          </span>
                          <div>
                            <p className="font-medium" style={{ paddingLeft: `${item.depth * 16}px` }}>
                              {item.title}
                            </p>
                            <div className="flex gap-2 text-xs mt-1">
                              <span className={item.has_textbook_mapping ? 'text-green-600' : 'text-gray-400'}>
                                📖 {item.has_textbook_mapping ? `p.${item.textbook_page}` : '미매핑'}
                              </span>
                              <span className={item.has_video_mapping ? 'text-green-600' : 'text-gray-400'}>
                                🎬 {item.has_video_mapping ? `${item.video_start_seconds}초` : '미매핑'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!item.has_textbook_mapping && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(
                                `/creator/certificates/${certificateId}/subjects/${subjectId}/mapping`
                              )}
                            >
                              교재 매핑
                            </Button>
                          )}
                          {!item.has_video_mapping && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(
                                `/creator/certificates/${certificateId}/subjects/${subjectId}/video-mapping`
                              )}
                            >
                              영상 매핑
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 문제 검수 */}
          <TabsContent value="questions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">문제-교재 매핑 검수</CardTitle>
                <Select value={questionFilter} onValueChange={setQuestionFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="ok">✓ 완료</SelectItem>
                    <SelectItem value="warning">⚠ 경고</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {filteredQuestions.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    해당하는 항목이 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredQuestions.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${statusStyles[item.status].bg}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${statusStyles[item.status].text}`}>
                            {statusStyles[item.status].icon}
                          </span>
                          <div>
                            <p className="font-medium">
                              <span className="text-gray-500 mr-2">Q{index + 1}</span>
                              {item.content}
                            </p>
                            <div className="text-xs mt-1">
                              <span className={item.has_textbook_mapping ? 'text-green-600' : 'text-gray-400'}>
                                📖 {item.has_textbook_mapping ? `p.${item.textbook_page}` : '미매핑'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!item.has_textbook_mapping && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(
                              `/creator/certificates/${certificateId}/subjects/${subjectId}/question-mapping`
                            )}
                          >
                            교재 매핑
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

