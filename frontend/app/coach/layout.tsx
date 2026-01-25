'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { CoachNav } from '@/components/layout';

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?role=coach');
      } else if (user?.role !== 'coach') {
        router.push('/team');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="w-12 h-12 border-4 border-ink-200 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'coach') {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <CoachNav />
      {/* Main content with sidebar offset on desktop */}
      <main className="lg:ml-64 pt-16 lg:pt-0 pb-4">
        {children}
      </main>
    </div>
  );
}
