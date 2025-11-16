import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Mail className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 mb-6">
            We&rsquo;ve sent you a sign-in link. Please check your email and click the link to continue.
          </p>
          <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
