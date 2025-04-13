'use client';

import { useState } from 'react';
import { useAuth } from '@/app/(auth)/authProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            <span className="text-primary-700">BOLIBRO</span>
            <span className="text-secondary-500">REALTY</span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Forgot your password? No problem!
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-md text-green-700">
              <p>
                Password reset instructions have been sent to your email
                address.
              </p>
              <p className="mt-2 text-sm">
                Please check your inbox and follow the link to reset your
                password.
              </p>
            </div>
            <div className="text-center">
              <Link href="/signin" className="text-primary hover:underline">
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-slate-700 hover:bg-slate-800 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>

            <div className="text-center mt-4">
              <p className="text-muted-foreground">
                Remember your password?{' '}
                <Link href="/signin" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
