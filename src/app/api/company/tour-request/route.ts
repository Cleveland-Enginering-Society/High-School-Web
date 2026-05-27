import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsCompany } from '@/lib/roles';
import { validateAndBuildTourRequest } from '@/lib/tourRequestValidation';

const TOUR_REQUEST_SELECT =
  'id, possible_days, possible_times, date_options, max_students, food_drinks, age_restrictions, additional_requirements, created_at, request_status';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkIsCompany(supabase, user.id))) {
      return NextResponse.json(
        { error: 'Only company accounts can view tour requests' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('Tour_Request')
      .select(TOUR_REQUEST_SELECT)
      .eq('company_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ tourRequests: data ?? [] });
  } catch (error) {
    console.error('Tour request fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkIsCompany(supabase, user.id))) {
      return NextResponse.json(
        { error: 'Only company accounts can submit tour requests' },
        { status: 403 }
      );
    }

    const validated = validateAndBuildTourRequest(formData);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { data, error: insertError } = await supabase
      .from('Tour_Request')
      .insert([{ company_id: user.id, ...validated.data }])
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tourRequestId: data.id,
      message: 'Tour request submitted successfully',
    });
  } catch (error) {
    console.error('Tour request error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
