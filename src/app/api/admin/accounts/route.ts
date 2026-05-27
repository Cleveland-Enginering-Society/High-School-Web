import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/roles';
import {
  AdminAccountsPayload,
  AdminCompanyAccount,
  AdminStaffAccount,
  AdminStudentAccount,
  studentRoleLabel,
} from '@/lib/adminAccounts';

function activeFromMap(map: Map<string, boolean>, id: string): boolean {
  return map.get(id) ?? true;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await checkIsAdmin(supabase, user.id))) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const [studentsResult, companiesResult, adminsResult, usersResult] = await Promise.all([
      supabase
        .from('Student')
        .select(
          'id, student_first_name, student_last_name, student_email, student_grade, school, student_phone, user_type'
        )
        .order('student_last_name', { ascending: true })
        .order('student_first_name', { ascending: true }),
      supabase
        .from('Company')
        .select(
          'id, company_name, industry, company_location, contact_first_name, contact_last_name, contact_email, contact_phone, host_options'
        )
        .order('company_name', { ascending: true }),
      supabase
        .from('Admin')
        .select('id, first_name, last_name, email, phone')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true }),
      supabase.from('User').select('id, is_active'),
    ]);

    const firstError =
      studentsResult.error ??
      companiesResult.error ??
      adminsResult.error ??
      usersResult.error;

    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const activeMap = new Map<string, boolean>();
    for (const row of usersResult.data ?? []) {
      activeMap.set(row.id, row.is_active !== false);
    }

    const students: AdminStudentAccount[] = (studentsResult.data ?? []).map((row) => ({
      id: row.id,
      firstName: row.student_first_name ?? '',
      lastName: row.student_last_name ?? '',
      email: row.student_email ?? '',
      grade: row.student_grade ?? null,
      school: row.school ?? null,
      phone: row.student_phone ?? null,
      roleLabel: studentRoleLabel(row.user_type),
      isActive: activeFromMap(activeMap, row.id),
    }));

    const companies: AdminCompanyAccount[] = (companiesResult.data ?? []).map((row) => ({
      id: row.id,
      companyName: row.company_name ?? '',
      industry: row.industry ?? null,
      location: row.company_location ?? null,
      contactFirstName: row.contact_first_name ?? null,
      contactLastName: row.contact_last_name ?? null,
      contactEmail: row.contact_email ?? null,
      contactPhone: row.contact_phone ?? null,
      hostOptions: Array.isArray(row.host_options) ? row.host_options : null,
      isActive: activeFromMap(activeMap, row.id),
    }));

    const admins: AdminStaffAccount[] = (adminsResult.data ?? []).map((row) => ({
      id: row.id,
      firstName: row.first_name ?? null,
      lastName: row.last_name ?? null,
      email: row.email ?? null,
      phone: row.phone ?? null,
      isActive: activeFromMap(activeMap, row.id),
    }));

    const payload: AdminAccountsPayload = { students, companies, admins };
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Admin accounts fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
