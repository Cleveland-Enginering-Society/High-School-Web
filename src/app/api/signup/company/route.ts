import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildHostOptions } from '@/lib/hostOptions';
import { USER_TYPE_TABLE } from '@/lib/userTypes';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.contactEmail,
      password: formData.password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const userData = {
      id: authData.user.id,
      user_type_table: USER_TYPE_TABLE.COMPANY,
      is_active: true,
    };

    const { error: userInsertError } = await supabase
      .from('User')
      .insert([userData]);

    if (userInsertError) {
      return NextResponse.json(
        { error: userInsertError.message },
        { status: 400 }
      );
    }

    const hostOptionsValue = buildHostOptions(formData.hostOptions, formData.hostOptionsOther);

    const companyData = {
      id: authData.user.id,
      company_name: formData.companyName,
      industry: formData.industry,
      company_location: formData.companyLocation,
      contact_first_name: formData.contactFirstName,
      contact_last_name: formData.contactLastName,
      contact_email: formData.contactEmail,
      contact_phone:
        formData.contactPhone === undefined || formData.contactPhone === null || formData.contactPhone === ''
          ? null
          : String(formData.contactPhone),
      secondary_first_name: formData.secondaryFirstName?.trim() || null,
      secondary_last_name: formData.secondaryLastName?.trim() || null,
      secondary_email: formData.secondaryEmail?.trim() || null,
      secondary_phone:
        formData.secondaryPhone === undefined || formData.secondaryPhone === null || formData.secondaryPhone === ''
          ? null
          : String(formData.secondaryPhone),
      host_options: hostOptionsValue,
    };

    const { error: companyInsertError } = await supabase
      .from('Company')
      .insert([companyData]);

    if (companyInsertError) {
      return NextResponse.json(
        { error: companyInsertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: !authData.session,
      message: 'Company account created successfully',
    });
  } catch (error) {
    console.error('Company signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
