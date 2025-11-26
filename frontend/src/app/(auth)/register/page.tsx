'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

type UserRole = 'creator' | 'learner';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('learner');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    // 비밀번호 최소 길이 확인
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    // 이름 최소 길이 확인
    if (name.length < 2) {
      setError('이름은 2자 이상이어야 합니다');
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password, name, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-white/80 backdrop-blur shadow-xl shadow-slate-200/50 border-0">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
        <CardDescription>뉴로런과 함께 학습을 시작하세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* 역할 선택 */}
          <div className="space-y-2">
            <Label>역할 선택</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('creator')}
                disabled={isLoading}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                  role === 'creator'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <BookOpen className="h-6 w-6 mb-2" />
                <span className="font-medium">제작자</span>
                <span className="text-xs text-slate-500">콘텐츠를 만들어요</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('learner')}
                disabled={isLoading}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                  role === 'learner'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <GraduationCap className="h-6 w-6 mb-2" />
                <span className="font-medium">학습자</span>
                <span className="text-xs text-slate-500">학습을 시작해요</span>
              </button>
            </div>
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              minLength={2}
              maxLength={50}
            />
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="6자 이상 입력해주세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력해주세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={isLoading || (confirmPassword !== '' && password !== confirmPassword)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? '회원가입 중...' : '회원가입'}
          </Button>
          <p className="text-sm text-slate-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              로그인
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
