'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const passwordJustUpdatedRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Check URL parameters for password recovery token
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery mode - allow them to set new password
        setIsRecoveryMode(true);
        setError(null);
        setMessage(null);
      } else if (event === 'SIGNED_IN') {
        // Only redirect if password was just updated (not on initial load)
        if (passwordJustUpdatedRef.current) {
          setMessage('Password updated successfully! Redirecting...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          // User was auto-signed in from recovery link - don't redirect yet
          // They still need to set a new password
          setIsRecoveryMode(true);
          setError(null);
        }
      }
    });

    // If we have token parameters, verify them to enter recovery mode
    if (tokenHash && type === 'recovery') {
      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      }).then(({ error }) => {
        if (error) {
          setError('Invalid or expired password reset link. Please request a new one.');
        } else {
          setIsRecoveryMode(true);
          setError(null);
        }
      });
    } else {
      // Check if user has a session - might be in recovery mode already
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // User has a session - check if they're in recovery mode
          // We'll assume they are if they're on this page
          setIsRecoveryMode(true);
        } else if (!tokenHash) {
          // No session and no token - user needs to click the email link
          setError('Please click the password reset link from your email to continue.');
        }
      });
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Check if user is in recovery mode
    if (!isRecoveryMode) {
      setError('Please click the password reset link from your email to continue.');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Set flag before updating password
      passwordJustUpdatedRef.current = true;
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        passwordJustUpdatedRef.current = false;
        setError(error.message);
        setIsLoading(false);
      } else {
        // Password updated successfully - the SIGNED_IN event will handle redirect
        setMessage('Password updated successfully! Redirecting...');
        // Don't set loading to false here - let the redirect happen
      }
    } catch (error) {
      passwordJustUpdatedRef.current = false;
      console.error('Update password error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Reset Password</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isRecoveryMode && !error && (
            <p className="text-gray-600 mb-4">
              Please click the password reset link from your email to continue.
            </p>
          )}
          {isRecoveryMode && (
            <p className="text-gray-600 mb-4">
              Enter your new password below.
            </p>
          )}

          {/* New Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              minLength={6}
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              minLength={6}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isRecoveryMode}
            className="w-full px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>

          {/* Back to Login Link */}
          <div className="text-center pt-4 border-t border-gray-300">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

