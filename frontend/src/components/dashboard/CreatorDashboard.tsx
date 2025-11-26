'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, Video, FileQuestion, Plus, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: '등록된 자격증', value: '3', icon: Award, color: 'bg-indigo-500' },
  { label: '업로드된 교재', value: '12', icon: BookOpen, color: 'bg-purple-500' },
  { label: '등록된 영상', value: '48', icon: Video, color: 'bg-pink-500' },
  { label: '등록된 문제', value: '520', icon: FileQuestion, color: 'bg-orange-500' },
];

const recentActivities = [
  { action: '새 문제 등록', target: '컴활 2급 필기 - 스프레드시트', time: '10분 전' },
  { action: '영상 업로드', target: 'Chapter 3: 데이터베이스 기초', time: '1시간 전' },
  { action: '교재 업데이트', target: '컴퓨터 일반 핵심정리', time: '3시간 전' },
  { action: '자격증 생성', target: '정보처리기사 실기', time: '1일 전' },
];

export function CreatorDashboard() {
  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">대시보드</h1>
          <p className="text-slate-500 mt-1">콘텐츠 현황을 확인하세요</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
          <Link href="/certificates/new">
            <Plus className="mr-2 h-4 w-4" />
            새 자격증 등록
          </Link>
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 하단 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              최근 활동
            </CardTitle>
            <CardDescription>최근 작업 내역입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between py-3 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-500">{activity.target}</p>
                  </div>
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 학습자 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              학습자 현황
            </CardTitle>
            <CardDescription>내 콘텐츠를 학습 중인 사용자</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-5xl font-bold text-indigo-600 mb-2">127</div>
              <p className="text-slate-500">명의 학습자</p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-semibold">89</div>
                  <div className="text-xs text-slate-500">오늘 학습</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold">4.8</div>
                  <div className="text-xs text-slate-500">평균 평점</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold">92%</div>
                  <div className="text-xs text-slate-500">완료율</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

