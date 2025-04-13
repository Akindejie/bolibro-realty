'use client';

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAppSelector } from '@/state/redux';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect } from 'react';

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (
    email: string,
    password: string,
    role: 'tenant' | 'manager',
    name: string
  ) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const Auth = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { signIn, signUp, signOut, isInitialized } = useSupabaseAuth();
  const { user, isAuthenticated, loading } = useAppSelector(
    (state) => state.user
  );

  const isAuthPage = pathname.match(/^\/(signin|signup)$/);
  const isDashboardPage =
    pathname.startsWith('/manager') || pathname.startsWith('/tenants');

  // Handle routing based on authentication state
  useEffect(() => {
    if (!isInitialized || loading) return;

    // If not authenticated and trying to access protected routes
    if (!isAuthenticated && isDashboardPage) {
      router.push('/signin');
    }

    // If authenticated and on auth pages, redirect
    if (isAuthenticated && isAuthPage) {
      if (user?.role === 'manager') {
        router.push('/managers/properties');
      } else {
        router.push('/');
      }
    }
  }, [
    isAuthenticated,
    isAuthPage,
    isDashboardPage,
    loading,
    router,
    user?.role,
    isInitialized,
  ]);

  // Show loading state until authentication is initialized
  if (loading || !isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export default Auth;
