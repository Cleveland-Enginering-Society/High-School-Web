import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/roles';
import { ADMIN_REQUEST_SELECT, phoneToDb } from '@/lib/adminRequest';
import { validateAdminRequestForm } from '@/lib/adminRequestValidation';
import { USER_TYPE_TABLE } from '@/lib/userTypes';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { sendSignupConfirmationEmail } from '@/lib/authEmailConfirmation';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!(await checkIsAdmin(supabase, user.id))) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { supabase, user };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from('Admin_Request')
      .select(ADMIN_REQUEST_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ adminRequests: data ?? [] });
  } catch (error) {
    console.error('Admin requests list error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth && auth.error) return auth.error;

    const formData = await request.json();
    const validationErrors = validateAdminRequestForm({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
    });

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ error: 'Validation failed', errors: validationErrors }, { status: 400 });
    }

    const email = formData.email.trim().toLowerCase();
    const serviceSupabase = createServiceRoleClient();

    if (!serviceSupabase) {
      return NextResponse.json(
        {
          error:
            'Server is not configured to create admin accounts. Set SUPABASE_SERVICE_ROLE_KEY.',
        },
        { status: 500 }
      );
    }

    const { data: authData, error: createUserError } =
      await serviceSupabase.auth.admin.createUser({
        email,
        password: formData.password,
        email_confirm: false,
      });

    if (createUserError || !authData.user) {
      return NextResponse.json(
        { error: createUserError?.message || 'Failed to create auth user' },
        { status: 400 }
      );
    }

    const newUserId = authData.user.id;
    const phone = phoneToDb(formData.phone);

    const { error: userInsertError } = await serviceSupabase.from('User').insert([
      {
        id: newUserId,
        user_type_table: USER_TYPE_TABLE.ADMIN_REQUEST,
        is_active: true,
      },
    ]);

    if (userInsertError) {
      await serviceSupabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: userInsertError.message }, { status: 400 });
    }

    const { error: requestInsertError } = await serviceSupabase
      .from('Admin_Request')
      .insert([
        {
          id: newUserId,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email,
          phone,
        },
      ]);

    if (requestInsertError) {
      await serviceSupabase.from('User').delete().eq('id', newUserId);
      await serviceSupabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: requestInsertError.message }, { status: 400 });
    }

    const { error: confirmationEmailError } = await sendSignupConfirmationEmail(
      serviceSupabase,
      email,
      request.nextUrl.origin
    );

    if (confirmationEmailError) {
      await serviceSupabase.from('Admin_Request').delete().eq('id', newUserId);
      await serviceSupabase.from('User').delete().eq('id', newUserId);
      await serviceSupabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        {
          error: `Account was created but the verification email could not be sent: ${confirmationEmailError}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: true,
      message:
        'Admin request submitted. A verification email was sent to the applicant. They must verify their email before signing in, then an existing admin can approve the request.',
      requestId: newUserId,
    });
  } catch (error) {
    console.error('Admin request create error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
