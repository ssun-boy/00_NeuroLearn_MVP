'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreatorDashboard() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && user?.role !== 'creator') {
      router.push('/learner/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">뉴로런 - 제작자</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.name}님</span>
            <Button variant="outline" onClick={logout}>로그아웃</Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">대시보드</h2>
        
        {/* 시작하기 안내 */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-800 mb-2">📚 콘텐츠 제작 순서</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>자격증 생성 → 과목 추가</li>
              <li>목차 구조 생성 + 교재 PDF 업로드</li>
              <li>목차-교재 페이지 매핑</li>
              <li>영상 등록 + 목차-영상 매핑</li>
              <li>문제 등록 + 문제-교재 매핑</li>
              <li>검수 화면에서 누락 항목 확인</li>
            </ol>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📜 자격증 관리
              </CardTitle>
              <CardDescription>자격증과 과목을 관리합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => router.push('/creator/certificates')}
              >
                자격증 관리 →
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔗 콘텐츠 매핑
              </CardTitle>
              <CardDescription>목차-교재-영상을 연결합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-3">
                자격증 선택 후 과목에서 매핑 도구를 사용하세요
              </p>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/creator/certificates')}
              >
                자격증 선택 →
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ✅ 검수
              </CardTitle>
              <CardDescription>매핑 상태를 확인합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-3">
                과목 선택 후 검수 화면에서 확인하세요
              </p>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => router.push('/creator/certificates')}
              >
                자격증 선택 →
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
