'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Event {
  id: string;
  event_name: string;
  event_time: string;
  event_location: string;
  event_description: string;
  max_users: number;
  max_parents: number;
  event_waiver_info: string;
  event_waiver_parent: string | null;
  registered_list: string[];
  parent_list: string[];
}

export default function EventsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndLoadEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        setUserId(user.id);
        // Check if user is admin
        try {
          const response = await fetch('/api/account');
          if (response.ok) {
            const data = await response.json();
            setIsAdmin(data.user?.user_type === 2);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      } else {
        setUserId(null);
      }
      loadEvents();
    };

    checkAuthAndLoadEvents();
  }, [supabase.auth]);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to load events');
      }
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: timeZone,
    });
  };

  const getOpenSpaces = (event: Event) => {
    const registeredCount = event.registered_list?.length || 0;
    return event.max_users - registeredCount;
  };

  const getOpenParentSpaces = (event: Event) => {
    const parentCount = event.parent_list?.length || 0;
    return (event.max_parents || 0) - parentCount;
  };

  const handleSignup = (eventId: string) => {
    router.push(`/events/${eventId}/signup`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Events</h1>
          {isAdmin && (
            <Link
              href="/admin/events/create"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Create Event
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
            <p className="text-gray-500">No events available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const openSpaces = getOpenSpaces(event);
              const openParentSpaces = getOpenParentSpaces(event);
              const isRegistered = userId ? (event.registered_list?.includes(userId) || false) : false;
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-lg border border-gray-300 p-6 flex flex-col"
                >
                  <h2 className="text-xl font-semibold mb-3">{event.event_name}</h2>
                  
                  <div className="space-y-2 mb-4 flex-1">
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span> {formatDate(event.event_time)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Time:</span> {formatTime(event.event_time)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span> {event.event_location}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Open Student Spaces:</span>{' '}
                      <span className={openSpaces > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {openSpaces}
                      </span>
                    </p>
                    {event.max_parents > 0 && (
                      <p className="text-gray-600">
                        <span className="font-medium">Open Parent Spaces:</span>{' '}
                        <span className={openParentSpaces > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {openParentSpaces}
                        </span>
                      </p>
                    )}
                    {isRegistered && (
                      <p className="text-blue-600 font-semibold">
                        Registered
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    <button
                      onClick={() => handleSignup(event.id)}
                      disabled={!isAuthenticated && openSpaces === 0}
                      className={`w-full px-4 py-2 rounded transition-colors ${
                        openSpaces > 0
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-red-200 text-red-700'
                      }`}
                    >
                      {isAuthenticated 
                        ? (isRegistered 
                          ? 'View Details'
                          : (openSpaces > 0 ? 'Signup' : 'Full'))
                        : 'View Details'}
                    </button>
                    
                    {isAdmin && (
                      <>
                        <Link
                          href={`/admin/events/${event.id}/registered-users`}
                          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-center"
                        >
                          Registered Users
                        </Link>
                        <Link
                          href={`/admin/events/edit/${event.id}`}
                          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-center"
                        >
                          Edit Event
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

