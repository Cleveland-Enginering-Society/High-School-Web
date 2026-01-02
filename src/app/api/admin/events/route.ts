import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    // TODO: Add admin role check here if needed
    // For now, any authenticated user can create events

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

    // Prepare data for Event table
    const eventData = {
      event_name: eventName,
      event_time: eventTime, // This should be in ISO format (YYYY-MM-DDTHH:mm:ss)
      event_location: eventLocation,
      event_description: eventDescription,
      max_users: maxUsers,
      event_waiver_info: eventWaiverInfo,
      event_waiver_parent: eventWaiverParent || null,
      registered_list: [], // Initialize empty array for registered users
    };

    // Insert data into Event table
    const { data, error: insertError } = await supabase
      .from('Event')
      .insert([eventData])
      .select()
      .single();

    if (insertError) {
      console.error('Event creation error:', insertError);
      return NextResponse.json(
        { error: insertError.message || 'Failed to create event' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, event: data });
  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

