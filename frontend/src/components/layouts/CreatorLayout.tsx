'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Award, 
  BookOpen, 
  Video, 
  FileQuestion,
  Settings 
} from 'lucide-react';

const sidebarItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/creator/certificates', label: '자격증 관리', icon: Award },
  { href: '/creator/textbooks', label: '교재 관리', icon: BookOpen },
  { href: '/creator/videos', label: '영상 관리', icon: Video },
  { href: '/creator/questions', label: '문제 관리', icon: FileQuestion },
  { href: '/settings', label: '설정', icon: Settings },
];

export function CreatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-xl font-bold">NeuroLearn</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
