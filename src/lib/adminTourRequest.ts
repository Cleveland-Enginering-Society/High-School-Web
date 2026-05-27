export function parseTourRequestId(id: string): number | null {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export const ADMIN_TOUR_REQUEST_SELECT = `
  id,
  company_id,
  possible_days,
  possible_times,
  date_options,
  max_students,
  food_drinks,
  age_restrictions,
  additional_requirements,
  created_at,
  request_status,
  Company (
    company_name,
    industry,
    company_location,
    contact_first_name,
    contact_last_name,
    contact_email,
    contact_phone,
    secondary_first_name,
    secondary_last_name,
    secondary_email,
    secondary_phone
  )
`;

export interface CompanyInfo {
  company_name: string;
  industry: string | null;
  company_location: string | null;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string | null;
  secondary_first_name: string | null;
  secondary_last_name: string | null;
  secondary_email: string | null;
  secondary_phone: string | null;
}

export interface AdminTourRequest {
  id: number;
  company_id: string;
  possible_days: string[];
  possible_times: string[];
  date_options: string[] | null;
  max_students: number;
  food_drinks: string | null;
  age_restrictions: string;
  additional_requirements: string | null;
  created_at?: string;
  request_status: string;
  Company: CompanyInfo | CompanyInfo[] | null;
}

export type { TourRequestDisplayLabel, TourRequestStatus, TourRequestTab } from '@/lib/tourRequestStatus';
export {
  TOUR_REQUEST_STATUS,
  countByTourRequestTab,
  getTourRequestDisplayLabel,
  getTourRequestDisplayLabelFromRequest,
  matchesTourRequestTab,
  normalizeTourRequestStatus,
  tourRequestStatusBadgeClass,
} from '@/lib/tourRequestStatus';

export function formatTourRequestDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getCompanyFromTourRequest(
  request: AdminTourRequest
): CompanyInfo | null {
  if (!request.Company) return null;
  return Array.isArray(request.Company)
    ? request.Company[0] ?? null
    : request.Company;
}

export function parseFirstDateOption(iso: string | undefined): {
  eventDate: string;
  eventStartTime: string;
} {
  if (!iso) return { eventDate: '', eventStartTime: '' };
  const d = new Date(iso);
  const eventDate = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
  const eventStartTime = [
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
  ].join(':');
  return { eventDate, eventStartTime };
}

export function buildInitialEventFormFromTourRequest(
  request: AdminTourRequest
): {
  eventName: string;
  eventDate: string;
  eventStartTime: string;
  eventLocation: string;
  maxUsers: number;
} {
  const company = getCompanyFromTourRequest(request);
  const { eventDate, eventStartTime } = parseFirstDateOption(
    request.date_options?.[0]
  );

  return {
    eventName: company ? `${company.company_name} Industry Tour` : '',
    eventDate,
    eventStartTime,
    eventLocation: company?.company_location?.trim() ?? '',
    maxUsers: request.max_students,
  };
}

