'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Landing from './(nondashboard)/landing/page';
import { useGetAuthUserQuery } from '@/state/api';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export default function Home() {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const userRole = authUser?.userRole?.toLowerCase();

      if (userRole === 'manager') {
        router.push('/managers/properties');
      } else {
        setShouldRender(true);
      }
    }
  }, [authUser, isLoading, router]);

  if (isLoading || !shouldRender) {
    return <Loading />;
  }

  return (
    <div className="h-full w-full">
      <Navbar />
      <main className={`h-full flex w-full flex-col`}>
        <Landing />
      </main>
    </div>
  );
}
