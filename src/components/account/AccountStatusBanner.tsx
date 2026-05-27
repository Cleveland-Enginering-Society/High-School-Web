import { AccountStatusInfo } from '@/lib/accountAccess';

const VARIANT_STYLES = {
  pending_admin: 'bg-amber-50 border-amber-300 text-amber-950',
  inactive: 'bg-gray-100 border-gray-400 text-gray-800',
} as const;

export default function AccountStatusBanner({ status }: { status: AccountStatusInfo }) {
  if (!status.title || !status.message || !status.variant) return null;

  return (
    <div
      className={`mb-6 p-4 border rounded-lg ${VARIANT_STYLES[status.variant]}`}
      role="status"
    >
      <h2 className="text-lg font-semibold mb-2">{status.title}</h2>
      <p className="text-sm leading-relaxed">{status.message}</p>
    </div>
  );
}
