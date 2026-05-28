'use client';

// Written by Evan Dan


import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { isAdminProfile, isCompanyProfile } from '@/lib/roles';
import {
  getAccountStatusInfo,
  getEventSignupBlockedMessage,
  isEventSignupDisabled,
} from '@/lib/accountAccess';
import AccountStatusBanner from '@/components/account/AccountStatusBanner';
import {
  countByEventTab,
  emptyEventTabMessage,
  EVENT_STATUS,
  EventDisplayLabel,
  eventStatusBadgeClass,
  EventTab,
  getEventDisplayLabelFromEvent,
  matchesEventTab,
  normalizeEventStatus,
  PublicEventTab,
} from '@/lib/eventStatus';

interface Event {
  id: string;
  event_name: string;
  event_start_time: string;
  event_end_time: string | null;
  event_location: string;
  event_description: string;
  max_users: number;
  max_parents: number;
  event_waiver_info: string;
  event_waiver_parent: string | null;
  registered_list: string[];
  parent_list: string[];
  status?: string | null;
}

type ConfirmAction = 'markPast' | 'markOngoing' | 'dismiss';

const CONFIRM_STATUS: Record<ConfirmAction, EventTab> = {
  markPast: EVENT_STATUS.PAST,
  markOngoing: EVENT_STATUS.ONGOING,
  dismiss: EVENT_STATUS.DISMISSED,
};

function StatusBadge({ label }: { label: EventDisplayLabel }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded border ${eventStatusBadgeClass(label)}`}
    >
      {label}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone,
  });
}

export default function EventsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<EventTab>(EVENT_STATUS.ONGOING);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompany, setIsCompany] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventSignupDisabled, setEventSignupDisabled] = useState(false);
  const [accountStatus, setAccountStatus] = useState(getAccountStatusInfo({}));
  const [accountAccessFields, setAccountAccessFields] = useState<{
    user_type_table?: number;
    is_active?: boolean;
  }>({});
  const [confirmTarget, setConfirmTarget] = useState<Event | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to load events');
      }
      const data = await response.json();
      setEvents(data.events || []);
      if (typeof data.isAdmin === 'boolean') {
        setIsAdmin(data.isAdmin);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuthAndLoadEvents = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      if (user) {
        setUserId(user.id);
        try {
          const response = await fetch('/api/account');
          if (response.ok) {
            const data = await response.json();
            const profile = data.user ?? {};
            setIsAdmin(isAdminProfile(profile));
            setIsCompany(isCompanyProfile(profile));
            const access = {
              user_type_table: profile.user_type_table as number | undefined,
              is_active: profile.is_active as boolean | undefined,
            };
            setAccountAccessFields(access);
            setEventSignupDisabled(
              data.eventSignupDisabled ?? isEventSignupDisabled(access)
            );
            setAccountStatus(data.accountStatus ?? getAccountStatusInfo(access));
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      } else {
        setUserId(null);
      }

      await loadEvents();
    };

    checkAuthAndLoadEvents();
  }, [supabase.auth, loadEvents]);

  useEffect(() => {
    if (!isAdmin && activeTab === EVENT_STATUS.DISMISSED) {
      setActiveTab(EVENT_STATUS.ONGOING);
    }
  }, [isAdmin, activeTab]);

  const filteredEvents = useMemo(
    () => events.filter((event) => matchesEventTab(event, activeTab)),
    [events, activeTab]
  );

  const ongoingCount = useMemo(
    () => countByEventTab(events, EVENT_STATUS.ONGOING),
    [events]
  );
  const pastCount = useMemo(
    () => countByEventTab(events, EVENT_STATUS.PAST),
    [events]
  );
  const dismissedCount = useMemo(
    () => countByEventTab(events, EVENT_STATUS.DISMISSED),
    [events]
  );

  const getOpenSpaces = (event: Event) => {
    const registeredCount = event.registered_list?.length || 0;
    return event.max_users - registeredCount;
  };

  const getOpenParentSpaces = (event: Event) => {
    const parentCount = event.parent_list?.length || 0;
    return (event.max_parents || 0) - parentCount;
  };

  const handleSignup = (eventId: string) => {
    router.push(`/events/${eventId}/signup`);
  };

  const openConfirm = (event: Event, action: ConfirmAction) => {
    setConfirmTarget(event);
    setConfirmAction(action);
    setConfirmError(null);
  };

  const closeConfirm = () => {
    if (!isUpdatingStatus) {
      setConfirmTarget(null);
      setConfirmAction(null);
      setConfirmError(null);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmTarget || !confirmAction) return;

    const nextStatus = CONFIRM_STATUS[confirmAction];
    setIsUpdatingStatus(true);
    setConfirmError(null);
    setStatusError(null);

    try {
      const response = await fetch(`/api/admin/events/${confirmTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event status');
      }

      setEvents((prev) =>
        prev.map((e) =>
          e.id === confirmTarget.id ? { ...e, status: nextStatus } : e
        )
      );
      setConfirmTarget(null);
      setConfirmAction(null);
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : 'Failed to update event status'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const confirmCopy = (() => {
    const name = confirmTarget?.event_name ?? 'this event';
    switch (confirmAction) {
      case 'markPast':
        return {
          title: 'Mark event as past?',
          body: (
            <>
              This will move <span className="font-medium">{name}</span> to the Past tab. It
              will remain visible but new signups will be disabled.
            </>
          ),
          confirmLabel: 'Mark Past',
          loadingLabel: 'Updating...',
          buttonClass: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'markOngoing':
        return {
          title: 'Restore event to ongoing?',
          body: (
            <>
              This will move <span className="font-medium">{name}</span> back to the Ongoing
              tab.
            </>
          ),
          confirmLabel: 'Mark Ongoing',
          loadingLabel: 'Updating...',
          buttonClass: 'bg-green-600 hover:bg-green-700',
        };
      case 'dismiss':
        return {
          title: 'Dismiss event?',
          body: (
            <>
              This will dismiss <span className="font-medium">{name}</span>. It will be hidden
              from regular users.
            </>
          ),
          confirmLabel: 'Dismiss',
          loadingLabel: 'Dismissing...',
          buttonClass: 'bg-red-600 hover:bg-red-700',
        };
      default:
        return null;
    }
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading events...</p>
      </div>
    );
  }

  const publicTab = (tab: PublicEventTab, label: string, count: number) => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        activeTab === tab
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Events</h1>
          {isAdmin && (
            <Link
              href="/admin/events/create"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Create Event
            </Link>
          )}
          {isCompany && (
            <Link
              href="/company/tour-request"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Create Tour Request
            </Link>
          )}
        </div>

        {isAuthenticated && eventSignupDisabled && (
          accountStatus.variant ? (
            <AccountStatusBanner
              status={{
                ...accountStatus,
                message:
                  getEventSignupBlockedMessage(accountAccessFields) ??
                  accountStatus.message,
              }}
            />
          ) : getEventSignupBlockedMessage(accountAccessFields) ? (
            <div
              className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg"
              role="status"
            >
              <p className="text-sm leading-relaxed">
                {getEventSignupBlockedMessage(accountAccessFields)}
              </p>
            </div>
          ) : null
        )}

        {statusError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
            {statusError}
          </div>
        )}

        <div className="flex flex-wrap gap-1 border-b border-gray-300 mb-8">
          {publicTab(EVENT_STATUS.ONGOING, 'Ongoing', ongoingCount)}
          {publicTab(EVENT_STATUS.PAST, 'Past', pastCount)}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab(EVENT_STATUS.DISMISSED)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === EVENT_STATUS.DISMISSED
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Dismissed ({dismissedCount})
            </button>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
            <p className="text-gray-500">{emptyEventTabMessage(activeTab, isAdmin)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const openSpaces = getOpenSpaces(event);
              const openParentSpaces = getOpenParentSpaces(event);
              const isRegistered = userId
                ? event.registered_list?.includes(userId) || false
                : false;
              const status = normalizeEventStatus(event.status);
              const label = getEventDisplayLabelFromEvent(event);
              const isOngoing = status === EVENT_STATUS.ONGOING;
              const canOpenEventPage =
                isRegistered || isOngoing || status === EVENT_STATUS.PAST;
              const signupBlockedForOngoing =
                isAuthenticated &&
                !isRegistered &&
                isOngoing &&
                !eventSignupDisabled &&
                openSpaces === 0;

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-lg border border-gray-300 p-6 flex flex-col"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <h2 className="text-xl font-semibold">{event.event_name}</h2>
                    <StatusBadge label={label} />
                  </div>

                  <div className="space-y-2 mb-4 flex-1">
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span>{' '}
                      {formatDate(event.event_start_time)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Time:</span>{' '}
                      {formatTime(event.event_start_time)}
                      {event.event_end_time && ` - ${formatTime(event.event_end_time)}`}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span> {event.event_location}
                    </p>
                    {isOngoing && (
                      <>
                        <p className="text-gray-600">
                          <span className="font-medium">Open Student Spaces:</span>{' '}
                          <span
                            className={
                              openSpaces > 0
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {openSpaces}
                          </span>
                        </p>
                        {event.max_parents > 0 && (
                          <p className="text-gray-600">
                            <span className="font-medium">Open Parent Spaces:</span>{' '}
                            <span
                              className={
                                openParentSpaces > 0
                                  ? 'text-green-600 font-semibold'
                                  : 'text-red-600 font-semibold'
                              }
                            >
                              {openParentSpaces}
                            </span>
                          </p>
                        )}
                      </>
                    )}
                    {isRegistered && (
                      <p className="text-blue-600 font-semibold">Registered</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    <button
                      onClick={() => handleSignup(event.id)}
                      disabled={!canOpenEventPage || signupBlockedForOngoing}
                      className={`w-full px-4 py-2 rounded transition-colors ${
                        signupBlockedForOngoing
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : canOpenEventPage
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isAuthenticated
                        ? isRegistered || !isOngoing || eventSignupDisabled
                          ? 'View Details'
                          : openSpaces > 0
                            ? 'Signup'
                            : 'Full'
                        : isOngoing || status === EVENT_STATUS.PAST
                          ? 'View Details'
                          : 'Unavailable'}
                    </button>

                    {isAdmin && (
                      <>
                        <Link
                          href={`/admin/events/${event.id}/registered-users`}
                          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-center"
                        >
                          Registered Users
                        </Link>
                        <Link
                          href={`/admin/events/edit/${event.id}`}
                          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-center"
                        >
                          Edit Event
                        </Link>
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                          {status === EVENT_STATUS.ONGOING && (
                            <>
                              <button
                                type="button"
                                onClick={() => openConfirm(event, 'markPast')}
                                className="flex-1 min-w-[7rem] px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                Mark Past
                              </button>
                              <button
                                type="button"
                                onClick={() => openConfirm(event, 'dismiss')}
                                className="flex-1 min-w-[7rem] px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                          {status === EVENT_STATUS.PAST && (
                            <>
                              <button
                                type="button"
                                onClick={() => openConfirm(event, 'markOngoing')}
                                className="flex-1 min-w-[7rem] px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                              >
                                Mark Ongoing
                              </button>
                              <button
                                type="button"
                                onClick={() => openConfirm(event, 'dismiss')}
                                className="flex-1 min-w-[7rem] px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                          {status === EVENT_STATUS.DISMISSED && (
                            <button
                              type="button"
                              onClick={() => openConfirm(event, 'markOngoing')}
                              className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmTarget && confirmAction && confirmCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            role="dialog"
            aria-labelledby="event-status-dialog-title"
          >
            <h2 id="event-status-dialog-title" className="text-lg font-semibold mb-2">
              {confirmCopy.title}
            </h2>
            <p className="text-gray-600 mb-4">{confirmCopy.body}</p>
            {confirmError && (
              <p className="mb-4 text-sm text-red-600">{confirmError}</p>
            )}
            <div className="flex gap-3 justify-end">
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
                onClick={handleConfirmStatusChange}
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
