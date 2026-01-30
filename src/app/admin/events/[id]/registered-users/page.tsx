'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface RegisteredUser {
  id: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  studentPhone: number | null;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: number | null;
  registeredParentName: string | null;
  registeredParentCompany: string | null;
  hasParentRegistered: boolean;
}

export default function RegisteredUsersPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const eventId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [eventName, setEventName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is admin
      try {
        const response = await fetch('/api/account');
        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        if (data.user?.user_type !== 2) {
          router.push('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
        return;
      }

      // Load event name and registered users
      await loadEventAndUsers();
    };

    checkAuthAndLoadData();
  }, [router, supabase.auth, eventId]);

  const loadEventAndUsers = async () => {
    try {
      // Load event name
      const eventResponse = await fetch('/api/events');
      if (eventResponse.ok) {
        const eventsData = await eventResponse.json();
        const event = eventsData.events?.find((e: any) => e.id === eventId);
        if (event) {
          setEventName(event.event_name);
        }
      }

      // Load registered users
      const usersResponse = await fetch(`/api/admin/events/${eventId}/registered-users`);
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        setError(errorData.error || 'Failed to load registered users');
        setIsLoading(false);
        return;
      }

      const usersData = await usersResponse.json();
      setRegisteredUsers(usersData.registeredUsers || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (phone: number | null): string => {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length === 10) {
      return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
    }
    return phoneStr;
  };

  const copyStudentEmails = async () => {
    const emails = registeredUsers
      .map((user) => user.studentEmail)
      .filter((email) => email)
      .join(', ');
    
    if (!emails) {
      setCopySuccess('No student emails to copy');
      setTimeout(() => setCopySuccess(null), 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(emails);
      setCopySuccess('Student emails copied to clipboard!');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      setCopySuccess('Failed to copy emails');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const copyParentEmails = async () => {
    const emails = registeredUsers
      .map((user) => user.parentEmail)
      .filter((email) => email)
      .join(', ');
    
    if (!emails) {
      setCopySuccess('No parent emails to copy');
      setTimeout(() => setCopySuccess(null), 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(emails);
      setCopySuccess('Parent emails copied to clipboard!');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      setCopySuccess('Failed to copy emails');
      setTimeout(() => setCopySuccess(null), 2000);
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/events"
            className="text-blue-600 hover:text-blue-700 underline mb-4 inline-block"
          >
            ← Back to Events
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">
            Registered Users{eventName && ` - ${eventName}`}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {copySuccess && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {copySuccess}
          </div>
        )}

        {registeredUsers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
            <p className="text-gray-500">No users registered for this event.</p>
          </div>
        ) : (
          <>
            {/* Copy Email Buttons */}
          <div className="mb-4 flex gap-4">
              <button
                onClick={copyStudentEmails}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Copy All Student Emails
              </button>
              <button
                onClick={copyParentEmails}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Copy All Parent Emails
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-300 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered Parent Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered Parent Company
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registeredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {user.studentFirstName} {user.studentLastName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {user.studentEmail || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatPhone(user.studentPhone) || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {user.parentFirstName || user.parentLastName
                          ? `${user.parentFirstName || ''} ${user.parentLastName || ''}`.trim()
                          : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {user.parentEmail || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatPhone(user.parentPhone) || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {user.registeredParentName || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {user.registeredParentCompany || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


