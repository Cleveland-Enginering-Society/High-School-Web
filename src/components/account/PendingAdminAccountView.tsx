'use client';

import AccountStatusBanner from '@/components/account/AccountStatusBanner';
import { getAccountStatusInfo } from '@/lib/accountAccess';
import { formatAdminRequestDateTime } from '@/lib/adminRequest';

interface PendingAdminProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: number | null;
  created_at?: string;
  user_type_table?: number;
  is_active?: boolean;
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <p className="text-sm text-gray-700">
      <span className="font-medium text-gray-900">{label}: </span>
      {value}
    </p>
  );
}

export default function PendingAdminAccountView({ profile }: { profile: PendingAdminProfile }) {
  const status = getAccountStatusInfo(profile);

  return (
    <div className="max-w-xl">
      <AccountStatusBanner status={status} />

      <div className="border border-gray-300 rounded-lg p-5 bg-white shadow-sm space-y-2">
        <h3 className="text-md font-semibold text-gray-900 mb-3">Submitted information</h3>
        <DetailRow
          label="Name"
          value={[profile.first_name, profile.last_name].filter(Boolean).join(' ')}
        />
        <DetailRow label="Email" value={profile.email} />
        <DetailRow label="Phone" value={profile.phone} />
        {profile.created_at && (
          <DetailRow
            label="Submitted"
            value={formatAdminRequestDateTime(profile.created_at)}
          />
        )}
      </div>

      <p className="text-sm text-gray-600 mt-6">
        If you have not verified your email yet, check your inbox for the confirmation link from
        CES before signing in. After email verification, your request remains pending until a CES
        administrator approves it. Once approved, you will have full admin access here. If denied,
        you will no longer be able to sign in with this account.
      </p>
    </div>
  );
}
