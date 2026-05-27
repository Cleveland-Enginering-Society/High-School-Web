import type { SupabaseClient } from '@supabase/supabase-js';
import { USER_TYPE_TABLE } from '@/lib/userTypes';

export interface AccountAccessFields {
  user_type_table?: number;
  is_active?: boolean;
}

export type AccountStatusVariant = 'pending_admin' | 'inactive';

export interface AccountStatusInfo {
  eventSignupDisabled: boolean;
  variant: AccountStatusVariant | null;
  title: string | null;
  message: string | null;
}

export const PENDING_ADMIN_TITLE = 'Pending Admin Approval';
export const PENDING_ADMIN_MESSAGE =
  'Your CES admin account request is waiting for approval from an existing administrator. If you have not verified your email yet, use the link in your inbox first. After signing in, event signups and account edits stay unavailable until your request is approved.';
export const PENDING_ADMIN_EVENT_MESSAGE =
  'Event signup is unavailable while your admin account request is pending approval.';

export const INACTIVE_ACCOUNT_TITLE = 'Account disabled';
export const INACTIVE_ACCOUNT_MESSAGE =
  'This account has been deactivated. Event signups and account changes are unavailable. Contact CES if you believe this is an error.';
export const INACTIVE_ACCOUNT_EVENT_MESSAGE =
  'Event signup is unavailable because this account has been deactivated.';

export function isPendingAdminAccount(user: AccountAccessFields): boolean {
  return user.user_type_table === USER_TYPE_TABLE.ADMIN_REQUEST;
}

export function isInactiveAccount(user: AccountAccessFields): boolean {
  return user.is_active === false;
}

export function isEventSignupDisabled(user: AccountAccessFields): boolean {
  return isPendingAdminAccount(user) || isInactiveAccount(user);
}

export function getAccountStatusInfo(user: AccountAccessFields): AccountStatusInfo {
  if (isPendingAdminAccount(user)) {
    return {
      eventSignupDisabled: true,
      variant: 'pending_admin',
      title: PENDING_ADMIN_TITLE,
      message: PENDING_ADMIN_MESSAGE,
    };
  }

  if (isInactiveAccount(user)) {
    return {
      eventSignupDisabled: true,
      variant: 'inactive',
      title: INACTIVE_ACCOUNT_TITLE,
      message: INACTIVE_ACCOUNT_MESSAGE,
    };
  }

  return {
    eventSignupDisabled: false,
    variant: null,
    title: null,
    message: null,
  };
}

export function getEventSignupBlockedMessage(user: AccountAccessFields): string | null {
  if (isPendingAdminAccount(user)) return PENDING_ADMIN_EVENT_MESSAGE;
  if (isInactiveAccount(user)) return INACTIVE_ACCOUNT_EVENT_MESSAGE;
  return null;
}

/** Server-side check before event registration POST. */
export async function getEventSignupBlockForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('User')
    .select('user_type_table, is_active')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return 'Unable to verify account status.';
  }

  return getEventSignupBlockedMessage(data);
}
