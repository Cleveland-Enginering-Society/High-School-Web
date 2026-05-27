import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/roles';
import { ADMIN_TOUR_REQUEST_SELECT, parseTourRequestId } from '@/lib/adminTourRequest';
import { isValidTourRequestStatus, TOUR_REQUEST_STATUS } from '@/lib/tourRequestStatus';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkIsAdmin(supabase, user.id))) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id: idParam } = await params;
    const id = parseTourRequestId(idParam);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid tour request id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Tour_Request')
      .select(ADMIN_TOUR_REQUEST_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Tour request not found' }, { status: 404 });
    }

    return NextResponse.json({ tourRequest: data });
  } catch (error) {
    console.error('Admin tour request fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkIsAdmin(supabase, user.id))) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id: idParam } = await params;
    const id = parseTourRequestId(idParam);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid tour request id' }, { status: 400 });
    }

    const body = await request.json();
    const nextStatus =
      typeof body.request_status === 'string'
        ? body.request_status.toLowerCase()
        : null;

    if (!nextStatus || !isValidTourRequestStatus(nextStatus)) {
      return NextResponse.json(
        {
          error: `request_status must be one of: ${TOUR_REQUEST_STATUS.ONGOING}, ${TOUR_REQUEST_STATUS.APPROVED}, ${TOUR_REQUEST_STATUS.DISMISSED}`,
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('Tour_Request')
      .update({ request_status: nextStatus })
      .eq('id', id)
      .select('id, request_status')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Tour request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, request_status: data.request_status });
  } catch (error) {
    console.error('Admin tour request update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
