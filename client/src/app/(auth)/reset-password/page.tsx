'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/(auth)/authProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { confirmPasswordReset } = useAuth();

  // Get token from URL
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset?.(token, password);
      setSuccess(true);
      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push('/signin?reset=success');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
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
              className="object-contain h-[60px] w-auto"
              style={{ height: 'auto' }}
            />
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="text-secondary-500">BOLIBRO </span>
              <span className="text-sky-900">REALTY</span>
            </h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">Create a new password</p>
        </div>

        {!token && (
          <div className="bg-amber-50 p-4 rounded-md text-amber-700">
            <p>
              Invalid or missing reset token. Please try again or request a new
              password reset link.
            </p>
            <div className="mt-4 text-center">
              <Link
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                Request new reset link
              </Link>
            </div>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-md text-green-700">
              <p>Your password has been successfully reset!</p>
              <p className="mt-2 text-sm">
                You will be redirected to the sign in page shortly...
              </p>
            </div>
            <div className="text-center">
              <Link href="/signin" className="text-primary hover:underline">
                Go to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your new password"
                  disabled={!token || isLoading}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Confirm your new password"
                  disabled={!token || isLoading}
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-slate-700 hover:bg-slate-800 text-white"
              disabled={!token || isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>

            <div className="text-center mt-4">
              <p className="text-muted-foreground">
                <Link href="/signin" className="text-primary hover:underline">
                  Return to sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
