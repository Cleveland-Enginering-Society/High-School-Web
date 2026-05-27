'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminProfile } from '@/lib/roles';
import {
  AdminTourRequest,
  countByTourRequestTab,
  formatTourRequestDateTime,
  getCompanyFromTourRequest,
  getTourRequestDisplayLabelFromRequest,
  matchesTourRequestTab,
  normalizeTourRequestStatus,
  TourRequestDisplayLabel,
  TourRequestTab,
  tourRequestStatusBadgeClass,
  TOUR_REQUEST_STATUS,
} from '@/lib/adminTourRequest';

type ConfirmAction = 'approve' | 'dismiss' | 'undismiss';

const CONFIRM_STATUS: Record<ConfirmAction, string> = {
  approve: TOUR_REQUEST_STATUS.APPROVED,
  dismiss: TOUR_REQUEST_STATUS.DISMISSED,
  undismiss: TOUR_REQUEST_STATUS.ONGOING,
};

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

function getCompanyInfo(request: AdminTourRequest) {
  return getCompanyFromTourRequest(request);
}

function emptyTabMessage(tab: TourRequestTab): string {
  switch (tab) {
    case TOUR_REQUEST_STATUS.APPROVED:
      return 'No approved tour requests.';
    case TOUR_REQUEST_STATUS.DISMISSED:
      return 'No dismissed tour requests.';
    default:
      return 'No ongoing tour requests at this time.';
  }
}

export default function AdminTourRequestsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tourRequests, setTourRequests] = useState<AdminTourRequest[]>([]);
  const [activeTab, setActiveTab] = useState<TourRequestTab>(TOUR_REQUEST_STATUS.ONGOING);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminTourRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const loadTourRequests = useCallback(async () => {
    const response = await fetch('/api/admin/tour-requests');
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to load tour requests');
    }
    const data = await response.json();
    setTourRequests(data.tourRequests || []);
  }, []);

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
      if (!isAdminProfile(accountData.user ?? {})) {
        router.push('/');
        return;
      }

      try {
        await loadTourRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tour requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router, supabase.auth, loadTourRequests]);

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

  const openConfirm = (request: AdminTourRequest, action: ConfirmAction) => {
    setConfirmError(null);
    setConfirmTarget(request);
    setConfirmAction(action);
  };

  const closeConfirm = () => {
    if (!isUpdatingStatus) {
      setConfirmTarget(null);
      setConfirmAction(null);
      setConfirmError(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || !confirmAction) return;

    const nextStatus = CONFIRM_STATUS[confirmAction];
    setIsUpdatingStatus(true);
    setConfirmError(null);

    try {
      const response = await fetch(`/api/admin/tour-requests/${confirmTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_status: nextStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tour request');
      }

      setTourRequests((prev) =>
        prev.map((r) =>
          r.id === confirmTarget.id ? { ...r, request_status: nextStatus } : r
        )
      );
      setConfirmTarget(null);
      setConfirmAction(null);
      setConfirmError(null);
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : 'Failed to update tour request'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading tour requests...</p>
      </div>
    );
  }

  const confirmCompanyName =
    getCompanyInfo(confirmTarget ?? ({} as AdminTourRequest))?.company_name ??
    'this tour request';

  const confirmCopy = (() => {
    switch (confirmAction) {
      case 'approve':
        return {
          title: 'Approve tour request?',
          body: (
            <>
              This will approve the tour request for{' '}
              <span className="font-medium">{confirmCompanyName}</span> and move it to the
              Approved tab.
            </>
          ),
          confirmLabel: 'Approve',
          loadingLabel: 'Approving...',
          buttonClass: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'dismiss':
        return {
          title: 'Dismiss tour request?',
          body: (
            <>
              This will dismiss the tour request for{' '}
              <span className="font-medium">{confirmCompanyName}</span> and move it to the
              Dismissed tab.
            </>
          ),
          confirmLabel: 'Dismiss',
          loadingLabel: 'Dismissing...',
          buttonClass: 'bg-red-600 hover:bg-red-700',
        };
      case 'undismiss':
        return {
          title: 'Restore tour request?',
          body: (
            <>
              This will restore the tour request for{' '}
              <span className="font-medium">{confirmCompanyName}</span> to the Ongoing tab.
            </>
          ),
          confirmLabel: 'Restore',
          loadingLabel: 'Restoring...',
          buttonClass: 'bg-blue-600 hover:bg-blue-700',
        };
      default:
        return null;
    }
  })();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Tour Requests</h1>
          <p className="text-gray-600">
            Review industry tour hosting requests submitted by companies.
          </p>
        </div>

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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
            <p className="text-gray-500">{emptyTabMessage(activeTab)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const company = getCompanyInfo(request);
              const label = getTourRequestDisplayLabelFromRequest(request);
              const status = normalizeTourRequestStatus(request.request_status);

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-lg border border-gray-300 p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">
                          {company?.company_name ?? 'Unknown Company'}
                        </h2>
                        <StatusBadge label={label} />
                      </div>
                      {request.created_at && (
                        <p className="text-sm text-gray-500">
                          Submitted {formatTourRequestDateTime(request.created_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                      <Link
                        href={`/admin/events/create?tourRequestId=${request.id}`}
                        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm text-center whitespace-nowrap"
                      >
                        Create Event
                      </Link>
                      {status === TOUR_REQUEST_STATUS.ONGOING && (
                        <>
                          <button
                            type="button"
                            onClick={() => openConfirm(request, 'approve')}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openConfirm(request, 'dismiss')}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm whitespace-nowrap"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {status === TOUR_REQUEST_STATUS.APPROVED && (
                        <button
                          type="button"
                          onClick={() => openConfirm(request, 'dismiss')}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm whitespace-nowrap"
                        >
                          Dismiss
                        </button>
                      )}
                      {status === TOUR_REQUEST_STATUS.DISMISSED && (
                        <button
                          type="button"
                          onClick={() => openConfirm(request, 'undismiss')}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm whitespace-nowrap"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>

                  {company && (
                    <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200 space-y-2 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Industry:</span>{' '}
                        {company.industry || '—'}
                      </p>
                      <p>
                        <span className="font-medium">Location:</span>{' '}
                        {company.company_location || '—'}
                      </p>
                      <p>
                        <span className="font-medium">Main contact:</span>{' '}
                        {company.contact_first_name} {company.contact_last_name} ·{' '}
                        {company.contact_email}
                        {company.contact_phone ? ` · ${company.contact_phone}` : ''}
                      </p>
                      {(company.secondary_first_name || company.secondary_email) && (
                        <p>
                          <span className="font-medium">Secondary contact:</span>{' '}
                          {[company.secondary_first_name, company.secondary_last_name]
                            .filter(Boolean)
                            .join(' ')}
                          {company.secondary_email ? ` · ${company.secondary_email}` : ''}
                          {company.secondary_phone ? ` · ${company.secondary_phone}` : ''}
                        </p>
                      )}
                    </div>
                  )}

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

      {confirmTarget && confirmAction && confirmCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className="bg-white rounded-lg border border-gray-300 shadow-lg max-w-md w-full p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <h2 id="confirm-dialog-title" className="text-lg font-semibold mb-2">
              {confirmCopy.title}
            </h2>
            <p className="text-gray-600 mb-4">{confirmCopy.body}</p>
            {confirmError && (
              <p className="mb-4 text-sm text-red-600">{confirmError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={isUpdatingStatus}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isUpdatingStatus}
                className={`px-4 py-2 text-white rounded disabled:opacity-50 ${confirmCopy.buttonClass}`}
              >
                {isUpdatingStatus ? confirmCopy.loadingLabel : confirmCopy.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
