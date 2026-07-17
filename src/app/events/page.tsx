'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { isAdminProfile, isCompanyProfile } from '@/lib/roles';
import {
  getAccountStatusInfo,
  getEventSignupBlockedMessage,
  isEventSignupDisabled,
} from '@/lib/accountAccess';
import AccountStatusBanner from '@/components/account/AccountStatusBanner';

interface Event {
  id: string;
  event_name: string;
  event_start_time: string;
  event_end_time: string | null;
  event_location: string;
  event_description: string;
  max_users: number;
  max_parents: number;
  event_waiver_info: string;
  event_waiver_parent: string | null;
  registered_list: string[];
  parent_list: string[];
}

interface EventPicture {
  id: string;
  name: string;
  image_url: string;
  created_at?: string;
  sort_order?: number;
}

export default function EventsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompany, setIsCompany] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventSignupDisabled, setEventSignupDisabled] = useState(false);
  const [activeView, setActiveView] = useState<'events' | 'pictures'>('events');
  const [pictures, setPictures] = useState<EventPicture[]>([]);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [draggedPictureId, setDraggedPictureId] = useState<string | null>(null);
  const [dragOverPictureId, setDragOverPictureId] = useState<string | null>(null);
  const [pictureSearch, setPictureSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountStatus, setAccountStatus] = useState(getAccountStatusInfo({}));
  const [accountAccessFields, setAccountAccessFields] = useState<{
    user_type_table?: number;
    is_active?: boolean;
  }>({});

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
            const user = data.user ?? {};
            setIsAdmin(isAdminProfile(user));
            setIsCompany(isCompanyProfile(user));
            const access = {
              user_type_table: user.user_type_table as number | undefined,
              is_active: user.is_active as boolean | undefined,
            };
            setAccountAccessFields(access);
            setEventSignupDisabled(
              data.eventSignupDisabled ?? isEventSignupDisabled(access)
            );
            setAccountStatus(data.accountStatus ?? getAccountStatusInfo(access));
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      } else {
        setUserId(null);
      }
      loadEvents();
      loadPictures();
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

  const loadPictures = async () => {
    try {
      const { data, error } = await supabase.from('EventPictures').select('*').order('sort_order', { ascending: true, nullsFirst: true }).order('created_at', { ascending: false });
      if (error) {
        throw error;
      }
      setPictures((data || []) as EventPicture[]);
    } catch (error) {
      console.error('Error loading pictures:', error);
    }
  };

  const handleUploadPicture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isAdmin) {
      alert('Only admins can upload pictures.');
      event.target.value = '';
      return;
    }

    const caption = window.prompt('Enter a name for this picture:', file.name.replace(/\.[^/.]+$/, ''))?.trim();
    if (!caption) {
      event.target.value = '';
      return;
    }

    try {
      setIsUploadingPicture(true);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `event-pictures/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const bucketCandidates = ['public', 'event-pictures'];
      let uploadResult: { bucket: string; path: string } | null = null;
      let lastError: Error | null = null;

      for (const bucketName of bucketCandidates) {
        const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

        if (!error) {
          uploadResult = { bucket: bucketName, path: filePath };
          break;
        }

        lastError = error;
      }

      if (!uploadResult) {
        throw lastError || new Error('Failed to upload picture');
      }

      const { data: publicUrlData } = supabase.storage.from(uploadResult.bucket).getPublicUrl(uploadResult.path);
      const { data, error: insertError } = await supabase
        .from('EventPictures')
        .insert([{ name: caption, image_url: publicUrlData.publicUrl }])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setPictures((prevPictures) => [data as EventPicture, ...prevPictures]);
    } catch (error) {
      console.error('Error uploading picture:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload picture');
    } finally {
      setIsUploadingPicture(false);
      event.target.value = '';
    }
  };

  const handleEditPicture = async (picture: EventPicture) => {
    if (!isAdmin) {
      return;
    }

    const updatedName = window.prompt('Enter a new name for this picture:', picture.name)?.trim();
    if (!updatedName || updatedName === picture.name) {
      return;
    }

    try {
      const { error } = await supabase
        .from('EventPictures')
        .update({ name: updatedName })
        .eq('id', picture.id);

      if (error) {
        throw error;
      }

      setPictures((prevPictures) =>
        prevPictures.map((item) => (item.id === picture.id ? { ...item, name: updatedName } : item))
      );
    } catch (error) {
      console.error('Error editing picture name:', error);
      alert(error instanceof Error ? error.message : 'Failed to update picture name');
    }
  };

  const handleDeletePicture = async (picture: EventPicture) => {
    if (!isAdmin) {
      return;
    }

    const confirmed = window.confirm(`Delete "${picture.name}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase.from('EventPictures').delete().eq('id', picture.id);

      if (error) {
        throw error;
      }

      setPictures((prevPictures) => prevPictures.filter((item) => item.id !== picture.id));
    } catch (error) {
      console.error('Error deleting picture:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete picture');
    }
  };

  const reorderPicturesLocally = (fromId: string, toId: string) => {
    const fromIndex = pictures.findIndex((picture) => picture.id === fromId);
    const toIndex = pictures.findIndex((picture) => picture.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return;
    }

    const updatedPictures = [...pictures];
    const [movedPicture] = updatedPictures.splice(fromIndex, 1);
    updatedPictures.splice(toIndex, 0, movedPicture);
    setPictures(updatedPictures);
  };

  const handleReorderPictures = async (fromId: string, toId: string) => {
    if (!isAdmin) {
      return;
    }

    const fromIndex = pictures.findIndex((picture) => picture.id === fromId);
    const toIndex = pictures.findIndex((picture) => picture.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return;
    }

    const updatedPictures = [...pictures];
    const [movedPicture] = updatedPictures.splice(fromIndex, 1);
    updatedPictures.splice(toIndex, 0, movedPicture);
    setPictures(updatedPictures);

    try {
      const updates = updatedPictures.map((picture, index) => ({
        id: picture.id,
        sort_order: index,
      }));

      const { error } = await supabase.from('EventPictures').upsert(updates);
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating picture order:', error);
      alert(error instanceof Error ? error.message : 'Failed to update picture order');
      loadPictures();
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

  const handleDeleteEvent = async (eventId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this event?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete event');
      }

      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete event');
    }
  };

  const now = new Date();
  const upcomingEvents = [...events]
    .filter((event) => new Date(event.event_start_time) >= now)
    .sort((a, b) => new Date(a.event_start_time).getTime() - new Date(b.event_start_time).getTime());
  const pastEvents = [...events]
    .filter((event) => new Date(event.event_start_time) < now)
    .sort((a, b) => new Date(b.event_start_time).getTime() - new Date(a.event_start_time).getTime());

  const renderEventCard = (event: Event) => {
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
            <span className="font-medium">Date:</span> {formatDate(event.event_start_time)}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Time:</span> {formatTime(event.event_start_time)}
            {event.event_end_time && ` - ${formatTime(event.event_end_time)}`}
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
            disabled={
              (!isAuthenticated && openSpaces === 0) ||
              (isAuthenticated &&
                !isRegistered &&
                (eventSignupDisabled || openSpaces === 0))
            }
            className={`w-full px-4 py-2 rounded transition-colors ${
              isAuthenticated && !isRegistered && eventSignupDisabled
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : openSpaces > 0 || isRegistered
                  ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-red-200 text-red-700 cursor-not-allowed'
            }`}
          >
            {isAuthenticated
              ? isRegistered
                ? 'View Details'
                : eventSignupDisabled
                  ? 'Signup unavailable'
                  : openSpaces > 0
                    ? 'Signup'
                    : 'Full'
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
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete Event
              </button>
            </>
          )}
        </div>
      </div>
    );
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
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">Events</h1>
            <button
              type="button"
              onClick={() => setActiveView(activeView === 'events' ? 'pictures' : 'events')}
              className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {activeView === 'events' ? 'Pictures' : 'Events'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && activeView === 'events' && (
              <Link
                href="/admin/events/create"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Create Event
              </Link>
            )}
            {isCompany && (
              <Link
                href="/company/tour-request"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Create Tour Request
              </Link>
            )}
          </div>
        </div>

        {isAuthenticated && eventSignupDisabled && (
          <AccountStatusBanner
            status={{
              ...accountStatus,
              message:
                getEventSignupBlockedMessage(accountAccessFields) ??
                accountStatus.message,
            }}
          />
        )}

        {activeView === 'pictures' ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="text"
                value={pictureSearch}
                onChange={(event) => setPictureSearch(event.target.value)}
                placeholder="Search pictures by name"
                className="w-full sm:max-w-sm rounded border border-gray-300 px-3 py-2"
              />
              {isAdmin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPicture}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-60"
                  >
                    {isUploadingPicture ? 'Uploading...' : 'Upload Picture'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadPicture}
                  />
                </div>
              )}
            </div>

            {pictures.filter((picture) =>
              picture.name.toLowerCase().includes(pictureSearch.toLowerCase())
            ).length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
                <p className="text-gray-500">No pictures have been uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pictures
                  .filter((picture) =>
                    picture.name.toLowerCase().includes(pictureSearch.toLowerCase())
                  )
                  .map((picture) => (
                  <div
                    key={picture.id}
                    draggable={isAdmin}
                    onDragStart={() => isAdmin && setDraggedPictureId(picture.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggedPictureId && draggedPictureId !== picture.id) {
                        setDragOverPictureId(picture.id);
                        reorderPicturesLocally(draggedPictureId, picture.id);
                      }
                    }}
                    onDrop={() => {
                      if (draggedPictureId && draggedPictureId !== picture.id) {
                        handleReorderPictures(draggedPictureId, picture.id);
                      }
                      setDraggedPictureId(null);
                      setDragOverPictureId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedPictureId(null);
                      setDragOverPictureId(null);
                    }}
                    className={`group relative overflow-hidden rounded-lg border ${dragOverPictureId === picture.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'} bg-white shadow-sm ${isAdmin ? 'cursor-move' : ''}`}
                  >
                    <img
                      src={picture.image_url}
                      alt={picture.name}
                      className="h-64 w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-sm text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-between gap-2">
                      <span className="truncate">{picture.name}</span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeletePicture(picture)}
                          className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
                          aria-label={`Delete ${picture.name}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleEditPicture(picture)}
                        className="absolute right-2 top-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-200 hover:bg-black group-hover:opacity-100"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          events.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
              <p className="text-gray-500">No events available at this time.</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
                {upcomingEvents.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
                    <p className="text-gray-500">No upcoming events at this time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.map((event) => renderEventCard(event))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Past Events</h2>
                {pastEvents.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
                    <p className="text-gray-500">No past events at this time.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastEvents.map((event) => renderEventCard(event))}
                  </div>
                )}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

