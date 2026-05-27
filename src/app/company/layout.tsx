'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isCompanyProfile } from '@/lib/roles';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const response = await fetch('/api/account');
      if (!response.ok) {
        router.replace('/login');
        return;
      }

      const data = await response.json();
      if (!isCompanyProfile(data.user ?? {})) {
        router.replace('/');
        return;
      }

      setIsAuthorized(true);
    };

    checkAccess();
  }, [router, supabase.auth]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return children;
}
