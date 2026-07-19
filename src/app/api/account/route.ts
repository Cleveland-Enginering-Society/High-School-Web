export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { USER_TYPE_TABLE } from '@/lib/userTypes';
import { buildHostOptions } from '@/lib/hostOptions';
import {
  getAccountStatusInfo,
  isEventSignupDisabled,
  isPendingAdminAccount,
} from '@/lib/accountAccess';
import { ACCOUNT_REVOKED_CODE } from '@/lib/clientSession';

function accountRevokedResponse(message = 'Account no longer exists') {
  return NextResponse.json(
    { error: message, code: ACCOUNT_REVOKED_CODE },
    { status: 401 }
  );
}

// GET - Fetch user account data
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userTypeData, error: userTypeError } = await supabase
      .from('User')
      .select('user_type_table, is_active')
      .eq('id', user.id)
      .single();

    if (userTypeError) {
      return accountRevokedResponse();
    }

    const userTypeTable = userTypeData?.user_type_table;
    let userData: Record<string, unknown> | null = null;

    if (userTypeTable === USER_TYPE_TABLE.STUDENT) {
      const { data: studentData, error: studentError } = await supabase
        .from('Student')
        .select('*')
        .eq('id', user.id)
        .single();

      if (studentError) {
        return NextResponse.json(
          { error: studentError.message },
          { status: 400 }
        );
      }
      userData = studentData;
    } else if (userTypeTable === USER_TYPE_TABLE.ADMIN) {
      const { data: adminData, error: adminError } = await supabase
        .from('Admin')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminError) {
        return NextResponse.json(
          { error: adminError.message },
          { status: 400 }
        );
      }
      userData = adminData;
    } else if (userTypeTable === USER_TYPE_TABLE.COMPANY) {
      const { data: companyData, error: companyError } = await supabase
        .from('Company')
        .select('*')
        .eq('id', user.id)
        .single();

      if (companyError) {
        return NextResponse.json(
          { error: companyError.message },
          { status: 400 }
        );
      }
      userData = companyData;
    } else if (userTypeTable === USER_TYPE_TABLE.ADMIN_REQUEST) {
      const { data: requestData, error: requestError } = await supabase
        .from('Admin_Request')
        .select('*')
        .eq('id', user.id)
        .single();

      if (requestError) {
        return accountRevokedResponse(
          'Admin request was denied or is no longer available.'
        );
      }
      userData = requestData;
    } else {
      return accountRevokedResponse('User type not supported');
    }

    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }
    
    userData.user_type_table = userTypeTable;
    userData.is_active = userTypeData?.is_active !== false;

    const accountStatus = getAccountStatusInfo({
      user_type_table: userTypeTable,
      is_active: userData.is_active as boolean,
    });

    return NextResponse.json({
      user: userData,
      accountStatus,
      eventSignupDisabled: isEventSignupDisabled({
        user_type_table: userTypeTable,
        is_active: userData.is_active as boolean,
      }),
    });
  } catch (error) {
    console.error('Account fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

function phoneToDb(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
}

// PUT - Update user account data
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userTypeData, error: userTypeError } = await supabase
      .from('User')
      .select('user_type_table, is_active')
      .eq('id', user.id)
      .single();

    if (userTypeError) {
      return NextResponse.json(
        { error: userTypeError.message },
        { status: 400 }
      );
    }

    const userTypeTable = userTypeData?.user_type_table;

    if (
      isPendingAdminAccount({ user_type_table: userTypeTable }) ||
      userTypeData?.is_active === false
    ) {
      return NextResponse.json(
        { error: 'Account changes are not available for this account status.' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (userTypeTable === USER_TYPE_TABLE.STUDENT) {
      if (formData.studentFirstName !== undefined) updateData.student_first_name = formData.studentFirstName;
      if (formData.studentLastName !== undefined) updateData.student_last_name = formData.studentLastName;
      if (formData.studentEmail !== undefined) updateData.student_email = formData.studentEmail;
      if (formData.studentGrade !== undefined) updateData.student_grade = formData.studentGrade;
      if (formData.studentPhone !== undefined) updateData.student_phone = formData.studentPhone || null;
      if (formData.parentFirstName !== undefined) updateData.parent_first_name = formData.parentFirstName;
      if (formData.parentLastName !== undefined) updateData.parent_last_name = formData.parentLastName;
      if (formData.parentEmail !== undefined) updateData.parent_email = formData.parentEmail;
      if (formData.parentPhone !== undefined) updateData.parent_phone = formData.parentPhone || null;
      if (formData.school !== undefined) updateData.school = formData.school;
      if (formData.photoMediaRelease !== undefined) updateData.photo_release = formData.photoMediaRelease;

      const { error: updateError } = await supabase
        .from('Student')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
    } else if (userTypeTable === USER_TYPE_TABLE.ADMIN) {
      if (formData.firstName !== undefined) updateData.first_name = formData.firstName;
      if (formData.lastName !== undefined) updateData.last_name = formData.lastName;
      if (formData.email !== undefined) updateData.email = formData.email;
      if (formData.phone !== undefined) updateData.phone = formData.phone || null;

      const { error: updateError } = await supabase
        .from('Admin')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
    } else if (userTypeTable === USER_TYPE_TABLE.COMPANY) {
      if (formData.contactFirstName !== undefined) updateData.contact_first_name = formData.contactFirstName;
      if (formData.contactLastName !== undefined) updateData.contact_last_name = formData.contactLastName;
      if (formData.contactEmail !== undefined) updateData.contact_email = formData.contactEmail;
      if (formData.contactPhone !== undefined) updateData.contact_phone = phoneToDb(formData.contactPhone);
      if (formData.secondaryFirstName !== undefined) updateData.secondary_first_name = formData.secondaryFirstName?.trim() || null;
      if (formData.secondaryLastName !== undefined) updateData.secondary_last_name = formData.secondaryLastName?.trim() || null;
      if (formData.secondaryEmail !== undefined) updateData.secondary_email = formData.secondaryEmail?.trim() || null;
      if (formData.secondaryPhone !== undefined) updateData.secondary_phone = phoneToDb(formData.secondaryPhone);
      if (formData.companyName !== undefined) updateData.company_name = formData.companyName;
      if (formData.industry !== undefined) updateData.industry = formData.industry;
      if (formData.companyLocation !== undefined) updateData.company_location = formData.companyLocation;
      if (formData.hostOptions !== undefined) {
        updateData.host_options = buildHostOptions(
          formData.hostOptions,
          formData.hostOptionsOther
        );
      }

      const { error: updateError } = await supabase
        .from('Company')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'User type not supported for updates' },
        { status: 400 }
      );
    }

    if (formData.password) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (passwordError) {
        return NextResponse.json(
          { error: passwordError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
