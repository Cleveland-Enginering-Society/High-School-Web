/**
 * Account type stored on public."User".user_type_table.
 * Determines which profile table holds the user's data (Student, Admin, or Company).
 */
export const USER_TYPE_TABLE = {
  STUDENT: 1,
  ADMIN: 2,
  COMPANY: 3,
  /** Pending admin approval; profile lives in Admin_Request until approved or denied. */
  ADMIN_REQUEST: 4,
} as const;

export type UserTypeTable = (typeof USER_TYPE_TABLE)[keyof typeof USER_TYPE_TABLE];

/**
 * Role stored on public."Student".user_type (student accounts only).
 * Numbering matches USER_TYPE_TABLE: 1 = member, 2 = admin privileges.
 */
export const STUDENT_USER_TYPE = {
  MEMBER: 1,
  ADMIN: 2,
} as const;

export type StudentUserType = (typeof STUDENT_USER_TYPE)[keyof typeof STUDENT_USER_TYPE];
