'use client';

import Navbar from '@/components/Navbar';
import { NAVBAR_HEIGHT } from '@/lib/constants';
import { useGetAuthUserQuery } from '@/state/api';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only set loading to false when we have the auth user info
    if (authUser) {
      const userRole = authUser.userRole?.toLowerCase();

      // Only redirect managers if they're not already on a manager route
      if (userRole === 'manager' && !pathname.includes('/managers/')) {
        router.push('/managers/properties', { scroll: false });
      } else {
        // Set loading to false for non-managers or managers already on manager routes
        setIsLoading(false);
      }
    } else if (!authLoading) {
      // No authenticated user and not loading auth
      setIsLoading(false);
    }
  }, [authUser, authLoading, router, pathname]);

  if (authLoading || isLoading) return <>Loading...</>;

  return (
    <div className="h-full w-full">
      <Navbar />
      <main
        className={`h-full flex w-full flex-col`}
        style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
