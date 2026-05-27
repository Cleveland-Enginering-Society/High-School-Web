import { companyMatchesHostOptionFilters } from '@/lib/hostOptions';
import { STUDENT_USER_TYPE, USER_TYPE_TABLE } from '@/lib/userTypes';

export type AccountTab = 'students' | 'companies' | 'admins';
export type AccountDetailType = AccountTab;

export type StudentSortKey = 'name' | 'email' | 'grade' | 'school' | 'role' | 'status';
export type CompanySortKey = 'company' | 'industry' | 'location' | 'contact' | 'email' | 'status';
export type AdminSortKey = 'name' | 'email' | 'status';

export interface AdminStudentAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  grade: number | string | null;
  school: string | null;
  phone: string | number | null;
  roleLabel: 'Member' | 'Student admin';
  isActive: boolean;
}

export interface AdminCompanyAccount {
  id: string;
  companyName: string;
  industry: string | null;
  location: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactEmail: string | null;
  contactPhone: string | number | null;
  hostOptions: string[] | null;
  isActive: boolean;
}

export interface AdminStaffAccount {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | number | null;
  isActive: boolean;
}

export interface AdminAccountsPayload {
  students: AdminStudentAccount[];
  companies: AdminCompanyAccount[];
  admins: AdminStaffAccount[];
}

export interface AdminAccountUserMeta {
  id: string;
  userTypeTable: number;
  userTypeTableLabel: string;
  isActive: boolean;
}

export interface AdminAccountDetail {
  accountType: AccountDetailType;
  user: AdminAccountUserMeta;
  profile: Record<string, unknown>;
}

export interface ProfileFieldSection {
  title: string;
  keys: string[];
}

export const STUDENT_SORT_OPTIONS: { value: StudentSortKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'grade', label: 'Grade' },
  { value: 'school', label: 'School' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status' },
];

export const COMPANY_SORT_OPTIONS: { value: CompanySortKey; label: string }[] = [
  { value: 'company', label: 'Company name' },
  { value: 'industry', label: 'Industry' },
  { value: 'location', label: 'Location' },
  { value: 'contact', label: 'Contact name' },
  { value: 'email', label: 'Contact email' },
  { value: 'status', label: 'Status' },
];

export const ADMIN_SORT_OPTIONS: { value: AdminSortKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'status', label: 'Status' },
];

const PROFILE_FIELD_LABELS: Record<string, string> = {
  id: 'Account ID',
  student_first_name: 'Student first name',
  student_last_name: 'Student last name',
  student_email: 'Student email',
  student_grade: 'Grade',
  student_phone: 'Student phone',
  school: 'School',
  parent_first_name: 'Parent first name',
  parent_last_name: 'Parent last name',
  parent_email: 'Parent email',
  parent_phone: 'Parent phone',
  user_type: 'Student role',
  photo_release: 'Photo / media release',
  student_participation_sign: 'Student participation signature',
  student_participation_date: 'Student participation date',
  parent_participation_sign: 'Parent participation signature',
  parent_participation_date: 'Parent participation date',
  company_name: 'Company name',
  industry: 'Industry',
  company_location: 'Company location',
  contact_first_name: 'Contact first name',
  contact_last_name: 'Contact last name',
  contact_email: 'Contact email',
  contact_phone: 'Contact phone',
  secondary_first_name: 'Secondary contact first name',
  secondary_last_name: 'Secondary contact last name',
  secondary_email: 'Secondary contact email',
  secondary_phone: 'Secondary contact phone',
  host_options: 'Host options',
  first_name: 'First name',
  last_name: 'Last name',
  email: 'Email',
  phone: 'Phone',
  user_type_table: 'Account type',
  is_active: 'Active',
};

export const STUDENT_PROFILE_SECTIONS: ProfileFieldSection[] = [
  {
    title: 'Student',
    keys: [
      'student_first_name',
      'student_last_name',
      'student_email',
      'student_grade',
      'student_phone',
      'school',
      'user_type',
      'photo_release',
    ],
  },
  {
    title: 'Parent / guardian',
    keys: [
      'parent_first_name',
      'parent_last_name',
      'parent_email',
      'parent_phone',
    ],
  },
  {
    title: 'Participation agreements',
    keys: [
      'student_participation_sign',
      'student_participation_date',
      'parent_participation_sign',
      'parent_participation_date',
    ],
  },
];

export const COMPANY_PROFILE_SECTIONS: ProfileFieldSection[] = [
  {
    title: 'Company',
    keys: ['company_name', 'industry', 'company_location', 'host_options'],
  },
  {
    title: 'Primary contact',
    keys: [
      'contact_first_name',
      'contact_last_name',
      'contact_email',
      'contact_phone',
    ],
  },
  {
    title: 'Secondary contact',
    keys: [
      'secondary_first_name',
      'secondary_last_name',
      'secondary_email',
      'secondary_phone',
    ],
  },
];

export const ADMIN_PROFILE_SECTIONS: ProfileFieldSection[] = [
  {
    title: 'Admin',
    keys: ['first_name', 'last_name', 'email', 'phone'],
  },
];

export function studentRoleLabel(userType: number | null | undefined): 'Member' | 'Student admin' {
  return userType === STUDENT_USER_TYPE.ADMIN ? 'Student admin' : 'Member';
}

export function userTypeTableLabel(userTypeTable: number): string {
  switch (userTypeTable) {
    case USER_TYPE_TABLE.ADMIN:
      return 'Admin';
    case USER_TYPE_TABLE.COMPANY:
      return 'Company';
    case USER_TYPE_TABLE.STUDENT:
      return 'Student';
    case USER_TYPE_TABLE.ADMIN_REQUEST:
      return 'Pending admin';
    default:
      return 'Unknown';
  }
}

export function formatAccountName(first: string | null, last: string | null): string {
  const parts = [first, last].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

export function profileFieldLabel(key: string): string {
  return PROFILE_FIELD_LABELS[key] ?? key.replace(/_/g, ' ');
}

export function formatProfileFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  if (key === 'user_type') {
    const num = typeof value === 'number' ? value : Number(value);
    return studentRoleLabel(Number.isNaN(num) ? undefined : num);
  }

  if (key === 'photo_release' || key === 'is_active') {
    return value === true || value === 'true' ? 'Yes' : 'No';
  }

  if (key === 'host_options' && Array.isArray(value)) {
    return value.length > 0 ? value.join('; ') : '—';
  }

  if (Array.isArray(value)) {
    return value.map(String).join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

function compareStrings(a: string, b: string, ascending: boolean): number {
  const result = a.localeCompare(b, undefined, { sensitivity: 'base' });
  return ascending ? result : -result;
}

function compareNumbers(a: number, b: number, ascending: boolean): number {
  return ascending ? a - b : b - a;
}

function compareBooleans(a: boolean, b: boolean, ascending: boolean): number {
  const av = a ? 1 : 0;
  const bv = b ? 1 : 0;
  return ascending ? av - bv : bv - av;
}

export function filterStudents(
  students: AdminStudentAccount[],
  query: string
): AdminStudentAccount[] {
  const q = query.trim().toLowerCase();
  if (!q) return students;

  return students.filter((s) => {
    const haystack = [
      s.firstName,
      s.lastName,
      s.email,
      s.school,
      s.grade,
      s.phone,
      s.roleLabel,
      s.isActive ? 'active' : 'inactive',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterCompanies(
  companies: AdminCompanyAccount[],
  query: string,
  hostOptionFilters: string[] = []
): AdminCompanyAccount[] {
  const q = query.trim().toLowerCase();

  return companies.filter((c) => {
    if (!companyMatchesHostOptionFilters(c.hostOptions, hostOptionFilters)) {
      return false;
    }
    if (!q) return true;

    const contact = formatAccountName(c.contactFirstName, c.contactLastName);
    const haystack = [
      c.companyName,
      c.industry,
      c.location,
      contact,
      c.contactEmail,
      c.contactPhone,
      ...(c.hostOptions ?? []),
      c.isActive ? 'active' : 'inactive',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterAdmins(admins: AdminStaffAccount[], query: string): AdminStaffAccount[] {
  const q = query.trim().toLowerCase();
  if (!q) return admins;

  return admins.filter((a) => {
    const haystack = [
      a.firstName,
      a.lastName,
      a.email,
      a.phone,
      a.isActive ? 'active' : 'inactive',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function sortStudents(
  students: AdminStudentAccount[],
  sortKey: StudentSortKey,
  ascending: boolean
): AdminStudentAccount[] {
  const sorted = [...students];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'email':
        return compareStrings(a.email, b.email, ascending);
      case 'grade': {
        const ga = Number(a.grade) || 0;
        const gb = Number(b.grade) || 0;
        return compareNumbers(ga, gb, ascending);
      }
      case 'school':
        return compareStrings(a.school ?? '', b.school ?? '', ascending);
      case 'role':
        return compareStrings(a.roleLabel, b.roleLabel, ascending);
      case 'status':
        return compareBooleans(a.isActive, b.isActive, ascending);
      case 'name':
      default: {
        const last = compareStrings(a.lastName, b.lastName, ascending);
        if (last !== 0) return last;
        return compareStrings(a.firstName, b.firstName, ascending);
      }
    }
  });
  return sorted;
}

export function sortCompanies(
  companies: AdminCompanyAccount[],
  sortKey: CompanySortKey,
  ascending: boolean
): AdminCompanyAccount[] {
  const sorted = [...companies];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'industry':
        return compareStrings(a.industry ?? '', b.industry ?? '', ascending);
      case 'location':
        return compareStrings(a.location ?? '', b.location ?? '', ascending);
      case 'contact': {
        const ca = formatAccountName(a.contactFirstName, a.contactLastName);
        const cb = formatAccountName(b.contactFirstName, b.contactLastName);
        return compareStrings(ca, cb, ascending);
      }
      case 'email':
        return compareStrings(a.contactEmail ?? '', b.contactEmail ?? '', ascending);
      case 'status':
        return compareBooleans(a.isActive, b.isActive, ascending);
      case 'company':
      default:
        return compareStrings(a.companyName, b.companyName, ascending);
    }
  });
  return sorted;
}

export function sortAdmins(
  admins: AdminStaffAccount[],
  sortKey: AdminSortKey,
  ascending: boolean
): AdminStaffAccount[] {
  const sorted = [...admins];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'email':
        return compareStrings(a.email ?? '', b.email ?? '', ascending);
      case 'status':
        return compareBooleans(a.isActive, b.isActive, ascending);
      case 'name':
      default: {
        const last = compareStrings(a.lastName ?? '', b.lastName ?? '', ascending);
        if (last !== 0) return last;
        return compareStrings(a.firstName ?? '', b.firstName ?? '', ascending);
      }
    }
  });
  return sorted;
}

export function accountDetailTitle(detail: AdminAccountDetail): string {
  switch (detail.accountType) {
    case 'companies':
      return (detail.profile.company_name as string) || 'Company account';
    case 'admins':
      return formatAccountName(
        detail.profile.first_name as string | null,
        detail.profile.last_name as string | null
      );
    default:
      return formatAccountName(
        detail.profile.student_first_name as string | null,
        detail.profile.student_last_name as string | null
      );
  }
}

export function profileSectionsForType(
  accountType: AccountDetailType
): ProfileFieldSection[] {
  switch (accountType) {
    case 'companies':
      return COMPANY_PROFILE_SECTIONS;
    case 'admins':
      return ADMIN_PROFILE_SECTIONS;
    default:
      return STUDENT_PROFILE_SECTIONS;
  }
}

function normalizeContactValue(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface ListedAccountsLists {
  students: AdminStudentAccount[];
  companies: AdminCompanyAccount[];
  admins: AdminStaffAccount[];
}

/** Emails for accounts currently shown in the active tab (after search/sort). */
export function collectListedEmails(
  tab: AccountTab,
  lists: ListedAccountsLists
): string[] {
  switch (tab) {
    case 'companies':
      return lists.companies
        .map((c) => normalizeContactValue(c.contactEmail))
        .filter((v): v is string => v !== null);
    case 'admins':
      return lists.admins
        .map((a) => normalizeContactValue(a.email))
        .filter((v): v is string => v !== null);
    default:
      return lists.students
        .map((s) => normalizeContactValue(s.email))
        .filter((v): v is string => v !== null);
  }
}

/** Phone numbers for accounts currently shown in the active tab (after search/sort). */
export function collectListedPhones(
  tab: AccountTab,
  lists: ListedAccountsLists
): string[] {
  switch (tab) {
    case 'companies':
      return lists.companies
        .map((c) => normalizeContactValue(c.contactPhone))
        .filter((v): v is string => v !== null);
    case 'admins':
      return lists.admins
        .map((a) => normalizeContactValue(a.phone))
        .filter((v): v is string => v !== null);
    default:
      return lists.students
        .map((s) => normalizeContactValue(s.phone))
        .filter((v): v is string => v !== null);
  }
}

export function formatContactsForClipboard(values: string[]): string {
  return values.join('\n ');
}
