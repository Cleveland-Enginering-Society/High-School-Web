import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    const supabase = await createClient();

    // Sign up the user with student email and password
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.studentEmail,
      password: formData.password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // First, insert into User table with user_type_table = 1 (Student)
    const userData = {
      id: authData.user.id,
      user_type_table: 1, // Student
      is_active: true,
    };

    const { error: userInsertError } = await supabase
      .from('User')
      .insert([userData]);

    if (userInsertError) {
      return NextResponse.json(
        { error: userInsertError.message },
        { status: 400 }
      );
    }

    // Prepare data for Student table
    const studentData = {
      id: authData.user.id,
      student_first_name: formData.studentFirstName,
      student_last_name: formData.studentLastName,
      student_email: formData.studentEmail,
      student_grade: formData.studentGrade,
      student_phone: formData.studentPhone || null,
      school: formData.school || null,
      parent_first_name: formData.parentFirstName,
      parent_last_name: formData.parentLastName,
      parent_email: formData.parentEmail,
      parent_phone: formData.parentPhone || null,
      user_type: formData.memberType || 1, // Default to 1 (Student) if not provided
      photo_release: formData.photoMediaRelease,
      student_participation_sign: formData.studentSignature || null, // Store signature text
      parent_participation_sign: formData.parentSignature || null, // Store signature text
      student_participation_date: formData.studentDate 
        ? (typeof formData.studentDate === 'string' 
          ? formData.studentDate.split('T')[0] 
          : new Date(formData.studentDate).toISOString().split('T')[0])
        : null,
      parent_participation_date: formData.parentDate 
        ? (typeof formData.parentDate === 'string' 
          ? formData.parentDate.split('T')[0] 
          : new Date(formData.parentDate).toISOString().split('T')[0])
        : null,
    };

    // Insert data into Student table
    const { error: insertError } = await supabase
      .from('Student')
      .insert([studentData]);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    // Check if user is already authenticated (session created during signUp)
    // This happens when email confirmation is disabled in Supabase settings
    if (authData.session) {
      // User is already authenticated - no need to sign in again
      return NextResponse.json({ 
        success: true,
        requiresEmailConfirmation: false 
      });
    }

    // If no session was created, email confirmation is likely required
    // Try to sign in to confirm
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.studentEmail,
      password: formData.password,
    });

    if (signInError) {
      // User created but sign-in failed (likely due to email confirmation requirement)
      // Return success but indicate email confirmation is needed
      return NextResponse.json(
        { 
          success: true, 
          requiresEmailConfirmation: true,
          message: 'Account created. Please check your email to confirm your account.' 
        },
        { status: 200 }
      );
    }

    // User successfully signed in (email confirmation was not required)
    return NextResponse.json({ 
      success: true,
      requiresEmailConfirmation: false 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

