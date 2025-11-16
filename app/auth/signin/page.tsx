'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/" className="font-medium text-primary-600 hover:text-primary-500">
              return to home
            </Link>
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              Continue with Google
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => signIn('email', { callbackUrl: '/dashboard' })}
            >
              Continue with Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

