'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminProfile } from '@/lib/roles';
import {
  AdminRequestRecord,
  formatAdminRequestDateTime,
  formatAdminRequestName,
} from '@/lib/adminRequest';

type ConfirmAction = 'approve' | 'deny';

export default function AdminRequestsReviewPage() {
  const router = useRouter();
  const supabase = createClient();
  const [requests, setRequests] = useState<AdminRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminRequestRecord | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [actionWarning, setActionWarning] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    const response = await fetch('/api/admin/admin-requests');
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to load admin requests');
    }
    const data = await response.json();
    setRequests(data.adminRequests || []);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
        setError(null);
        await loadRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router, supabase.auth, loadRequests]);

  const closeConfirm = () => {
    if (!isUpdating) {
      setConfirmTarget(null);
      setConfirmAction(null);
      setConfirmError(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || !confirmAction) return;

    setIsUpdating(true);
    setConfirmError(null);
    setActionWarning(null);

    try {
      const response = await fetch(`/api/admin/admin-requests/${confirmTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmAction }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update admin request');
      }

      if (data.warning) {
        setActionWarning(data.warning);
      }

      setRequests((prev) => prev.filter((r) => r.id !== confirmTarget.id));
      setConfirmTarget(null);
      setConfirmAction(null);
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : 'Failed to update admin request'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading admin requests...</p>
      </div>
    );
  }

  const confirmName = confirmTarget ? formatAdminRequestName(confirmTarget) : '';

  const confirmCopy =
    confirmAction === 'approve'
      ? {
          title: 'Approve admin request?',
          body: (
            <>
              This will grant CES admin access to{' '}
              <span className="font-medium">{confirmName}</span> ({confirmTarget?.email}).
            </>
          ),
          confirmLabel: 'Approve',
          loadingLabel: 'Approving...',
          buttonClass: 'bg-blue-600 hover:bg-blue-700',
        }
      : confirmAction === 'deny'
        ? {
            title: 'Deny admin request?',
            body: (
              <>
                This will remove the pending request for{' '}
                <span className="font-medium">{confirmName}</span> and revoke their ability to
                become an admin through this request.
              </>
            ),
            confirmLabel: 'Deny',
            loadingLabel: 'Denying...',
            buttonClass: 'bg-red-600 hover:bg-red-700',
          }
        : null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">New Admin Requests</h1>
            <p className="text-gray-600">
              Review and approve or deny requests for new CES admin accounts.
            </p>
          </div>
          <Link
            href="/admin/new-admin-request"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium text-center"
          >
            Request New Admin
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
            {error}
          </div>
        )}
        {actionWarning && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded">
            {actionWarning}
          </div>
        )}

        {requests.length === 0 ? (
          <p className="text-gray-600">No pending admin requests at this time.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-300 rounded-lg p-4 md:p-5 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <h2 className="text-lg font-semibold">{formatAdminRequestName(request)}</h2>
                  <span className="text-xs text-gray-500">
                    Submitted {formatAdminRequestDateTime(request.created_at)}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700 mb-4">
                  <p>
                    <span className="font-medium text-gray-900">Email: </span>
                    {request.email}
                  </p>
                  {request.phone != null && (
                    <p>
                      <span className="font-medium text-gray-900">Phone: </span>
                      {request.phone}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmTarget(request);
                      setConfirmAction('approve');
                      setConfirmError(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmTarget(request);
                      setConfirmAction('deny');
                      setConfirmError(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmTarget && confirmCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-3">{confirmCopy.title}</h3>
            <p className="text-gray-700 mb-4">{confirmCopy.body}</p>
            {confirmError && (
              <p className="text-red-600 text-sm mb-3">{confirmError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={isUpdating}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isUpdating}
                className={`px-4 py-2 text-white rounded disabled:opacity-50 ${confirmCopy.buttonClass}`}
              >
                {isUpdating ? confirmCopy.loadingLabel : confirmCopy.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
