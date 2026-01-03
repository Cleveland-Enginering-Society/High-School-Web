import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch a single event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin access (user_type === 2)
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData || userData.user_type !== 2) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;

    // Fetch event from Event table
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) {
      return NextResponse.json(
        { error: eventError.message || 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Event fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT - Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin access (user_type === 2)
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData || userData.user_type !== 2) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const {
      eventName,
      eventTime,
      eventLocation,
      eventDescription,
      maxUsers,
      eventWaiverInfo,
      eventWaiverParent,
    } = body;

    // Validate required fields
    if (!eventName || !eventTime || !eventLocation || !eventDescription || !maxUsers || !eventWaiverInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      event_name: eventName,
      event_time: eventTime,
      event_location: eventLocation,
      event_description: eventDescription,
      max_users: maxUsers,
      event_waiver_info: eventWaiverInfo,
      event_waiver_parent: eventWaiverParent || null,
    };

    // Update event in Event table
    const { data, error: updateError } = await supabase
      .from('Event')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Event update error:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to update event' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, event: data });
  } catch (error) {
    console.error('Event update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

