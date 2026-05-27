'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatTourRequestDateTime } from '@/lib/adminTourRequest';
import {
  countByTourRequestTab,
  getTourRequestDisplayLabelFromRequest,
  matchesTourRequestTab,
  normalizeTourRequestStatus,
  TourRequestDisplayLabel,
  TourRequestTab,
  tourRequestStatusBadgeClass,
  TOUR_REQUEST_STATUS,
} from '@/lib/tourRequestStatus';

interface TourRequest {
  id: number;
  possible_days: string[];
  possible_times: string[];
  date_options: string[] | null;
  max_students: number;
  food_drinks: string | null;
  age_restrictions: string;
  additional_requirements: string | null;
  created_at?: string;
  request_status: string;
}

function BulletedField({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="font-medium">{label}</p>
      <ul className="list-disc list-inside ml-2 text-gray-700 space-y-1">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ label }: { label: TourRequestDisplayLabel }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded border ${tourRequestStatusBadgeClass(label)}`}
    >
      {label}
    </span>
  );
}

function statusNote(status: string): string | null {
  switch (status) {
    case TOUR_REQUEST_STATUS.APPROVED:
      return 'This request has been approved by CES administrators.';
    case TOUR_REQUEST_STATUS.DISMISSED:
      return 'This request has been closed by CES administrators.';
    default:
      return null;
  }
}

function emptyTabMessage(tab: TourRequestTab): string {
  switch (tab) {
    case TOUR_REQUEST_STATUS.APPROVED:
      return 'No approved tour requests.';
    case TOUR_REQUEST_STATUS.DISMISSED:
      return 'No dismissed tour requests.';
    default:
      return 'No ongoing tour requests.';
  }
}

export default function CompanyTourRequestsPage() {
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [activeTab, setActiveTab] = useState<TourRequestTab>(TOUR_REQUEST_STATUS.ONGOING);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTourRequests = async () => {
      try {
        const response = await fetch('/api/company/tour-request');
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load tour requests');
        }
        const data = await response.json();
        setTourRequests(data.tourRequests || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tour requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadTourRequests();
  }, []);

  const filteredRequests = useMemo(
    () => tourRequests.filter((request) => matchesTourRequestTab(request, activeTab)),
    [tourRequests, activeTab]
  );

  const ongoingCount = useMemo(
    () => countByTourRequestTab(tourRequests, TOUR_REQUEST_STATUS.ONGOING),
    [tourRequests]
  );
  const approvedCount = useMemo(
    () => countByTourRequestTab(tourRequests, TOUR_REQUEST_STATUS.APPROVED),
    [tourRequests]
  );
  const dismissedCount = useMemo(
    () => countByTourRequestTab(tourRequests, TOUR_REQUEST_STATUS.DISMISSED),
    [tourRequests]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading tour requests...</p>
      </div>
    );
  }

  const hasAnyRequests = tourRequests.length > 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Tour Requests</h1>
            <p className="text-gray-600">
              View your submitted industry tour hosting requests.
            </p>
          </div>
          <Link
            href="/company/tour-request"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium text-center"
          >
            Create Tour Request
          </Link>
        </div>

        {hasAnyRequests && (
          <div className="flex flex-wrap gap-1 border-b border-gray-300 mb-8">
            <button
              type="button"
              onClick={() => setActiveTab(TOUR_REQUEST_STATUS.ONGOING)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === TOUR_REQUEST_STATUS.ONGOING
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Ongoing ({ongoingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TOUR_REQUEST_STATUS.APPROVED)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === TOUR_REQUEST_STATUS.APPROVED
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(TOUR_REQUEST_STATUS.DISMISSED)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === TOUR_REQUEST_STATUS.DISMISSED
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Dismissed ({dismissedCount})
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {!hasAnyRequests ? (
          <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
            <p className="text-gray-500 mb-4">You have not submitted any tour requests yet.</p>
            <Link
              href="/company/tour-request"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
            >
              Create Tour Request
            </Link>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
            <p className="text-gray-500">{emptyTabMessage(activeTab)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const status = normalizeTourRequestStatus(request.request_status);
              const label = getTourRequestDisplayLabelFromRequest(request);
              const note = statusNote(status);
              const canEdit = status === TOUR_REQUEST_STATUS.ONGOING;

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-lg border border-gray-300 p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">Tour Request</h2>
                        <StatusBadge label={label} />
                      </div>
                      {request.created_at && (
                        <p className="text-sm text-gray-500">
                          Submitted {formatTourRequestDateTime(request.created_at)}
                        </p>
                      )}
                      {note && <p className="text-sm text-gray-500">{note}</p>}
                    </div>
                    {canEdit && (
                      <Link
                        href={`/company/tour-request/${request.id}/edit`}
                        className="inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm text-center whitespace-nowrap"
                      >
                        Edit Tour Request
                      </Link>
                    )}
                  </div>
                  <div className="space-y-3 text-gray-700">
                    <p>
                      <span className="font-medium">Max students:</span> {request.max_students}
                    </p>
                    <BulletedField label="Possible days:" items={request.possible_days} />
                    <BulletedField label="Time frames:" items={request.possible_times} />
                    {request.date_options && request.date_options.length > 0 && (
                      <BulletedField
                        label="Specific dates:"
                        items={request.date_options.map(formatTourRequestDateTime)}
                      />
                    )}
                    <p>
                      <span className="font-medium">Age restrictions:</span>{' '}
                      {request.age_restrictions}
                    </p>
                    {request.food_drinks && (
                      <p>
                        <span className="font-medium">Food & drinks:</span> {request.food_drinks}
                      </p>
                    )}
                    {request.additional_requirements && (
                      <p>
                        <span className="font-medium">Additional requirements:</span>{' '}
                        {request.additional_requirements}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
