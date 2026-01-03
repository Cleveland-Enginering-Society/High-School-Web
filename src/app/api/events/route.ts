import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all events
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Fetch all events from Event table
    const { data: events, error: fetchError } = await supabase
      .from('Event')
      .select('*')
      .order('event_time', { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('Events fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

