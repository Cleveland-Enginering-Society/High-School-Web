'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminProfile } from '@/lib/roles';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: number | undefined;
  password: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export default function NewAdminRequestPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: undefined,
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const checkAccess = async () => {
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

      setIsLoading(false);
    };

    checkAccess();
  }, [router, supabase.auth]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.phone !== undefined) {
      const len = formData.phone.toString().length;
      if (len < 10 || len > 12) {
        newErrors.phone = 'Phone number must be between 10 and 12 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/admin-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.error || 'Failed to submit admin request');
      }

      setSubmitSuccess(
        data.message ||
          'Admin account request submitted. Another admin can approve it under New Admin Requests.'
      );
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: undefined,
        password: '',
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <Link
          href="/admin/admin-requests"
          className="text-blue-600 hover:underline text-sm font-medium mb-6 inline-block"
        >
          ← New Admin Requests
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">Request New Admin Account</h1>
        <p className="text-gray-600 mb-8">
          Submit a new CES admin account for approval. Set their initial password below and share
          it securely. They will receive a verification email and must confirm it before they can
          sign in. After that, their request stays pending until another admin approves it.
        </p>

        {submitError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded">
            {submitSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="firstName">
              First name *
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="lastName">
              Last name *
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone ?? ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  phone: e.target.value === '' ? undefined : Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Initial password *
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Share this securely with the applicant after they verify their email. They can change
              it later from account settings once approved.
            </p>
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for approval'}
          </button>
        </form>
      </div>
    </div>
  );
}
