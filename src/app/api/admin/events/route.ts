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

    // Check if user has admin access (user_type_table === 3 OR student with user_type === 3)
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('user_type_table')
      .eq('id', user.id)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Check if user is admin (user_type_table === 3) or student with user_type === 3
    let isAdmin = userData.user_type_table === 3;
    
    if (!isAdmin && userData.user_type_table === 1) {
      // Check if student has user_type === 3
      const { data: studentData, error: studentError } = await supabase
        .from('Student')
        .select('user_type')
        .eq('id', user.id)
        .single();
      
      if (!studentError && studentData && studentData.user_type === 3) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      eventName,
      eventStartTime,
      eventEndTime,
      eventLocation,
      eventDescription,
      maxUsers,
      maxParents,
      eventWaiverInfo,
      eventWaiverParent,
    } = body;

    // Validate required fields
    if (!eventName || !eventStartTime || !eventLocation || !eventDescription || !maxUsers || !eventWaiverInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare data for Event table
    const eventData = {
      event_name: eventName,
      event_start_time: eventStartTime, // This should be in ISO format (YYYY-MM-DDTHH:mm:ss)
      event_end_time: eventEndTime || null, // Optional end time
      event_location: eventLocation,
      event_description: eventDescription,
      max_users: maxUsers,
      max_parents: maxParents || 0,
      event_waiver_info: eventWaiverInfo,
      event_waiver_parent: eventWaiverParent || null,
      registered_list: [], // Initialize empty array for registered users
      parent_list: [], // Initialize empty array for registered parents
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

