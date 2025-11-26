import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, BookOpen, Users, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              NeuroLearn
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href="/register">시작하기</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* 히어로 섹션 */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              AI 기반 적응형 학습
            </span>
            <br />
            <span className="text-slate-800">플랫폼</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            뉴로런은 개인의 학습 패턴을 분석하여 최적의 학습 경로를 제공합니다.
            자격증 시험 준비를 더 스마트하게 시작하세요.
          </p>
          
          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button 
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 rounded-xl shadow-lg shadow-indigo-200"
              asChild
            >
              <Link href="/login?role=creator">
                <BookOpen className="mr-2 h-5 w-5" />
                제작자로 시작
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 rounded-xl border-2 border-indigo-200 hover:bg-indigo-50"
              asChild
            >
              <Link href="/login?role=learner">
                <Users className="mr-2 h-5 w-5" />
                학습자로 시작
              </Link>
            </Button>
          </div>
        </div>

        {/* 기능 카드 */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="bg-white/70 backdrop-blur border-0 shadow-xl shadow-slate-200/50">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-xl">AI 기반 분석</CardTitle>
              <CardDescription>
                학습 패턴을 AI가 분석하여 개인화된 학습 경로를 제안합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/70 backdrop-blur border-0 shadow-xl shadow-slate-200/50">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">멀티미디어 학습</CardTitle>
              <CardDescription>
                교재, 영상, 문제가 통합된 학습 환경을 제공합니다.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/70 backdrop-blur border-0 shadow-xl shadow-slate-200/50">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle className="text-xl">실시간 피드백</CardTitle>
              <CardDescription>
                학습 진도와 성취도를 실시간으로 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-slate-200">
        <div className="text-center text-slate-500 text-sm">
          © 2024 NeuroLearn. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
