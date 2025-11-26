'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, User, BookOpen, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'learner';

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: defaultRole as 'creator' | 'learner',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRoleChange = (role: 'creator' | 'learner') => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: 실제 API 연동
      console.log('회원가입 시도:', {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });

      // 임시: 회원가입 성공 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('회원가입이 완료되었습니다!');
      router.push(`/login?role=${formData.role}`);
    } catch (error) {
      console.error('회원가입 실패:', error);
      toast.error('회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur shadow-xl shadow-slate-200/50 border-0">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
        <CardDescription>뉴로런과 함께 학습을 시작하세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* 역할 선택 */}
          <div className="space-y-2">
            <Label>역할 선택</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('creator')}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                  formData.role === 'creator'
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
                onClick={() => handleRoleChange('learner')}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                  formData.role === 'learner'
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
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="홍길동"
                value={formData.name}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="8자 이상 입력해주세요"
                value={formData.password}
                onChange={handleChange}
                className="pl-10"
                required
                minLength={8}
              />
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            회원가입
          </Button>
          <p className="text-sm text-center text-slate-600">
            이미 계정이 있으신가요?{' '}
            <Link
              href={`/login?role=${formData.role}`}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              로그인하기
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

