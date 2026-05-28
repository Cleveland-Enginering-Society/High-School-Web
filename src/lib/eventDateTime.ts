// Written by Evan Dan

/** Combine HTML date + time inputs (browser local timezone) into UTC ISO for timestamptz storage. */
export function combineLocalDateAndTimeToISO(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return localDate.toISOString();
}

export function combineLocalDateAndTimeToISOOrNull(
  date: string,
  time: string | null | undefined
): string | null {
  if (!date || !time) return null;
  return combineLocalDateAndTimeToISO(date, time);
}

/** Split a stored timestamptz ISO value into local date/time for HTML inputs. */
export function splitLocalDateTimeFromISO(iso: string): {
  date: string;
  time: string;
} {
  const d = new Date(iso);
  return {
    date: [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-'),
    time: [
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
    ].join(':'),
  };
}
