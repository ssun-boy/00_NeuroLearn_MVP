import Link from 'next/link';
import { Brain } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 로고 */}
      <header className="p-6">
        <Link href="/" className="flex items-center space-x-2 w-fit">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            NeuroLearn
          </span>
        </Link>
      </header>

      {/* 메인 콘텐츠 - 중앙 정렬 */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="p-6 text-center text-sm text-slate-500">
        © 2024 NeuroLearn. All rights reserved.
      </footer>
    </div>
  );
}

