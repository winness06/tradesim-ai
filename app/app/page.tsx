import { Suspense } from 'react';
import HomeClient from '@/components/HomeClient';

export default function AppPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>}>
      <HomeClient />
    </Suspense>
  );
}
