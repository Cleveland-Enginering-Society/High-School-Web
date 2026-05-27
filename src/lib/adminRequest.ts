export interface AdminRequestRecord {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: number | null;
}

export const ADMIN_REQUEST_SELECT =
  'id, created_at, first_name, last_name, email, phone';

export function formatAdminRequestName(request: AdminRequestRecord): string {
  return `${request.first_name} ${request.last_name}`.trim();
}

export function formatAdminRequestDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function phoneToDb(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'number' ? value : Number(String(value).replace(/\D/g, ''));
  if (Number.isNaN(num)) return null;
  return num;
}
