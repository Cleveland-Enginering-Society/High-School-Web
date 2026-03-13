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

    // Fetch user types for registered users
    const { data: userTypes, error: userTypesError } = await supabase
      .from('User')
      .select('id, user_type_table')
      .in('id', registeredList);

    if (userTypesError) {
      return NextResponse.json(
        { error: userTypesError.message || 'Failed to fetch user types' },
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

    // Create a map of user_id to user_type_table
    const userTypeMap = new Map();
    userTypes?.forEach((ut) => {
      userTypeMap.set(ut.id, ut.user_type_table);
    });

    // Fetch student data for users with user_type_table === 1
    const studentIds = userTypes?.filter(ut => ut.user_type_table === 1).map(ut => ut.id) || [];
    let students: any[] = [];
    if (studentIds.length > 0) {
      const { data: studentData, error: studentError } = await supabase
        .from('Student')
        .select('*')
        .in('id', studentIds);

      if (studentError) {
        return NextResponse.json(
          { error: studentError.message || 'Failed to fetch students' },
          { status: 400 }
        );
      }
      students = studentData || [];
    }

    // Combine user data with registration data
    const registeredUsers = registeredList.map((userId: string) => {
      const userTypeTable = userTypeMap.get(userId);
      const registration = registrationMap.get(userId);
      const parentList = event.parent_list || [];
      const hasParentRegistered = parentList.includes(userId);

      if (userTypeTable === 1) {
        // Student
        const student = students.find(s => s.id === userId);
        return {
          id: userId,
          studentFirstName: student?.student_first_name || '',
          studentLastName: student?.student_last_name || '',
          studentEmail: student?.student_email || '',
          studentPhone: student?.student_phone || null,
          parentFirstName: student?.parent_first_name || '',
          parentLastName: student?.parent_last_name || '',
          parentEmail: student?.parent_email || '',
          parentPhone: student?.parent_phone || null,
          registeredParentName: registration?.registered_parent_name || null,
          registeredParentCompany: registration?.registered_parent_company || null,
          hasParentRegistered: hasParentRegistered,
        };
      } else {
        // Other user types (Company, Admin) - return minimal data
        return {
          id: userId,
          studentFirstName: '',
          studentLastName: '',
          studentEmail: '',
          studentPhone: null,
          parentFirstName: '',
          parentLastName: '',
          parentEmail: '',
          parentPhone: null,
          registeredParentName: registration?.registered_parent_name || null,
          registeredParentCompany: registration?.registered_parent_company || null,
          hasParentRegistered: hasParentRegistered,
        };
      }
    });

    return NextResponse.json({ registeredUsers });
  } catch (error) {
    console.error('Fetch registered users error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


