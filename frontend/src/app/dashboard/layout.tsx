'use client';

import { useAuth } from '@/hooks/useAuth';
import { CreatorLayout } from '@/components/layouts/CreatorLayout';
import { LearnerLayout } from '@/components/layouts/LearnerLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  // 역할에 따라 다른 레이아웃 적용
  if (user?.role === 'creator') {
    return <CreatorLayout>{children}</CreatorLayout>;
  }

  return <LearnerLayout>{children}</LearnerLayout>;
}

