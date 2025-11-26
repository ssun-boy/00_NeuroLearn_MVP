'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Certificate, CertificateCreateRequest } from '@/types';
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
import { Plus, ArrowLeft, Award, Trash2, Settings, Loader2 } from 'lucide-react';

export default function CertificatesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCertName, setNewCertName] = useState('');
  const [newCertDesc, setNewCertDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 자격증 목록 불러오기
  const fetchCertificates = async () => {
    try {
      const data = await apiClient<Certificate[]>('/api/v1/certificates');
      setCertificates(data);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      setError('자격증 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchCertificates();
    }
  }, [authLoading, user]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user?.role !== 'creator') {
      router.push('/learner/dashboard');
    }
  }, [authLoading, user, router]);

  // 새 자격증 생성
  const handleCreate = async () => {
    if (!newCertName.trim()) return;

    setIsSubmitting(true);
    setError('');
    
    try {
      const newCert = await apiClient<Certificate>('/api/v1/certificates', {
        method: 'POST',
        body: {
          name: newCertName,
          description: newCertDesc || null
        } as CertificateCreateRequest
      });

      setCertificates([...certificates, newCert]);
      setNewCertName('');
      setNewCertDesc('');
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to create certificate:', err);
      setError(err instanceof Error ? err.message : '자격증 생성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 자격증 삭제
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 자격증을 삭제하시겠습니까?\n관련된 모든 과목과 콘텐츠가 함께 삭제됩니다.`)) return;

    try {
      await apiClient(`/api/v1/certificates/${id}`, { method: 'DELETE' });
      setCertificates(certificates.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete certificate:', err);
      alert('자격증 삭제에 실패했습니다');
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/creator/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              대시보드
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-xl font-bold text-slate-900">자격증 관리</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 상단 액션 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">내 자격증</h2>
            <p className="text-sm text-slate-500">{certificates.length}개의 자격증</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                새 자격증
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 자격증 추가</DialogTitle>
                <DialogDescription>
                  새로운 자격증 정보를 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">자격증 이름 *</Label>
                  <Input
                    id="name"
                    placeholder="예: 컴퓨터활용능력 2급 필기"
                    value={newCertName}
                    onChange={(e) => setNewCertName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCertName.trim()) {
                        handleCreate();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">설명 (선택)</Label>
                  <Input
                    id="desc"
                    placeholder="자격증에 대한 간단한 설명"
                    value={newCertDesc}
                    onChange={(e) => setNewCertDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={isSubmitting || !newCertName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isSubmitting ? '생성 중...' : '생성'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 자격증 목록 */}
        {certificates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Award className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                아직 등록된 자격증이 없습니다
              </h3>
              <p className="text-slate-500 mb-6">
                새 자격증을 추가하여 학습 콘텐츠를 구성해보세요.
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                첫 자격증 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Card
                key={cert.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-indigo-200"
                onClick={() => router.push(`/creator/certificates/${cert.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                        <Award className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cert.name}</CardTitle>
                        {cert.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {cert.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/creator/certificates/${cert.id}`);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      과목 관리
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cert.id, cert.name);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

