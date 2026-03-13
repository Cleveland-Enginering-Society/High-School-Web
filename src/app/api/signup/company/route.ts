import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      user_type_table: 3, // Company
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

    // Build host_options array for jsonb; "Other" becomes "Other: [text]" when they specify
    let hostOptions: string[] = [];
    if (Array.isArray(formData.hostOptions) && formData.hostOptions.length > 0) {
      const otherSpecify = formData.hostOptionsOther?.trim();
      hostOptions = formData.hostOptions
        .filter((o: string) => o !== 'Other')
        .concat(formData.hostOptions.includes('Other') ? [otherSpecify ? `Other: ${otherSpecify}` : 'Other'] : []);
    }
    const hostOptionsValue = hostOptions.length > 0 ? hostOptions : null;

    const companyData = {
      id: authData.user.id,
      company_name: formData.companyName,
      industry: formData.industry,
      company_location: formData.companyLocation,
      contact_first_name: formData.contactFirstName,
      contact_last_name: formData.contactLastName,
      contact_email: formData.contactEmail,
      contact_phone: formData.contactPhone ?? null,
      secondary_first_name: formData.secondaryFirstName?.trim() || null,
      secondary_last_name: formData.secondaryLastName?.trim() || null,
      secondary_email: formData.secondaryEmail?.trim() || null,
      secondary_phone: formData.secondaryPhone ?? null,
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
