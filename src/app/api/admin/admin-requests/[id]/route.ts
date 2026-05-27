import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/roles';
import { phoneToDb } from '@/lib/adminRequest';
import { USER_TYPE_TABLE } from '@/lib/userTypes';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';

type AdminRequestAction = 'approve' | 'deny';

export async function PATCH(
  request: NextRequest,
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
    const body = await request.json();
    const action = body.action as AdminRequestAction;

    if (action !== 'approve' && action !== 'deny') {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "deny".' },
        { status: 400 }
      );
    }

    const { data: adminRequest, error: fetchError } = await supabase
      .from('Admin_Request')
      .select('id, first_name, last_name, email, phone')
      .eq('id', id)
      .single();

    if (fetchError || !adminRequest) {
      return NextResponse.json({ error: 'Admin request not found' }, { status: 404 });
    }

    const { data: userRow, error: userFetchError } = await supabase
      .from('User')
      .select('user_type_table')
      .eq('id', id)
      .single();

    if (userFetchError || !userRow) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    if (userRow.user_type_table !== USER_TYPE_TABLE.ADMIN_REQUEST) {
      return NextResponse.json(
        { error: 'This account is not a pending admin request' },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    if (action === 'approve') {
      const phone = phoneToDb(adminRequest.phone);
      const dbClient = serviceSupabase ?? supabase;

      const { error: adminInsertError } = await supabase.from('Admin').insert([
        {
          id: adminRequest.id,
          first_name: adminRequest.first_name,
          last_name: adminRequest.last_name,
          email: adminRequest.email,
          phone,
        },
      ]);

      if (adminInsertError) {
        return NextResponse.json({ error: adminInsertError.message }, { status: 400 });
      }

      const { error: userUpdateError } = await dbClient
        .from('User')
        .update({ user_type_table: USER_TYPE_TABLE.ADMIN })
        .eq('id', id);

      if (userUpdateError) {
        await supabase.from('Admin').delete().eq('id', id);
        return NextResponse.json({ error: userUpdateError.message }, { status: 400 });
      }

      const { error: deleteRequestError } = await supabase
        .from('Admin_Request')
        .delete()
        .eq('id', id);

      if (deleteRequestError) {
        return NextResponse.json({ error: deleteRequestError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Admin request approved. The user is now a CES admin.',
      });
    }

    // deny
    const { error: deleteRequestError } = await supabase
      .from('Admin_Request')
      .delete()
      .eq('id', id);

    if (deleteRequestError) {
      return NextResponse.json({ error: deleteRequestError.message }, { status: 400 });
    }

    const dbClient = serviceSupabase ?? supabase;
    const { error: deleteUserError } = await dbClient.from('User').delete().eq('id', id);

    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 400 });
    }

    let authCleanupWarning: string | undefined;
    if (serviceSupabase) {
      const { error: deleteAuthError } = await serviceSupabase.auth.admin.deleteUser(id);
      if (deleteAuthError) {
        authCleanupWarning =
          'Request denied, but the auth login could not be removed. Remove the user manually in Supabase Auth.';
      }
    } else {
      authCleanupWarning =
        'Request denied. Set SUPABASE_SERVICE_ROLE_KEY to fully remove the login from Supabase Auth.';
    }

    return NextResponse.json({
      success: true,
      message: 'Admin request denied.',
      warning: authCleanupWarning,
    });
  } catch (error) {
    console.error('Admin request update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
