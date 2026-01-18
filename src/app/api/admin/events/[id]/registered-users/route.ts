import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch registered users for an event
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

    // Fetch event to get registered_list
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .select('registered_list, parent_list')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const registeredList = event.registered_list || [];
    
    if (registeredList.length === 0) {
      return NextResponse.json({ registeredUsers: [] });
    }

    // Fetch all registered users with their details
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('*')
      .in('id', registeredList);

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message || 'Failed to fetch users' },
        { status: 400 }
      );
    }

    // Fetch event registrations to get parent registration info
    const { data: registrations, error: registrationsError } = await supabase
      .from('Event_Registration')
      .select('*')
      .eq('event_id', eventId);

    if (registrationsError) {
      return NextResponse.json(
        { error: registrationsError.message || 'Failed to fetch registrations' },
        { status: 400 }
      );
    }

    // Create a map of user_id to registration data
    const registrationMap = new Map();
    registrations?.forEach((reg) => {
      registrationMap.set(reg.user_id, reg);
    });

    // Combine user data with registration data
    const registeredUsers = users?.map((user) => {
      const registration = registrationMap.get(user.id);
      const parentList = event.parent_list || [];
      const hasParentRegistered = parentList.includes(user.id);

      return {
        id: user.id,
        studentFirstName: user.student_first_name || '',
        studentLastName: user.student_last_name || '',
        studentEmail: user.student_email || '',
        studentPhone: user.student_phone || null,
        parentFirstName: user.parent_first_name || '',
        parentLastName: user.parent_last_name || '',
        parentEmail: user.parent_email || '',
        parentPhone: user.parent_phone || null,
        registeredParentName: registration?.registered_parent_name || null,
        registeredParentCompany: registration?.registered_parent_company || null,
        hasParentRegistered: hasParentRegistered,
      };
    }) || [];

    return NextResponse.json({ registeredUsers });
  } catch (error) {
    console.error('Fetch registered users error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

