'use client';

import {
  AdminAccountDetail,
  formatProfileFieldValue,
  profileFieldLabel,
  profileSectionsForType,
} from '@/lib/adminAccounts';

function ProfileField({ label, value }: { label: string; value: string }) {
  const isLongText =
    label.toLowerCase().includes('signature') || value.length > 80;

  return (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-900">{label}</dt>
      <dd
        className={`mt-1 text-sm text-gray-700 ${isLongText ? 'whitespace-pre-wrap break-words font-mono text-xs' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function AdminAccountProfileView({ detail }: { detail: AdminAccountDetail }) {
  const sections = profileSectionsForType(detail.accountType);

  return (
    <div className="space-y-8">
      <section className="border border-gray-300 rounded-lg p-4 md:p-6 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <dl>
          <ProfileField label="Account ID" value={detail.user.id} />
          <ProfileField label="Account type" value={detail.user.userTypeTableLabel} />
          <ProfileField
            label="Active"
            value={formatProfileFieldValue('is_active', detail.user.isActive)}
          />
        </dl>
      </section>

      {sections.map((section) => (
        <section
          key={section.title}
          className="border border-gray-300 rounded-lg p-4 md:p-6 bg-white shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
          <dl>
            {section.keys.map((key) => (
              <ProfileField
                key={key}
                label={profileFieldLabel(key)}
                value={formatProfileFieldValue(key, detail.profile[key])}
              />
            ))}
          </dl>
        </section>
      ))}

      {(() => {
        const knownKeys = new Set(sections.flatMap((s) => s.keys));
        const extraKeys = Object.keys(detail.profile)
          .filter((key) => !knownKeys.has(key))
          .sort();
        if (extraKeys.length === 0) return null;
        return (
          <section className="border border-gray-300 rounded-lg p-4 md:p-6 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Additional fields</h2>
            <dl>
              {extraKeys.map((key) => (
                <ProfileField
                  key={key}
                  label={profileFieldLabel(key)}
                  value={formatProfileFieldValue(key, detail.profile[key])}
                />
              ))}
            </dl>
          </section>
        );
      })()}
    </div>
  );
}
