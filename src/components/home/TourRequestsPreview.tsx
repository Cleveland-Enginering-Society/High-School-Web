'use client';

// Written by Evan Dan


import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isCompanyProfile } from '@/lib/roles';
import { formatTourRequestDateTime } from '@/lib/adminTourRequest';
import {
  getTourRequestDisplayLabelFromRequest,
  normalizeTourRequestStatus,
  tourRequestStatusBadgeClass,
  TOUR_REQUEST_STATUS,
} from '@/lib/tourRequestStatus';

interface TourRequest {
  id: number;
  date_options: string[] | null;
  max_students: number;
  request_status: string;
  created_at?: string;
}

export default function TourRequestsPreview() {
  const supabase = createClient();
  const [isCompany, setIsCompany] = useState(false);
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const accountResponse = await fetch('/api/account');
        if (!accountResponse.ok) return;

        const accountData = await accountResponse.json();
        if (!isCompanyProfile(accountData.user ?? {})) return;

        setIsCompany(true);

        const response = await fetch('/api/company/tour-request');
        if (!response.ok) return;

        const data = await response.json();
        const ongoing = (data.tourRequests || []).filter(
          (request: TourRequest) =>
            normalizeTourRequestStatus(request.request_status) === TOUR_REQUEST_STATUS.ONGOING
        );
        setTourRequests(ongoing.slice(0, 3));
      } catch (err) {
        console.error('Failed to load tour request preview', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [supabase.auth]);

  if (loading || !isCompany) return null;

  return (
    <section className="w-full py-16 md:py-20 bg-gray-50 border-y border-gray-200">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-[#00539eff] text-3xl md:text-4xl font-bold tracking-wide">
              YOUR TOUR REQUESTS
            </h2>
            <p className="text-gray-600 mt-2">
              Track ongoing industry tour hosting requests from your company account.
            </p>
          </div>
          <Link
            href="/company/tour-request"
            className="inline-block px-5 py-2.5 bg-[#00539eff] text-white rounded font-semibold hover:bg-[#004080] transition-colors text-center self-start"
          >
            Create Tour Request
          </Link>
        </div>

        {tourRequests.length === 0 ? (
          <div className="border border-gray-200 rounded-lg bg-white p-8 text-center">
            <p className="text-gray-600 mb-4">You don&apos;t have any ongoing tour requests.</p>
            <Link
              href="/company/tour-request"
              className="text-[#00539eff] font-semibold hover:underline"
            >
              Submit a tour request →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white overflow-hidden">
            {tourRequests.map((request) => {
              const label = getTourRequestDisplayLabelFromRequest(request);
              const firstDate = request.date_options?.[0];
              return (
                <Link
                  key={request.id}
                  href="/company/tour-requests"
                  className="block p-5 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tour Request #{request.id}
                    </h3>
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded border ${tourRequestStatusBadgeClass(label)}`}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {request.created_at && (
                      <>Submitted {formatTourRequestDateTime(request.created_at)} · </>
                    )}
                    Max students: {request.max_students}
                    {firstDate && (
                      <> · Preferred date: {formatTourRequestDateTime(firstDate)}</>
                    )}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-right">
          <Link
            href="/company/tour-requests"
            className="text-[#00539eff] font-semibold hover:underline"
          >
            View all tour requests →
          </Link>
        </div>
      </div>
    </section>
  );
}
