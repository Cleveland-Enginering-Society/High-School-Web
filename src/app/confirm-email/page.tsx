'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Redirect if already authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router, supabase.auth]);

  const handleResendEmail = async () => {
    if (!email) {
      setResendError('Email address not found. Please try signing up again.');
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setResendError(error.message);
      } else {
        setResendMessage('Confirmation email sent! Please check your inbox.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setResendError('Failed to send confirmation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email
          </h1>
          <p className="text-gray-600">
            We've sent a confirmation email to your inbox. Please click the link in the email to verify your account.
          </p>
        </div>

        <div className="space-y-4">
          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Email sent to:</span> {email}
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-4">
              <p>{"Didn't receive the email? Click the button below to resend the confirmation email."}</p>
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={isResending || !email}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? 'Sending...' : 'Resend Confirmation Email'}
              </button>

              {resendMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{resendMessage}</p>
                </div>
              )}

              {resendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{resendError}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

