'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminProfile } from '@/lib/roles';
import AdminAccountProfileView from '@/components/admin/AdminAccountProfileView';
import { accountDetailTitle, AdminAccountDetail } from '@/lib/adminAccounts';

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded border ${
        isActive
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-gray-100 text-gray-600 border-gray-300'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function AdminAccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;
  const supabase = createClient();
  const [detail, setDetail] = useState<AdminAccountDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    const response = await fetch(`/api/admin/accounts/${accountId}`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to load account');
    }
    return response.json() as Promise<AdminAccountDetail>;
  }, [accountId]);

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
        const data = await loadDetail();
        setDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router, supabase.auth, loadDetail]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading account...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/admin/accounts"
            className="text-blue-600 hover:underline text-sm font-medium mb-6 inline-block"
          >
            ← Back to accounts
          </Link>
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded">
            {error ?? 'Account not found'}
          </div>
        </div>
      </div>
    );
  }

  const title = accountDetailTitle(detail);
  const listTab = detail.accountType;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin/accounts"
          className="text-blue-600 hover:underline text-sm font-medium mb-6 inline-block"
        >
          ← Back to accounts
        </Link>

        <div className="mb-8">
          <div className="flex flex-wrap items-start gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            <ActiveBadge isActive={detail.user.isActive} />
          </div>
          <p className="text-gray-600">
            {detail.user.userTypeTableLabel} account
            {detail.accountType === 'students' && detail.profile?.student_email
              ? ` · ${String(detail.profile.student_email)}`
              : null}
            {detail.accountType === 'companies' && detail.profile?.contact_email
              ? ` · ${String(detail.profile.contact_email)}`
              : null}
            {detail.accountType === 'admins' && detail.profile?.email
              ? ` · ${String(detail.profile.email)}`
              : null}
          </p>
          <Link
            href={`/admin/accounts?tab=${listTab}`}
            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
          >
            View all {listTab}
          </Link>
        </div>

        <AdminAccountProfileView detail={detail} />
      </div>
    </div>
  );
}
