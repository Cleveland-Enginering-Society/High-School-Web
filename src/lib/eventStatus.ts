// Written by Evan Dan

/** Values stored on public."Event".status */
export const EVENT_STATUS = {
  ONGOING: 'ongoing',
  PAST: 'past',
  DISMISSED: 'dismissed',
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export type EventDisplayLabel = 'Ongoing' | 'Past' | 'Dismissed';

export type EventTab = EventStatus;

/** Tabs visible to non-admin users on the events page. */
export type PublicEventTab = typeof EVENT_STATUS.ONGOING | typeof EVENT_STATUS.PAST;

const VALID_STATUSES = new Set<string>(Object.values(EVENT_STATUS));

export function isValidEventStatus(value: string): value is EventStatus {
  return VALID_STATUSES.has(value);
}

export function normalizeEventStatus(raw: string | null | undefined): EventStatus {
  const lower = (raw ?? '').toLowerCase();
  if (isValidEventStatus(lower)) return lower;
  return EVENT_STATUS.ONGOING;
}

export function getEventDisplayLabel(status: EventStatus): EventDisplayLabel {
  switch (status) {
    case EVENT_STATUS.PAST:
      return 'Past';
    case EVENT_STATUS.DISMISSED:
      return 'Dismissed';
    default:
      return 'Ongoing';
  }
}

export function getEventDisplayLabelFromEvent(event: { status?: string | null }): EventDisplayLabel {
  return getEventDisplayLabel(normalizeEventStatus(event.status));
}

export function matchesEventTab(
  event: { status?: string | null },
  tab: EventTab
): boolean {
  return normalizeEventStatus(event.status) === tab;
}

export function countByEventTab(
  events: { status?: string | null }[],
  tab: EventTab
): number {
  return events.filter((e) => matchesEventTab(e, tab)).length;
}

const STATUS_BADGE_CLASSES: Record<EventDisplayLabel, string> = {
  Ongoing: 'bg-green-100 text-green-800 border-green-200',
  Past: 'bg-blue-100 text-blue-800 border-blue-200',
  Dismissed: 'bg-gray-100 text-gray-700 border-gray-300',
};

export function eventStatusBadgeClass(label: EventDisplayLabel): string {
  return STATUS_BADGE_CLASSES[label];
}

export function isPublicEventTab(value: string): value is PublicEventTab {
  return value === EVENT_STATUS.ONGOING || value === EVENT_STATUS.PAST;
}

/** New signups are only allowed while an event is ongoing. */
export function isEventSignupOpen(status: string | null | undefined): boolean {
  return normalizeEventStatus(status) === EVENT_STATUS.ONGOING;
}

export function emptyEventTabMessage(tab: EventTab, isAdmin: boolean): string {
  switch (tab) {
    case EVENT_STATUS.PAST:
      return 'No past events.';
    case EVENT_STATUS.DISMISSED:
      return isAdmin ? 'No dismissed events.' : 'No events found.';
    default:
      return 'No ongoing events at this time.';
  }
}
