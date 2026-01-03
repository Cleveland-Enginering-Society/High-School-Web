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
  const recoveryModeEnteredRef = useRef(false); // Track if we've entered recovery mode
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // #region agent log
  // Log on component mount to see initial URL state
  if (typeof window !== 'undefined') {
    const initialLog = {location:'reset-password/page.tsx:18',message:'Component mount - initial URL check',data:{fullUrl:window.location.href,searchParams:window.location.search,hasTokenHash:window.location.search.includes('token_hash')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'};
    console.log('[DEBUG]', initialLog);
    fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(initialLog)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
  }
  // #endregion

  useEffect(() => {
    // #region agent log
    const logData1 = {location:'reset-password/page.tsx:20',message:'useEffect entry',data:{fullUrl:typeof window!=='undefined'?window.location.href:'SSR',searchParamsKeys:Array.from(searchParams.keys())},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A,E'};
    console.log('[DEBUG]', logData1);
    fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData1)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
    // #endregion
    
    // Check URL parameters for password recovery token
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    // #region agent log
    const logData2 = {location:'reset-password/page.tsx:25',message:'URL params extracted',data:{tokenHash:tokenHash?tokenHash.substring(0,10)+'...':null,type,hasTokenHash:!!tokenHash,hasType:!!type},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A,E'};
    console.log('[DEBUG]', logData2);
    fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
    // #endregion

    // If we have token parameters, verify them to enter recovery mode
    // This should happen BEFORE any auth state changes
    if (tokenHash && type === 'recovery') {
      // #region agent log
      const logData3 = {location:'reset-password/page.tsx:27',message:'Entering token verification branch',data:{tokenHash:tokenHash.substring(0,10)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'};
      console.log('[DEBUG]', logData3);
      fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData3)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
      // #endregion
      // Verify the OTP token to establish recovery session
      // This will put the user in recovery mode without fully authenticating them
      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      }).then(({ error }) => {
        // #region agent log
        const logData4 = {location:'reset-password/page.tsx:33',message:'verifyOtp callback',data:{hasError:!!error,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B,D'};
        console.log('[DEBUG]', logData4);
        fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData4)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
        // #endregion
        if (error) {
          setError('Invalid or expired password reset link. Please request a new one.');
          setIsRecoveryMode(false);
        } else {
          // Successfully verified - user is now in recovery mode
          // Even if this creates a session, we won't redirect until password is updated
          recoveryModeEnteredRef.current = true; // Mark that we've entered recovery mode
          setIsRecoveryMode(true);
          setError(null);
          setMessage('Please enter your new password below.');
        }
      });
    } else {
      // #region agent log
      const logData5 = {location:'reset-password/page.tsx:45',message:'Entering else branch (no token)',data:{tokenHash:tokenHash?tokenHash.substring(0,10)+'...':null,type},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A,C,E'};
      console.log('[DEBUG]', logData5);
      fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData5)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
      // #endregion
      
      // No token in URL - check if user has a recovery session
      // First check session to see if it's a recovery session
      supabase.auth.getSession().then(({ data: { session } }) => {
        // #region agent log
        const logData6a = {location:'reset-password/page.tsx:48a',message:'getSession callback in else branch',data:{hasSession:!!session,sessionAud:session?.user?.aud},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B,C'};
        console.log('[DEBUG]', logData6a);
        fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData6a)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
        // #endregion
        
        // Check if this is a recovery session or if we've already entered recovery mode
        // If user has a session but no token, they might be in recovery mode already
        // OR if we've already entered recovery mode (token was processed), allow password entry
        if ((session && !tokenHash) || recoveryModeEnteredRef.current) {
          // #region agent log
          const logData6b = {location:'reset-password/page.tsx:48b',message:'Recovery mode detected (session or ref)',data:{hasSession:!!session,tokenHash:tokenHash?tokenHash.substring(0,10)+'...':null,recoveryModeEntered:recoveryModeEnteredRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B,C'};
          console.log('[DEBUG]', logData6b);
          fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData6b)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
          // #endregion
          // User has a session or we've already entered recovery mode
          // Allow them to set password instead of redirecting
          recoveryModeEnteredRef.current = true; // Ensure ref is set
          setIsRecoveryMode(true);
          setError(null);
          setMessage('Please enter your new password below.');
          return;
        }
        
        // No session and haven't entered recovery mode - check if user is authenticated (but not in recovery flow)
        supabase.auth.getUser().then(({ data: { user } }) => {
          // #region agent log
          const logData6 = {location:'reset-password/page.tsx:48',message:'getUser callback in else branch',data:{hasUser:!!user,userId:user?.id?.substring(0,10),tokenHash:tokenHash?tokenHash.substring(0,10)+'...':null,hasSession:!!session,recoveryModeEntered:recoveryModeEnteredRef.current,willRedirect:!!(user&&!tokenHash&&!session&&!recoveryModeEnteredRef.current)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B,C'};
          console.log('[DEBUG]', logData6);
          fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData6)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
          // #endregion
          if (user && !tokenHash && !session && !recoveryModeEnteredRef.current) {
            // #region agent log
            const logData7 = {location:'reset-password/page.tsx:49',message:'REDIRECT TRIGGERED - line 52',data:{userId:user.id?.substring(0,10),tokenHash:tokenHash?tokenHash.substring(0,10)+'...':null,hasSession:!!session,recoveryModeEntered:recoveryModeEnteredRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B,C'};
            console.log('[DEBUG]', logData7);
            fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData7)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
            // #endregion
            // User is authenticated but not in recovery flow and no session - redirect to home
            // This prevents authenticated users from accessing the reset page directly
            router.push('/');
          } else if (!tokenHash && !session && !recoveryModeEnteredRef.current) {
            // No token, no session, no recovery mode entered, and no user - need to click email link
            setError('Please click the password reset link from your email to continue.');
            setIsRecoveryMode(false);
          }
        });
      });
    }
  }, [router, searchParams, supabase.auth]);

  useEffect(() => {
    // #region agent log
    const logData8 = {location:'reset-password/page.tsx:62',message:'onAuthStateChange setup',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
    console.log('[DEBUG]', logData8);
    fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData8)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
    // #endregion
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // #region agent log
      const logData9 = {location:'reset-password/page.tsx:66',message:'Auth state change event',data:{event,hasSession:!!session,passwordJustUpdated:passwordJustUpdatedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
      console.log('[DEBUG]', logData9);
      fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData9)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
      // #endregion
      if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery mode - allow them to set new password
        recoveryModeEnteredRef.current = true; // Mark that we've entered recovery mode
        setIsRecoveryMode(true);
        setError(null);
        setMessage('Please enter your new password below.');
      } else if (event === 'SIGNED_IN') {
        // IMPORTANT: Only redirect if password was just updated by the user
        // Do NOT redirect if SIGNED_IN happens from recovery token verification
        // The passwordJustUpdatedRef is only set to true when user submits the form
        if (passwordJustUpdatedRef.current) {
          setMessage('Password updated successfully! Redirecting...');
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          // SIGNED_IN happened but password wasn't just updated
          // This could be from recovery token verification - don't redirect
          // User still needs to set a new password
          const tokenHash = searchParams.get('token_hash');
          // #region agent log
          const logData10 = {location:'reset-password/page.tsx:85',message:'SIGNED_IN but password not updated',data:{tokenHash:tokenHash?tokenHash.substring(0,10)+'...':null,passwordJustUpdated:passwordJustUpdatedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
          console.log('[DEBUG]', logData10);
          fetch('http://127.0.0.1:7242/ingest/fd116326-23a3-480d-913c-37095c9a4041',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData10)}).catch((e)=>console.error('[DEBUG] Fetch failed:',e));
          // #endregion
          if (tokenHash) {
            // We have a recovery token, so this is part of the recovery flow
            recoveryModeEnteredRef.current = true; // Mark that we've entered recovery mode
            setIsRecoveryMode(true);
            setError(null);
            setMessage('Please enter your new password below.');
          }
        }
      }
    });

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

