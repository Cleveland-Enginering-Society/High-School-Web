import { Suspense } from 'react';
import ConfirmEmailContent from './ConfirmEmailContent';

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}