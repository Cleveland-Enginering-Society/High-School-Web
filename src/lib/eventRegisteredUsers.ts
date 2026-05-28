// Written by Evan Dan

import { formatContactsForClipboard } from '@/lib/adminAccounts';

export interface EventRegisteredUserContact {
  studentEmail?: string | null;
  parentEmail?: string | null;
}

export function collectSignupEmails(users: EventRegisteredUserContact[]): string[] {
  return users
    .map((user) => user.studentEmail?.trim())
    .filter((email): email is string => Boolean(email));
}

export function collectParentEmails(users: EventRegisteredUserContact[]): string[] {
  return users
    .map((user) => user.parentEmail?.trim())
    .filter((email): email is string => Boolean(email));
}

export function formatEmailsForClipboard(emails: string[]): string {
  return formatContactsForClipboard(emails);
}
