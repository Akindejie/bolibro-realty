import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppDispatch } from '@/state/redux';
import { clearUser, setLoading, setUser } from '@/state/userSlice';
import { useGetUserByRoleQuery } from '@/state/api';

export function useSupabaseAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // We'll use skip here initially until we have determined the user's role
  const { data: userData, error: userError } = useGetUserByRoleQuery(
    currentRole || 'tenant',
    { skip: !currentRole }
  );

  useEffect(() => {
    const initializeAuth = async () => {
      try {
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
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session) {
          // User signed in, fetch their data
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const role = user.user_metadata?.role || 'tenant';
            setCurrentRole(role);
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          dispatch(clearUser());
          setCurrentRole(null);
          router.push('/signin');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [dispatch, router]);

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
  };
}
