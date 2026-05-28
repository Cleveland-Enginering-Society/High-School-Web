// Written by Evan Dan

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/roles';
import { EVENT_STATUS } from '@/lib/eventStatus';

// GET - Fetch events (non-admins cannot see dismissed events)
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isAdmin = user ? await checkIsAdmin(supabase, user.id) : false;

    let query = supabase.from('Event').select('*').order('event_start_time', { ascending: true });

    if (!isAdmin) {
      query = query.in('status', [EVENT_STATUS.ONGOING, EVENT_STATUS.PAST]);
    }

    const { data: events, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    return NextResponse.json({ events: events || [], isAdmin });
  } catch (error) {
    console.error('Events fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

