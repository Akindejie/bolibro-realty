'use client';

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAppSelector, useAppDispatch } from '@/state/redux';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { clearUser, setLoading } from '@/state/userSlice';

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (
    email: string,
    password: string,
    role: 'tenant' | 'manager',
    name: string
  ) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  confirmPasswordReset?: (token: string, password: string) => Promise<any>;
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
  const dispatch = useAppDispatch();
  const {
    signIn,
    signUp,
    signOut,
    isInitialized,
    validateSession,
    resetPassword,
    confirmPasswordReset,
  } = useSupabaseAuth();
  const { user, isAuthenticated, loading } = useAppSelector(
    (state) => state.user
  );

  // Simple flag to track if validation has been done
  const [validationComplete, setValidationComplete] = useState(false);
  const hasAttemptedValidation = useRef(false);

  const isAuthPage = pathname.match(/^\/(signin|signup)$/);
  const isDashboardPage =
    pathname.startsWith('/manager') || pathname.startsWith('/tenants');

  // Validate session once on initial load if authenticated from persistence
  useEffect(() => {
    const validateOnce = async () => {
      // Only validate if authenticated and not already validated
      if (isAuthenticated && !hasAttemptedValidation.current && isInitialized) {
        hasAttemptedValidation.current = true;

        try {
          dispatch(setLoading(true));
          const isValid = await validateSession();

          if (!isValid) {
            dispatch(clearUser());
            if (!isAuthPage) {
              router.push('/signin');
            }
          }
        } catch (error) {
          console.error('Validation error:', error);
          dispatch(clearUser());
        } finally {
          dispatch(setLoading(false));
          setValidationComplete(true);
        }
      } else if (!isAuthenticated) {
        // If not authenticated, mark validation as complete
        setValidationComplete(true);
      }
    };

    validateOnce();
  }, [
    isAuthenticated,
    isInitialized,
    validateSession,
    dispatch,
    router,
    isAuthPage,
  ]);

  // Handle routing based on authentication state
  useEffect(() => {
    if (!validationComplete || loading) return;

    // If not authenticated and trying to access protected routes
    if (!isAuthenticated && isDashboardPage) {
      router.push('/signin');
      return;
    }

    // If authenticated and on auth pages, redirect to dashboard
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
    validationComplete,
  ]);

  // Show loading state when necessary
  if (loading || !validationComplete) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ signIn, signUp, signOut, resetPassword, confirmPasswordReset }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default Auth;
