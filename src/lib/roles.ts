import { SupabaseClient } from '@supabase/supabase-js';
import { USER_TYPE_TABLE, STUDENT_USER_TYPE } from '@/lib/userTypes';

export interface UserProfileForRoles {
  user_type_table?: number;
  user_type?: number;
}

/** Admin table user, or student with elevated Student.user_type. */
export function isAdminProfile(profile: UserProfileForRoles): boolean {
  if (profile.user_type_table === USER_TYPE_TABLE.ADMIN) return true;
  if (
    profile.user_type_table === USER_TYPE_TABLE.STUDENT &&
    profile.user_type === STUDENT_USER_TYPE.ADMIN
  ) {
    return true;
  }
  return false;
}

export function isCompanyProfile(profile: UserProfileForRoles): boolean {
  return profile.user_type_table === USER_TYPE_TABLE.COMPANY;
}

/** Server-side company account check using User table. */
export async function checkIsCompany(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: userData, error: fetchError } = await supabase
    .from('User')
    .select('user_type_table')
    .eq('id', userId)
    .single();

  if (fetchError || !userData) return false;
  return userData.user_type_table === USER_TYPE_TABLE.COMPANY;
}

/** Server-side admin check using User + Student tables. */
export async function checkIsAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: userData, error: fetchError } = await supabase
    .from('User')
    .select('user_type_table')
    .eq('id', userId)
    .single();

  if (fetchError || !userData) return false;

  if (userData.user_type_table === USER_TYPE_TABLE.ADMIN) return true;

  if (userData.user_type_table === USER_TYPE_TABLE.STUDENT) {
    const { data: studentData, error: studentError } = await supabase
      .from('Student')
      .select('user_type')
      .eq('id', userId)
      .single();

    if (!studentError && studentData?.user_type === STUDENT_USER_TYPE.ADMIN) return true;
  }

  return false;
}
