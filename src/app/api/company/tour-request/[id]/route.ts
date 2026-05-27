import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsCompany } from '@/lib/roles';
import { validateAndBuildTourRequest } from '@/lib/tourRequestValidation';
import { parseTourRequestId } from '@/lib/adminTourRequest';
import { TOUR_REQUEST_STATUS } from '@/lib/tourRequestStatus';

const TOUR_REQUEST_SELECT =
  'id, possible_days, possible_times, date_options, max_students, food_drinks, age_restrictions, additional_requirements, created_at, request_status';

async function authorizeCompanyUser() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!(await checkIsCompany(supabase, user.id))) {
    return {
      response: NextResponse.json(
        { error: 'Only company accounts can access tour requests' },
        { status: 403 }
      ),
    };
  }

  return { supabase, user };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeCompanyUser();
    if ('response' in auth) return auth.response;

    const { supabase, user } = auth;
    const { id: idParam } = await params;
    const id = parseTourRequestId(idParam);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid tour request id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Tour_Request')
      .select(TOUR_REQUEST_SELECT)
      .eq('id', id)
      .eq('company_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Tour request not found' }, { status: 404 });
    }

    return NextResponse.json({ tourRequest: data });
  } catch (error) {
    console.error('Tour request fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeCompanyUser();
    if ('response' in auth) return auth.response;

    const { supabase, user } = auth;
    const { id: idParam } = await params;
    const id = parseTourRequestId(idParam);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid tour request id' }, { status: 400 });
    }
    const formData = await request.json();
    const validated = validateAndBuildTourRequest(formData);

    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const { request_status: _status, ...updateFields } = validated.data;

    const { data, error: updateError } = await supabase
      .from('Tour_Request')
      .update(updateFields)
      .eq('id', id)
      .eq('company_id', user.id)
      .eq('request_status', TOUR_REQUEST_STATUS.ONGOING)
      .select('id')
      .single();

    if (updateError || !data) {
      return NextResponse.json(
        { error: updateError?.message || 'Tour request not found' },
        { status: updateError ? 400 : 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tourRequestId: data.id,
      message: 'Tour request updated successfully',
    });
  } catch (error) {
    console.error('Tour request update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
