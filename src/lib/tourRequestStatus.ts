/** Values stored on public."Tour_Request".request_status */
export const TOUR_REQUEST_STATUS = {
  ONGOING: 'ongoing',
  APPROVED: 'approved',
  DISMISSED: 'dismissed',
} as const;

export type TourRequestStatus =
  (typeof TOUR_REQUEST_STATUS)[keyof typeof TOUR_REQUEST_STATUS];

export type TourRequestDisplayLabel = 'Ongoing' | 'Approved' | 'Dismissed';

export type TourRequestTab = TourRequestStatus;

const VALID_STATUSES = new Set<string>(Object.values(TOUR_REQUEST_STATUS));

export function isValidTourRequestStatus(value: string): value is TourRequestStatus {
  return VALID_STATUSES.has(value);
}

export function normalizeTourRequestStatus(
  raw: string | null | undefined
): TourRequestStatus {
  const lower = (raw ?? '').toLowerCase();
  if (isValidTourRequestStatus(lower)) return lower;
  return TOUR_REQUEST_STATUS.ONGOING;
}

export function getTourRequestDisplayLabel(
  status: TourRequestStatus
): TourRequestDisplayLabel {
  switch (status) {
    case TOUR_REQUEST_STATUS.APPROVED:
      return 'Approved';
    case TOUR_REQUEST_STATUS.DISMISSED:
      return 'Dismissed';
    default:
      return 'Ongoing';
  }
}

export function getTourRequestDisplayLabelFromRequest(request: {
  request_status: string;
}): TourRequestDisplayLabel {
  return getTourRequestDisplayLabel(normalizeTourRequestStatus(request.request_status));
}

export function matchesTourRequestTab(
  request: { request_status: string },
  tab: TourRequestTab
): boolean {
  return normalizeTourRequestStatus(request.request_status) === tab;
}

export function countByTourRequestTab(
  requests: { request_status: string }[],
  tab: TourRequestTab
): number {
  return requests.filter((r) => matchesTourRequestTab(r, tab)).length;
}

const STATUS_BADGE_CLASSES: Record<TourRequestDisplayLabel, string> = {
  Ongoing: 'bg-green-100 text-green-800 border-green-200',
  Approved: 'bg-blue-100 text-blue-800 border-blue-200',
  Dismissed: 'bg-gray-100 text-gray-700 border-gray-300',
};

export function tourRequestStatusBadgeClass(label: TourRequestDisplayLabel): string {
  return STATUS_BADGE_CLASSES[label];
}
