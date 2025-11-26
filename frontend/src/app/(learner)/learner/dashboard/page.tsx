'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Trophy, Clock, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function LearnerDashboard() {
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
            <span className="text-sm text-slate-500 ml-2">학습자</span>
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
          <h2 className="text-2xl font-bold text-slate-900">안녕하세요, {user.name}님! 👋</h2>
          <p className="text-slate-500 mt-1">오늘도 열심히 학습해볼까요?</p>
        </div>

        {/* 현재 학습 중 카드 */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm mb-1">이어서 학습하기</p>
                <h3 className="text-2xl font-bold mb-2">컴활 2급 필기</h3>
                <p className="text-indigo-100">스프레드시트 일반 &gt; Chapter 3: 수식과 함수</p>
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={65} className="w-48 bg-white/20" />
                  <span className="text-sm">65%</span>
                </div>
              </div>
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50" asChild>
                <Link href="/learner/study">
                  <Play className="mr-2 h-5 w-5" />
                  계속하기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Trophy className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">24일</div>
                <div className="text-sm text-slate-500">연속 학습</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">32개</div>
                <div className="text-sm text-slate-500">완료한 강의</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Play className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">248개</div>
                <div className="text-sm text-slate-500">푼 문제</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Clock className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">18시간</div>
                <div className="text-sm text-slate-500">총 학습 시간</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">학습하기</CardTitle>
              <CardDescription>교재와 영상으로 학습합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" asChild>
                <Link href="/learner/study">학습 시작 →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">문제 풀기</CardTitle>
              <CardDescription>문제를 풀고 실력을 확인합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/learner/quiz">문제 풀기 →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">학습 현황</CardTitle>
              <CardDescription>진도와 성취도를 확인합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/learner/progress">현황 보기 →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

