'use client';

import Navbar from '@/components/Navbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from '@/components/AppSidebar';
import { NAVBAR_HEIGHT } from '@/lib/constants';
import React from 'react';
import { useGetAuthUserQuery } from '@/state/api';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      const userRole = authUser.userRole?.toLowerCase();

      if (
        (userRole === 'manager' && pathname.startsWith('/tenants')) ||
        (userRole === 'tenant' && pathname.startsWith('/managers'))
      ) {
        // Redirect to correct dashboard section
        router.push(
          userRole === 'manager'
            ? '/managers/properties'
            : '/tenants/favorites',
          { scroll: false }
        );
        // Keep loading state true until redirection completes
      } else if (userRole === 'manager' && pathname === '/managers') {
        // Redirect from /managers to /managers/properties
        router.push('/managers/properties', { scroll: false });
      } else {
        setIsLoading(false);
      }
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authUser, authLoading, router, pathname]);

  if (authLoading || isLoading) return <>Loading...</>;
  if (!authUser?.userRole) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-primary-100">
        <Navbar />
        <div style={{ marginTop: `${NAVBAR_HEIGHT}px` }}>
          <main className="flex">
            <Sidebar
              userType={authUser.userRole.toLowerCase() as 'manager' | 'tenant'}
            />
            <div className="flex-grow transition-all duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
