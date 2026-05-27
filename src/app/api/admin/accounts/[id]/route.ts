import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/roles';
import {
  AccountDetailType,
  AdminAccountDetail,
  userTypeTableLabel,
} from '@/lib/adminAccounts';
import { USER_TYPE_TABLE } from '@/lib/userTypes';

function accountTypeFromUserTypeTable(userTypeTable: number): AccountDetailType | null {
  switch (userTypeTable) {
    case USER_TYPE_TABLE.STUDENT:
      return 'students';
    case USER_TYPE_TABLE.COMPANY:
      return 'companies';
    case USER_TYPE_TABLE.ADMIN:
      return 'admins';
    default:
      return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkIsAdmin(supabase, user.id))) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const { data: userRow, error: userError } = await supabase
      .from('User')
      .select('id, user_type_table, is_active')
      .eq('id', id)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const accountType = accountTypeFromUserTypeTable(userRow.user_type_table);
    if (!accountType) {
      return NextResponse.json({ error: 'Unsupported account type' }, { status: 400 });
    }

    let profile: Record<string, unknown> | null = null;

    if (accountType === 'students') {
      const { data, error } = await supabase.from('Student').select('*').eq('id', id).single();
      if (error || !data) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }
      const { id: _profileId, ...rest } = data;
      profile = rest as Record<string, unknown>;
    } else if (accountType === 'companies') {
      const { data, error } = await supabase.from('Company').select('*').eq('id', id).single();
      if (error || !data) {
        return NextResponse.json({ error: 'Company profile not found' }, { status: 404 });
      }
      const { id: _profileId, ...rest } = data;
      profile = rest as Record<string, unknown>;
    } else {
      const { data, error } = await supabase.from('Admin').select('*').eq('id', id).single();
      if (error || !data) {
        return NextResponse.json({ error: 'Admin profile not found' }, { status: 404 });
      }
      const { id: _profileId, ...rest } = data;
      profile = rest as Record<string, unknown>;
    }

    const detail: AdminAccountDetail = {
      accountType,
      user: {
        id: userRow.id,
        userTypeTable: userRow.user_type_table,
        userTypeTableLabel: userTypeTableLabel(userRow.user_type_table),
        isActive: userRow.is_active !== false,
      },
      profile: profile ?? {},
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error('Admin account detail fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
