'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Trophy, Clock, Target, Flame } from 'lucide-react';
import Link from 'next/link';

const currentCourse = {
  name: '컴활 2급 필기',
  subject: '스프레드시트 일반',
  chapter: 'Chapter 3: 수식과 함수',
  progress: 65,
};

const stats = [
  { label: '학습 일수', value: '24일', icon: Flame, color: 'text-orange-500' },
  { label: '완료한 강의', value: '32개', icon: BookOpen, color: 'text-indigo-500' },
  { label: '풀은 문제', value: '248개', icon: Target, color: 'text-purple-500' },
  { label: '총 학습 시간', value: '18시간', icon: Clock, color: 'text-pink-500' },
];

const recentCourses = [
  { name: '컴활 2급 필기', progress: 65, lastStudied: '오늘' },
  { name: '정보처리기사 필기', progress: 30, lastStudied: '어제' },
  { name: 'SQLD', progress: 10, lastStudied: '3일 전' },
];

export function LearnerDashboard() {
  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">안녕하세요! 👋</h1>
        <p className="text-slate-500 mt-1">오늘도 열심히 학습해볼까요?</p>
      </div>

      {/* 현재 학습 중 */}
      <Card className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm mb-1">이어서 학습하기</p>
              <h2 className="text-2xl font-bold mb-2">{currentCourse.name}</h2>
              <p className="text-indigo-100">{currentCourse.subject} &gt; {currentCourse.chapter}</p>
              <div className="mt-4 flex items-center gap-3">
                <Progress value={currentCourse.progress} className="w-48 bg-white/20" />
                <span className="text-sm">{currentCourse.progress}%</span>
              </div>
            </div>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50" asChild>
              <Link href="/study">
                <Play className="mr-2 h-5 w-5" />
                계속하기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <Icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 하단 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 학습 중인 과정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              학습 중인 과정
            </CardTitle>
            <CardDescription>진행 중인 자격증 학습</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCourses.map((course, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{course.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={course.progress} className="w-24 h-2" />
                    <span className="text-xs text-slate-500">{course.progress}%</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{course.lastStudied}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 목표 및 성취 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              오늘의 목표
            </CardTitle>
            <CardDescription>일일 학습 목표를 달성하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">강의 시청</span>
                  <span className="text-sm text-slate-500">2/3</span>
                </div>
                <Progress value={66} />
              </div>
              <div className="p-4 rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">문제 풀기</span>
                  <span className="text-sm text-slate-500">15/20</span>
                </div>
                <Progress value={75} />
              </div>
              <div className="p-4 rounded-lg bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">학습 시간</span>
                  <span className="text-sm text-slate-500">45분/60분</span>
                </div>
                <Progress value={75} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

