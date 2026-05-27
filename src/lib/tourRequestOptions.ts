/** Weekday options for tour availability (Mon–Sat). */
export const TOUR_DAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Two-hour time frame options for tour availability. */
export const TOUR_TIME_FRAME_OPTIONS = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
  'Other',
] as const;

const STANDARD_TIME_FRAMES = new Set(
  TOUR_TIME_FRAME_OPTIONS.filter((option) => option !== 'Other')
);

export function buildTourTimeFrames(
  selected: string[],
  otherText?: string
): string[] {
  if (!Array.isArray(selected) || selected.length === 0) return [];

  const otherSpecify = otherText?.trim();
  return selected
    .filter((option) => option !== 'Other')
    .concat(
      selected.includes('Other')
        ? [otherSpecify ? `Other: ${otherSpecify}` : 'Other']
        : []
    );
}

/** Build timestamptz[] values from date/time form rows. */
export function buildDateOptions(
  rows: { date: string; time: string }[]
): string[] | null {
  const timestamps = rows
    .filter((row) => row.date && row.time)
    .map((row) => {
      const [year, month, day] = row.date.split('-').map(Number);
      const [hours, minutes] = row.time.split(':').map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes, 0);
      return localDate.toISOString();
    });

  return timestamps.length > 0 ? timestamps : null;
}

export function parseTourTimeFrames(stored: string[] | null | undefined): {
  possibleTimes: string[];
  possibleTimesOther: string;
} {
  if (!Array.isArray(stored) || stored.length === 0) {
    return { possibleTimes: [], possibleTimesOther: '' };
  }

  const possibleTimes: string[] = [];
  let possibleTimesOther = '';

  for (const entry of stored) {
    if (entry === 'Other') {
      if (!possibleTimes.includes('Other')) possibleTimes.push('Other');
    } else if (entry.startsWith('Other:')) {
      if (!possibleTimes.includes('Other')) possibleTimes.push('Other');
      possibleTimesOther = entry.slice('Other:'.length).trim();
    } else if (STANDARD_TIME_FRAMES.has(entry)) {
      possibleTimes.push(entry);
    }
  }

  return { possibleTimes, possibleTimesOther };
}

/** Convert stored timestamptz values back into date/time form rows. */
export function parseDateOptions(
  stored: string[] | null | undefined
): { date: string; time: string }[] {
  if (!Array.isArray(stored) || stored.length === 0) return [];

  return stored.map((iso) => {
    const d = new Date(iso);
    const date = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
    const time = [
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
    ].join(':');
    return { date, time };
  });
}
