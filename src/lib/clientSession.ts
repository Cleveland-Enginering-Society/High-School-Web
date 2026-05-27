import type { SupabaseClient } from '@supabase/supabase-js';
import { isAdminProfile, isCompanyProfile } from '@/lib/roles';

export const ACCOUNT_REVOKED_CODE = 'ACCOUNT_REVOKED';

export interface NavbarAuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCompany: boolean;
}

/** Clears Supabase cookies when the auth user or app profile no longer exists. */
export async function clearStaleAuthSession(supabase: SupabaseClient): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchAccountPayload(): Promise<
  | { ok: true; data: { user?: Record<string, unknown> } }
  | { ok: false; revoked: boolean }
> {
  const response = await fetch('/api/account');
  if (response.ok) {
    const data = await response.json();
    return { ok: true, data };
  }

  const body = (await response.json().catch(() => ({}))) as { code?: string };
  const revoked =
    response.status === 401 || body.code === ACCOUNT_REVOKED_CODE;

  return { ok: false, revoked };
}

/** Validates auth user against /api/account; signs out if the app account was removed. */
export async function resolveNavbarAuth(
  supabase: SupabaseClient
): Promise<NavbarAuthState> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAuthenticated: false, isAdmin: false, isCompany: false };
  }

  const account = await fetchAccountPayload();
  if (!account.ok) {
    if (account.revoked) {
      await clearStaleAuthSession(supabase);
    }
    return { isAuthenticated: false, isAdmin: false, isCompany: false };
  }

  const profile = account.data.user ?? {};
  return {
    isAuthenticated: true,
    isAdmin: isAdminProfile(profile),
    isCompany: isCompanyProfile(profile),
  };
}
