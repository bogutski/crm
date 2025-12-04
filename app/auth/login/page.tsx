'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to /login with all query parameters
    const params = searchParams.toString();
    const url = params ? `/login?${params}` : '/login';
    router.replace(url);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
      <div className="text-zinc-600 dark:text-zinc-400">Перенаправление...</div>
    </div>
  );
}
