import { buildDateOptions, buildTourTimeFrames } from '@/lib/tourRequestOptions';
import { TOUR_REQUEST_STATUS } from '@/lib/tourRequestStatus';

export interface TourRequestFormInput {
  possibleDays?: string[];
  possibleTimes?: string[];
  possibleTimesOther?: string;
  dateOptions?: { date?: string; time?: string }[];
  maxStudents?: number | string;
  foodDrinks?: string;
  ageRestrictions?: string;
  additionalRequirements?: string;
}

export interface TourRequestRecord {
  possible_days: string[];
  possible_times: string[];
  date_options: string[] | null;
  max_students: number;
  food_drinks: string | null;
  age_restrictions: string;
  additional_requirements: string | null;
  request_status: string;
}

export function validateAndBuildTourRequest(
  formData: TourRequestFormInput
): { error: string } | { data: TourRequestRecord } {
  if (!Array.isArray(formData.possibleDays) || formData.possibleDays.length === 0) {
    return { error: 'Please select at least one day for hosting a tour' };
  }

  if (!Array.isArray(formData.possibleTimes) || formData.possibleTimes.length === 0) {
    return { error: 'Please select at least one time frame for hosting a tour' };
  }

  if (
    formData.possibleTimes.includes('Other') &&
    !formData.possibleTimesOther?.trim()
  ) {
    return { error: 'Please specify when selecting Other for time frames' };
  }

  const maxStudents = Number(formData.maxStudents);
  if (!Number.isInteger(maxStudents) || maxStudents <= 0) {
    return {
      error: 'Maximum number of students must be a positive whole number',
    };
  }

  if (!formData.ageRestrictions?.trim()) {
    return { error: 'Age restrictions are required' };
  }

  const dateRows = Array.isArray(formData.dateOptions) ? formData.dateOptions : [];
  const incompleteDateRow = dateRows.some(
    (row) => (row.date && !row.time) || (!row.date && row.time)
  );
  if (incompleteDateRow) {
    return {
      error: 'Each possible date must include both a date and a time',
    };
  }

  return {
    data: {
      possible_days: formData.possibleDays,
      possible_times: buildTourTimeFrames(
        formData.possibleTimes,
        formData.possibleTimesOther
      ),
      date_options: buildDateOptions(
        dateRows.filter(
          (row): row is { date: string; time: string } =>
            Boolean(row.date && row.time)
        )
      ),
      max_students: maxStudents,
      food_drinks: formData.foodDrinks?.trim() || null,
      age_restrictions: formData.ageRestrictions.trim(),
      additional_requirements: formData.additionalRequirements?.trim() || null,
      request_status: TOUR_REQUEST_STATUS.ONGOING,
    },
  };
}
