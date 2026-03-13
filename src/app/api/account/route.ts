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

    // Fetch user type from User table
    const { data: userTypeData, error: userTypeError } = await supabase
      .from('User')
      .select('user_type_table')
      .eq('id', user.id)
      .single();

    if (userTypeError) {
      return NextResponse.json(
        { error: userTypeError.message },
        { status: 400 }
      );
    }

    const userTypeTable = userTypeData?.user_type_table;

    // Fetch user data from appropriate table based on user_type_table
    let userData = null;
    if (userTypeTable === 1) {
      // Student
      const { data: studentData, error: studentError } = await supabase
        .from('Student')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (studentError) {
        return NextResponse.json(
          { error: studentError.message },
          { status: 400 }
        );
      }
      userData = studentData;
    } else if (userTypeTable === 3) {
      // Admin
      const { data: adminData, error: adminError } = await supabase
        .from('Admin')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (adminError) {
        return NextResponse.json(
          { error: adminError.message },
          { status: 400 }
        );
      }
      userData = adminData;
    } else {
      return NextResponse.json(
        { error: 'User type not supported' },
        { status: 400 }
      );
    }

    // Add user_type_table to the response
    userData.user_type_table = userTypeTable;

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

    // First, get user_type_table to determine which table to update
    const { data: userTypeData, error: userTypeError } = await supabase
      .from('User')
      .select('user_type_table')
      .eq('id', user.id)
      .single();

    if (userTypeError) {
      return NextResponse.json(
        { error: userTypeError.message },
        { status: 400 }
      );
    }

    const userTypeTable = userTypeData?.user_type_table;

    // Prepare update data (only include fields that are provided)
    const updateData: any = {};
    
    if (userTypeTable === 1) {
      // Student table fields
      if (formData.studentFirstName !== undefined) updateData.student_first_name = formData.studentFirstName;
      if (formData.studentLastName !== undefined) updateData.student_last_name = formData.studentLastName;
      if (formData.studentEmail !== undefined) updateData.student_email = formData.studentEmail;
      if (formData.studentGrade !== undefined) updateData.student_grade = formData.studentGrade;
      if (formData.studentPhone !== undefined) updateData.student_phone = formData.studentPhone || null;
      if (formData.parentFirstName !== undefined) updateData.parent_first_name = formData.parentFirstName;
      if (formData.parentLastName !== undefined) updateData.parent_last_name = formData.parentLastName;
      if (formData.parentEmail !== undefined) updateData.parent_email = formData.parentEmail;
      if (formData.parentPhone !== undefined) updateData.parent_phone = formData.parentPhone || null;
      if (formData.school !== undefined) updateData.school = formData.school;
      if (formData.photoMediaRelease !== undefined) updateData.photo_release = formData.photoMediaRelease;
      
      // Note: Signatures and dates are read-only and cannot be updated through the account page

      // Update Student table
      const { error: updateError } = await supabase
        .from('Student')
        .update(updateData)
        .eq('id', user.id);
      
      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
    } else if (userTypeTable === 3) {
      // Admin table fields
      if (formData.firstName !== undefined) updateData.first_name = formData.firstName;
      if (formData.lastName !== undefined) updateData.last_name = formData.lastName;
      if (formData.email !== undefined) updateData.email = formData.email;
      if (formData.phone !== undefined) updateData.phone = formData.phone || null;

      // Update Admin table
      const { error: updateError } = await supabase
        .from('Admin')
        .update(updateData)
        .eq('id', user.id);
      
      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'User type not supported for updates' },
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

