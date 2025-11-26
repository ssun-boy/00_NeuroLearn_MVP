'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BookOpen, Video, FileQuestion, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function CreatorDashboard() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <h1 className="text-xl font-bold">뉴로런</h1>
            <span className="text-sm text-slate-500 ml-2">제작자</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">{user.name}님</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">대시보드</h2>
          <p className="text-slate-500 mt-1">학습 콘텐츠를 관리하세요</p>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 자격증 관리 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Award className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">자격증 관리</CardTitle>
                  <CardDescription>자격증과 과목을 관리합니다</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" asChild>
                <Link href="/creator/certificates">자격증 관리 →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 교재 관리 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">교재 관리</CardTitle>
                  <CardDescription>PDF 교재를 업로드합니다</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/creator/textbooks">교재 관리 →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 영상 관리 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Video className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">영상 관리</CardTitle>
                  <CardDescription>강의 영상을 등록합니다</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/creator/videos">영상 관리 →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 문제 관리 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileQuestion className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">문제 관리</CardTitle>
                  <CardDescription>문제를 등록하고 관리합니다</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/creator/questions">문제 관리 →</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 콘텐츠 매핑 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">콘텐츠 매핑</CardTitle>
                  <CardDescription>목차-교재-영상을 연결합니다</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/creator/mapping">매핑 도구 →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

