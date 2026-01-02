import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user account data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user data from User table
    const { data: userData, error: fetchError } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Account fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT - Update user account data
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.json();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {};
    
    if (formData.studentFirstName !== undefined) updateData.student_first_name = formData.studentFirstName;
    if (formData.studentLastName !== undefined) updateData.student_last_name = formData.studentLastName;
    if (formData.studentEmail !== undefined) updateData.student_email = formData.studentEmail;
    if (formData.studentGrade !== undefined) updateData.student_grade = formData.studentGrade;
    if (formData.studentPhone !== undefined) updateData.student_phone = formData.studentPhone || null;
    if (formData.parentFirstName !== undefined) updateData.parent_first_name = formData.parentFirstName;
    if (formData.parentLastName !== undefined) updateData.parent_last_name = formData.parentLastName;
    if (formData.parentEmail !== undefined) updateData.parent_email = formData.parentEmail;
    if (formData.parentPhone !== undefined) updateData.parent_phone = formData.parentPhone || null;
    if (formData.memberType !== undefined) updateData.user_type = formData.memberType;
    if (formData.photoMediaRelease !== undefined) updateData.photo_release = formData.photoMediaRelease;
    
    // Handle dates
    if (formData.studentDate !== undefined) {
      updateData.student_participation_date = formData.studentDate 
        ? (typeof formData.studentDate === 'string' 
          ? formData.studentDate.split('T')[0] 
          : new Date(formData.studentDate).toISOString().split('T')[0])
        : null;
    }
    if (formData.parentDate !== undefined) {
      updateData.parent_participation_date = formData.parentDate 
        ? (typeof formData.parentDate === 'string' 
          ? formData.parentDate.split('T')[0] 
          : new Date(formData.parentDate).toISOString().split('T')[0])
        : null;
    }

    // Update user data
    const { error: updateError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // If password is provided, update it in auth
    if (formData.password) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (passwordError) {
        return NextResponse.json(
          { error: passwordError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

