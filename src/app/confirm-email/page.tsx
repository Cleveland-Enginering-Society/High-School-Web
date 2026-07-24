<<<<<<< HEAD
'use client';

// Written by Evan Dan


import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
=======
import { Suspense } from 'react';
import ConfirmEmailContent from './ConfirmEmailContent';
>>>>>>> c76c35818e01109a1e1c196d4dcd9af8f48e3e02

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}