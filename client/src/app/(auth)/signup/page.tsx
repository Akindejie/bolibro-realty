'use client';

import { useState } from 'react';
import { useAuth } from '@/app/(auth)/authProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'tenant' | 'manager'>('tenant');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(email, password, role, username);
      // Redirection is handled by the Auth provider
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'tenant', label: 'Tenant' },
    { value: 'manager', label: 'Manager' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link href="/">
              <Image
                src="/bolibro-logo-black.png"
                alt="Bolibro Logo"
                width={60}
                height={60}
                className="object-contain h-[60px] w-auto cursor-pointer"
                style={{ height: 'auto' }}
              />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="text-secondary-500">BOLIBRO </span>
              <span className="text-sky-900">REALTY</span>
            </h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Welcome! Please sign up to continue
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                placeholder="Choose a username"
              />
            </div>

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
                placeholder="Create a password"
              />
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <PasswordInput
                id="confirm_password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <ToggleSwitch
                options={roleOptions}
                value={role}
                onChange={(value) => setRole(value as 'tenant' | 'manager')}
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-slate-700 hover:bg-slate-800 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </Button>

          <div className="text-center mt-4">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
