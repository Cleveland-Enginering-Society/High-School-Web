'use client';

// Written by Evan Dan


import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    // If the reset link includes an access token (some Supabase flows include
    // `access_token` and `refresh_token`), set the session in the browser so
    // `updateUser` can succeed even if the session cookie wasn't set by the
    // server callback (e.g. user opened the link in a different browser).
    const params = new URLSearchParams(window.location.search);
    const at = params.get('access_token');
    const rt = params.get('refresh_token');

    if (!at) return;

    (async () => {
      try {
        const sessionPayload: any = { access_token: at };
        if (rt) sessionPayload.refresh_token = rt;
        await supabase.auth.setSession(sessionPayload);
        setInfo('Session established from reset link. You may now set a new password.');
        // Clean up tokens from URL for aesthetics/security
        params.delete('access_token');
        params.delete('refresh_token');
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
      } catch (err) {
        console.error('Failed to set session from reset link:', err);
      }
    })();
  }, [supabase.auth]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // This now works because a session exists from the callback
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message ?? 'Failed to update password.');
      setLoading(false);
    } else {
      router.push('/login?message=Success! Please login with your new password.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleUpdate} className="w-full max-w-md space-y-4 border p-6 rounded-lg">
        <h1 className="text-xl font-bold">Create New Password</h1>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded border p-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {info && <p className="text-green-600 text-sm">{info}</p>}
        {!info && !error && (
          <p className="text-sm text-gray-600">If the form fails, ensure you opened the reset link in the same browser used to request it, or request a new reset.</p>
        )}
        <button disabled={loading} className="w-full rounded bg-green-600 p-2 text-white">
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}