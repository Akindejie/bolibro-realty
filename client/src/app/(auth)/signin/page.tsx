'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/(auth)/authProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check URL parameters
    const verifyEmail = searchParams.get('verifyEmail');
    const registered = searchParams.get('registered');

    if (verifyEmail === 'true') {
      setMessage(
        'Please check your email to verify your account before signing in.'
      );
    } else if (registered === 'true') {
      setMessage(
        'Registration successful! You can now sign in with your credentials.'
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      // Redirect will be handled by the auth provider
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image
              src="/bolibro-logo-black.png"
              alt="Bolibro Logo"
              width={60}
              height={60}
              style={{ height: 'auto' }}
              className="object-contain h-[60px] w-auto"
            />
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="text-secondary-500">BOLIBRO </span>
              <span className="text-sky-900">REALTY</span>
            </h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Welcome! Please sign in to continue
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-slate-700 hover:bg-slate-800 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center mt-4">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
