import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/state/redux';
import { clearUser, setLoading } from '@/state/userSlice';
import { useGetUserByRoleQuery } from '@/state/api';

export function useSupabaseAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const { isAuthenticated, user, loading } = useAppSelector(
    (state) => state.user
  );

  // We'll use skip here initially until we have determined the user's role
  const { data: userData, error: userError } = useGetUserByRoleQuery(
    currentRole || 'tenant',
    { skip: !currentRole || loading }
  );

  // Simplified validate session function to just check if Supabase session exists
  const validateSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Skip if we're loading
    if (loading) return;

    const initializeAuth = async () => {
      // If already initialized, don't do it again
      if (isInitialized) return;

      try {
        // If already authenticated from persisted state, just set initialized and role
        if (isAuthenticated && user?.role) {
          setCurrentRole(user.role);
          setIsInitialized(true);
          return;
        }

        dispatch(setLoading(true));

        // Check for existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // Get user data from Supabase
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            // Get user role from metadata
            const role = user.user_metadata?.role || 'tenant';
            // Set the role to trigger the query
            setCurrentRole(role);
          } else {
            dispatch(clearUser());
          }
        } else {
          dispatch(clearUser());
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch(clearUser());
      } finally {
        // We'll set this to true even though the query might still be loading
        setIsInitialized(true);
        dispatch(setLoading(false));
      }
    };

    // Initialize auth
    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User signed in, fetch their data
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const role = user.user_metadata?.role || 'tenant';
            setCurrentRole(role);
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch(clearUser());
          setCurrentRole(null);
          router.push('/signin');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [dispatch, router, isAuthenticated, user?.role, loading, isInitialized]);

  const signIn = async (email: string, password: string) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user role from metadata
      const role = data.user?.user_metadata?.role || 'tenant';
      setCurrentRole(role);

      // Redirect based on role
      if (role === 'manager') {
        router.push('/managers/properties');
      } else {
        router.push('/');
      }

      return data;
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const signUp = async (
    email: string,
    password: string,
    role: 'tenant' | 'manager',
    name: string
  ) => {
    try {
      dispatch(setLoading(true));
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            name,
          },
        },
      });

      if (error) throw error;

      // Return to sign-in page after registration
      router.push('/signin?registered=true');
      return data;
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const signOut = async () => {
    try {
      dispatch(setLoading(true));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      dispatch(clearUser());
      setCurrentRole(null);
      router.push('/signin');
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      dispatch(setLoading(true));
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    isInitialized,
    validateSession,
  };
}
