'use client';

import { useAuth } from '@/hooks/useAuth';
import { CreatorDashboard } from '@/components/dashboard/CreatorDashboard';
import { LearnerDashboard } from '@/components/dashboard/LearnerDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // 역할에 따라 다른 대시보드 표시
  if (user?.role === 'creator') {
    return <CreatorDashboard />;
  }

  return <LearnerDashboard />;
}

