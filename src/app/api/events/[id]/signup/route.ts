import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch registration data for the current user
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

    const { id: eventId } = await params;

    // Fetch registration data
    const { data: registration, error: registrationError } = await supabase
      .from('Event_Registration')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (registrationError) {
      // If no registration found, return null (not an error)
      if (registrationError.code === 'PGRST116') {
        return NextResponse.json({ registration: null });
      }
      return NextResponse.json(
        { error: registrationError.message || 'Failed to fetch registration' },
        { status: 400 }
      );
    }

    return NextResponse.json({ registration });
  } catch (error) {
    console.error('Fetch registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST - Sign up for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to sign up for events.' },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const {
      studentSignature,
      studentDate,
      parentSignature,
      parentDate,
    } = body;

    // Validate required fields
    if (!studentSignature || !studentDate || !parentSignature || !parentDate) {
      return NextResponse.json(
        { error: 'All signature fields are required' },
        { status: 400 }
      );
    }

    // Fetch event to check if it exists and get current registration info
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is already registered
    const registeredList = event.registered_list || [];
    if (registeredList.includes(user.id)) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      );
    }

    // Check if there are open spaces
    const registeredCount = registeredList.length;
    if (registeredCount >= event.max_users) {
      return NextResponse.json(
        { error: 'This event is full' },
        { status: 400 }
      );
    }

    // Prepare data for Event_Registration table
    const registrationData = {
      event_id: eventId,
      user_id: user.id,
      event_waiver_student_sign: studentSignature || null, // Store signature text
      event_waiver_parent_sign: parentSignature || null, // Store signature text
      event_waiver_student_date: studentDate 
        ? (typeof studentDate === 'string' 
          ? studentDate.split('T')[0] 
          : new Date(studentDate).toISOString().split('T')[0])
        : null,
      event_waiver_parent_date: parentDate 
        ? (typeof parentDate === 'string' 
          ? parentDate.split('T')[0] 
          : new Date(parentDate).toISOString().split('T')[0])
        : null,
    };

    // Insert into Event_Registration table
    const { error: registrationError } = await supabase
      .from('Event_Registration')
      .insert([registrationData]);

    if (registrationError) {
      console.error('Event registration error:', registrationError);
      return NextResponse.json(
        { error: registrationError.message || 'Failed to register for event' },
        { status: 400 }
      );
    }

    // Update the Event table's registered_list array
    const updatedRegisteredList = [...registeredList, user.id];
    const { error: updateError } = await supabase
      .from('Event')
      .update({ registered_list: updatedRegisteredList })
      .eq('id', eventId);

    if (updateError) {
      console.error('Event update error:', updateError);
      // Try to rollback the registration if event update fails
      await supabase
        .from('Event_Registration')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);
      
      return NextResponse.json(
        { error: 'Failed to update event registration. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully registered for event' 
    });
  } catch (error) {
    console.error('Event signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel event registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to cancel event registration.' },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;

    // Fetch event to check if it exists and get current registration info
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is registered
    const registeredList = event.registered_list || [];
    if (!registeredList.includes(user.id)) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 400 }
      );
    }

    // Delete from Event_Registration table (using both event_id and user_id for efficient query)
    const { error: deleteError } = await supabase
      .from('Event_Registration')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Event registration deletion error:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to cancel event registration' },
        { status: 400 }
      );
    }

    // Update the Event table's registered_list array (remove user from list)
    const updatedRegisteredList = registeredList.filter((id: string) => id !== user.id);
    const { error: updateError } = await supabase
      .from('Event')
      .update({ registered_list: updatedRegisteredList })
      .eq('id', eventId);

    if (updateError) {
      console.error('Event update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update event registration. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully canceled event registration' 
    });
  } catch (error) {
    console.error('Event cancellation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

