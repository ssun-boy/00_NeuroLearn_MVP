'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import {
  Certificate,
  Subject,
  ProficiencyWeight,
  SubjectCreateRequest
} from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, Settings, Trash2, BookOpen, Loader2, GripVertical } from 'lucide-react';

const PROFICIENCY_LABELS: Record<number, string> = {
  1: '초보자',
  2: '기초',
  3: '중급',
  4: '숙련',
  5: '전문가'
};

export default function CertificateDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id as string;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog 상태
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 숙련도 가중치 Dialog
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [weights, setWeights] = useState<ProficiencyWeight[]>([]);
  const [originalWeights, setOriginalWeights] = useState<ProficiencyWeight[]>([]);
  const [isWeightsDialogOpen, setIsWeightsDialogOpen] = useState(false);
  const [isWeightsLoading, setIsWeightsLoading] = useState(false);
  const [isSavingWeights, setIsSavingWeights] = useState(false);

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      const data = await apiClient<{ subjects: Subject[] } & Certificate>(
        `/api/v1/certificates/${certificateId}/with-subjects`
      );
      setCertificate(data);
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('Failed to fetch certificate:', err);
      setError('자격증 정보를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, certificateId]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user?.role !== 'creator') {
      router.push('/learner/dashboard');
    }
  }, [authLoading, user, router]);

  // 과목 생성
  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;

    setIsSubmitting(true);
    try {
      const newSubject = await apiClient<Subject>(
        `/api/v1/certificates/${certificateId}/subjects`,
        {
          method: 'POST',
          body: {
            name: newSubjectName,
            description: newSubjectDesc || null,
            order_index: subjects.length
          } as SubjectCreateRequest
        }
      );

      setSubjects([...subjects, newSubject]);
      setNewSubjectName('');
      setNewSubjectDesc('');
      setIsAddSubjectOpen(false);
    } catch (err) {
      console.error('Failed to add subject:', err);
      alert('과목 추가에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 과목 삭제
  const handleDeleteSubject = async (subject: Subject) => {
    if (!confirm(`"${subject.name}" 과목을 삭제하시겠습니까?\n관련된 모든 콘텐츠가 함께 삭제됩니다.`)) return;

    try {
      await apiClient(
        `/api/v1/certificates/${certificateId}/subjects/${subject.id}`,
        { method: 'DELETE' }
      );
      setSubjects(subjects.filter(s => s.id !== subject.id));
    } catch (err) {
      console.error('Failed to delete subject:', err);
      alert('과목 삭제에 실패했습니다');
    }
  };

  // 숙련도 가중치 불러오기
  const handleOpenWeights = async (subject: Subject) => {
    setSelectedSubject(subject);
    setIsWeightsLoading(true);
    setIsWeightsDialogOpen(true);
    
    try {
      const weightsData = await apiClient<ProficiencyWeight[]>(
        `/api/v1/certificates/${certificateId}/subjects/${subject.id}/weights`
      );
      setWeights(weightsData);
      setOriginalWeights(weightsData.map(w => ({ ...w })));  // 깊은 복사로 원본 저장
    } catch (err) {
      console.error('Failed to fetch weights:', err);
      alert('가중치 정보를 불러오는데 실패했습니다');
    } finally {
      setIsWeightsLoading(false);
    }
  };

  // 숙련도 가중치 로컬 수정 (UI만 업데이트)
  const handleWeightChange = (level: number, newWeight: number) => {
    if (isNaN(newWeight)) return;
    setWeights(weights.map(w =>
      w.proficiency_level === level ? { ...w, time_weight: newWeight } : w
    ));
  };

  // 변경 여부 확인
  const hasWeightsChanged = () => {
    return weights.some(w => {
      const original = originalWeights.find(o => o.proficiency_level === w.proficiency_level);
      return original && original.time_weight !== w.time_weight;
    });
  };

  // 숙련도 가중치 저장
  const handleSaveWeights = async () => {
    if (!selectedSubject) return;

    setIsSavingWeights(true);
    try {
      // 변경된 가중치만 API로 업데이트
      const changedWeights = weights.filter(w => {
        const original = originalWeights.find(o => o.proficiency_level === w.proficiency_level);
        return original && original.time_weight !== w.time_weight && w.time_weight > 0;
      });

      for (const w of changedWeights) {
        await apiClient(
          `/api/v1/certificates/${certificateId}/subjects/${selectedSubject.id}/weights`,
          {
            method: 'PUT',
            body: { proficiency_level: w.proficiency_level, time_weight: w.time_weight }
          }
        );
      }

      // 저장 성공 후 원본 업데이트
      setOriginalWeights(weights.map(w => ({ ...w })));
      alert('가중치가 저장되었습니다.');
    } catch (err) {
      console.error('Failed to save weights:', err);
      alert('가중치 저장에 실패했습니다');
    } finally {
      setIsSavingWeights(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/creator/certificates')}>
              자격증 목록으로
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!certificate) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/creator/certificates')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              자격증 목록
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-xl font-bold text-slate-900">{certificate.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 자격증 정보 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">자격증 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              {certificate.description || '설명이 없습니다'}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              생성일: {new Date(certificate.created_at).toLocaleDateString('ko-KR')}
            </p>
          </CardContent>
        </Card>

        {/* 과목 관리 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">과목 목록</h2>
            <p className="text-sm text-slate-500">{subjects.length}개의 과목</p>
          </div>

          <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                새 과목
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 과목 추가</DialogTitle>
                <DialogDescription>
                  과목 정보를 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectName">과목 이름 *</Label>
                  <Input
                    id="subjectName"
                    placeholder="예: 컴퓨터 일반"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubjectName.trim()) {
                        handleAddSubject();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectDesc">설명 (선택)</Label>
                  <Input
                    id="subjectDesc"
                    placeholder="과목에 대한 간단한 설명"
                    value={newSubjectDesc}
                    onChange={(e) => setNewSubjectDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddSubjectOpen(false)}>
                  취소
                </Button>
                <Button
                  onClick={handleAddSubject}
                  disabled={isSubmitting || !newSubjectName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isSubmitting ? '추가 중...' : '추가'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 과목 목록 테이블 */}
        {subjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                아직 등록된 과목이 없습니다
              </h3>
              <p className="text-slate-500 mb-6">
                새 과목을 추가하여 학습 콘텐츠를 구성해보세요.
              </p>
              <Button
                onClick={() => setIsAddSubjectOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                첫 과목 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">순서</TableHead>
                  <TableHead>과목명</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead className="w-64 text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject, index) => (
                  <TableRow key={subject.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                        <span className="text-slate-500">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell className="text-slate-500">
                      {subject.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenWeights(subject)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          가중치
                        </Button>
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => router.push(
                            `/creator/certificates/${certificateId}/subjects/${subject.id}/chapters`
                          )}
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          목차
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteSubject(subject)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* 숙련도 가중치 Dialog */}
        <Dialog open={isWeightsDialogOpen} onOpenChange={setIsWeightsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>숙련도별 학습시간 가중치</DialogTitle>
              <DialogDescription>
                {selectedSubject?.name} - 학습자의 숙련도에 따라 기본 학습시간에 곱해지는 가중치입니다.
              </DialogDescription>
            </DialogHeader>
            
            {isWeightsLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>숙련도</TableHead>
                    <TableHead className="w-24">가중치</TableHead>
                    <TableHead>적용 예시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weights.sort((a, b) => a.proficiency_level - b.proficiency_level).map((w) => (
                    <TableRow key={w.proficiency_level}>
                      <TableCell>
                        <span className="font-medium">{w.proficiency_level}점</span>
                        <span className="text-slate-500 text-sm ml-2">
                          ({PROFICIENCY_LABELS[w.proficiency_level]})
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="3"
                          className="w-20"
                          value={w.time_weight}
                          onChange={(e) =>
                            handleWeightChange(w.proficiency_level, parseFloat(e.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        10분 → {Math.round(10 * w.time_weight)}분
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsWeightsDialogOpen(false)}>
                닫기
              </Button>
              <Button
                onClick={handleSaveWeights}
                disabled={!hasWeightsChanged() || isSavingWeights}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSavingWeights && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSavingWeights ? '저장 중...' : '저장'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

