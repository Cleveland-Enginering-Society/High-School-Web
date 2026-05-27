'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { USER_TYPE_TABLE } from '@/lib/userTypes';
import {
  TOUR_DAY_OPTIONS,
  TOUR_TIME_FRAME_OPTIONS,
  parseDateOptions,
  parseTourTimeFrames,
} from '@/lib/tourRequestOptions';

interface CompanyProfile {
  company_name?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  contact_phone?: string | null;
  secondary_first_name?: string | null;
  secondary_last_name?: string | null;
  secondary_email?: string | null;
  secondary_phone?: string | null;
}

interface DateTimeRow {
  id: string;
  date: string;
  time: string;
}

interface FormErrors {
  possibleDays?: string;
  possibleTimes?: string;
  possibleTimesOther?: string;
  dateOptions?: string;
  maxStudents?: string;
  ageRestrictions?: string;
}

function newDateTimeRow(date = '', time = ''): DateTimeRow {
  return { id: crypto.randomUUID(), date, time };
}

interface CompanyTourRequestFormProps {
  tourRequestId?: string;
}

export default function CompanyTourRequestForm({
  tourRequestId,
}: CompanyTourRequestFormProps) {
  const isEditing = Boolean(tourRequestId);
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [possibleDays, setPossibleDays] = useState<string[]>([]);
  const [possibleTimes, setPossibleTimes] = useState<string[]>([]);
  const [possibleTimesOther, setPossibleTimesOther] = useState('');
  const [dateOptions, setDateOptions] = useState<DateTimeRow[]>([]);
  const [maxStudents, setMaxStudents] = useState('');
  const [foodDrinks, setFoodDrinks] = useState('');
  const [ageRestrictions, setAgeRestrictions] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const accountResponse = await fetch('/api/account');
      if (!accountResponse.ok) {
        router.push('/login');
        return;
      }

      const accountData = await accountResponse.json();
      if (accountData.user?.user_type_table !== USER_TYPE_TABLE.COMPANY) {
        router.push('/');
        return;
      }

      setCompanyProfile(accountData.user);

      if (tourRequestId) {
        const tourResponse = await fetch(`/api/company/tour-request/${tourRequestId}`);
        if (!tourResponse.ok) {
          router.push('/company/tour-requests');
          return;
        }

        const tourData = await tourResponse.json();
        const request = tourData.tourRequest;
        const { possibleTimes: times, possibleTimesOther: timesOther } =
          parseTourTimeFrames(request.possible_times);
        const parsedDates = parseDateOptions(request.date_options);

        setPossibleDays(request.possible_days ?? []);
        setPossibleTimes(times);
        setPossibleTimesOther(timesOther);
        setDateOptions(
          parsedDates.length > 0
            ? parsedDates.map((row) => newDateTimeRow(row.date, row.time))
            : []
        );
        setMaxStudents(String(request.max_students ?? ''));
        setFoodDrinks(request.food_drinks ?? '');
        setAgeRestrictions(request.age_restrictions ?? '');
        setAdditionalRequirements(request.additional_requirements ?? '');
      }

      setIsLoading(false);
    };

    loadData();
  }, [router, supabase.auth, tourRequestId]);

  const toggleSelection = (
    value: string,
    selected: string[],
    setSelected: (next: string[]) => void
  ) => {
    setSelected(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (possibleDays.length === 0) {
      newErrors.possibleDays = 'Please select at least one day';
    }
    if (possibleTimes.length === 0) {
      newErrors.possibleTimes = 'Please select at least one time frame';
    }
    if (possibleTimes.includes('Other') && !possibleTimesOther.trim()) {
      newErrors.possibleTimesOther = 'Please specify when selecting Other';
    }

    const incompleteDate = dateOptions.some(
      (row) => (row.date && !row.time) || (!row.date && row.time)
    );
    if (incompleteDate) {
      newErrors.dateOptions = 'Each possible date must include both a date and a time';
    }

    const maxStudentsNum = Number(maxStudents);
    if (!maxStudents.trim() || !Number.isInteger(maxStudentsNum) || maxStudentsNum <= 0) {
      newErrors.maxStudents = 'Please enter a valid maximum number of students';
    }
    if (!ageRestrictions.trim()) {
      newErrors.ageRestrictions = 'Age restrictions are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = {
      possibleDays,
      possibleTimes,
      possibleTimesOther,
      dateOptions: dateOptions
        .filter((row) => row.date && row.time)
        .map(({ date, time }) => ({ date, time })),
      maxStudents: Number(maxStudents),
      foodDrinks,
      ageRestrictions,
      additionalRequirements,
    };

    try {
      const response = await fetch(
        isEditing
          ? `/api/company/tour-request/${tourRequestId}`
          : '/api/company/tour-request',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(
          data.error ||
            (isEditing ? 'Failed to update tour request' : 'Failed to submit tour request')
        );
        return;
      }

      setSubmitSuccess(true);
      setTimeout(() => router.push('/company/tour-requests'), 2000);
    } catch (error) {
      console.error('Tour request submit error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            {isEditing ? 'Edit Tour Request' : 'Industry Tour Request'}
          </h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/company/tour-requests" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Tour Requests
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {isEditing ? 'Edit Tour Request' : 'Industry Tour Request'}
        </h1>
        <p className="text-gray-600 mb-8">
          {isEditing
            ? 'Update your industry tour hosting request.'
            : 'Submit a request to host an industry tour. Company and contact information below is pulled from your account.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Company Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={companyProfile?.company_name || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
              />
            </div>
          </div>

          <div className="border-t border-gray-300" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Main Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={companyProfile?.contact_first_name || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={companyProfile?.contact_last_name || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={companyProfile?.contact_email || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={companyProfile?.contact_phone || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Secondary Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={companyProfile?.secondary_first_name || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={companyProfile?.secondary_last_name || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={companyProfile?.secondary_email || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={companyProfile?.secondary_phone || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              What days are generally good for you to host a tour? <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-600">Choose all that apply.</p>
            <div className="space-y-2">
              {TOUR_DAY_OPTIONS.map((day) => (
                <label key={day} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={possibleDays.includes(day)}
                    onChange={() => toggleSelection(day, possibleDays, setPossibleDays)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>{day}</span>
                </label>
              ))}
            </div>
            {errors.possibleDays && (
              <p className="text-red-500 text-sm">{errors.possibleDays}</p>
            )}
          </div>

          <div className="border-t border-gray-300" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              What time frames are generally good for you to host a tour? <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-600">Choose all that apply.</p>
            <div className="space-y-2">
              {TOUR_TIME_FRAME_OPTIONS.map((option) => (
                <div key={option}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={possibleTimes.includes(option)}
                        onChange={() => toggleSelection(option, possibleTimes, setPossibleTimes)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span>{option}</span>
                    </label>
                    {option === 'Other' && possibleTimes.includes('Other') && (
                      <input
                        type="text"
                        value={possibleTimesOther}
                        onChange={(e) => setPossibleTimesOther(e.target.value)}
                        placeholder="Please specify (required)"
                        className={`flex-1 min-w-[200px] max-w-md px-3 py-2 border rounded text-sm ${
                          errors.possibleTimesOther ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    )}
                  </div>
                  {option === 'Other' && possibleTimes.includes('Other') && errors.possibleTimesOther && (
                    <p className="text-red-500 text-sm mt-1 ml-6">{errors.possibleTimesOther}</p>
                  )}
                </div>
              ))}
            </div>
            {errors.possibleTimes && (
              <p className="text-red-500 text-sm">{errors.possibleTimes}</p>
            )}
          </div>

          <div className="border-t border-gray-300" />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Are you ready to schedule a tour now?{' '}
              <span className="text-gray-500 font-normal">(optional)</span>
            </h2>
            <p className="text-sm text-gray-600">
              If so, provide specific dates and times that you can host a student tour.
            </p>

            {dateOptions.map((row, index) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => {
                      const next = [...dateOptions];
                      next[index] = { ...row, date: e.target.value };
                      setDateOptions(next);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={row.time}
                    onChange={(e) => {
                      const next = [...dateOptions];
                      next[index] = { ...row, time: e.target.value };
                      setDateOptions(next);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setDateOptions(dateOptions.filter((item) => item.id !== row.id))}
                    className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setDateOptions([...dateOptions, newDateTimeRow()])}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
            >
              Add Possible Date + Time
            </button>
            {errors.dateOptions && (
              <p className="text-red-500 text-sm">{errors.dateOptions}</p>
            )}
          </div>

          <div className="border-t border-gray-300" />

          <div className="space-y-4">
            <div>
              <label htmlFor="maxStudents" className="block text-sm font-medium mb-1">
                What is the maximum number of students that you can host for a tour?{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="maxStudents"
                min="1"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                className={`w-full max-w-xs px-3 py-2 border rounded ${
                  errors.maxStudents ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.maxStudents && (
                <p className="text-red-500 text-sm mt-1">{errors.maxStudents}</p>
              )}
            </div>

            <div>
              <label htmlFor="foodDrinks" className="block text-sm font-medium mb-1">
                Would your company be interested in supplying beverages and snacks as part of the tour?{' '}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="foodDrinks"
                value={foodDrinks}
                onChange={(e) => setFoodDrinks(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Describe what you can provide, or leave blank if not applicable"
              />
            </div>

            <div>
              <label htmlFor="ageRestrictions" className="block text-sm font-medium mb-1">
                Do you have any age restrictions (i.e. must be 18 and older)?{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="ageRestrictions"
                value={ageRestrictions}
                onChange={(e) => setAgeRestrictions(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded ${
                  errors.ageRestrictions ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder='e.g., "No restrictions" or "Must be 16 or older"'
              />
              {errors.ageRestrictions && (
                <p className="text-red-500 text-sm mt-1">{errors.ageRestrictions}</p>
              )}
            </div>

            <div>
              <label htmlFor="additionalRequirements" className="block text-sm font-medium mb-1">
                Do you have any additional rules/requirements that we need to know about (waivers, forms, policies, etc.)?{' '}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="additionalRequirements"
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {isEditing
                ? 'Tour request updated successfully! Redirecting...'
                : 'Tour request submitted successfully! Redirecting...'}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? isEditing
                  ? 'Saving...'
                  : 'Submitting...'
                : isEditing
                  ? 'Save Changes'
                  : 'Submit Tour Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
