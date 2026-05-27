'use client';

import { useParams } from 'next/navigation';
import CompanyTourRequestForm from '@/components/company/CompanyTourRequestForm';

export default function EditTourRequestPage() {
  const params = useParams();
  const tourRequestId = params.id as string;

  return <CompanyTourRequestForm tourRequestId={tourRequestId} />;
}
