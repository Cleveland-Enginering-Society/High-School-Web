import type { SupabaseClient } from '@supabase/supabase-js';

export function getAuthEmailRedirectUrl(origin: string): string {
  return `${origin}/auth/callback`;
}

/** Send Supabase signup confirmation email (user must have email_confirm: false). */
export async function sendSignupConfirmationEmail(
  supabase: SupabaseClient,
  email: string,
  redirectOrigin: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: getAuthEmailRedirectUrl(redirectOrigin),
    },
  });

  return { error: error?.message ?? null };
}

export function isEmailNotConfirmedAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('email not confirmed') ||
    lower.includes('email address not confirmed') ||
    lower.includes('confirm your email')
  );
}
