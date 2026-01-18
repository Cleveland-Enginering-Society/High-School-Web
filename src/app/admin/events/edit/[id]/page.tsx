'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface FormData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventDescription: string;
  maxUsers: number | undefined;
  maxParents: number | undefined;
  eventWaiverInfo: string;
  eventWaiverParent: string;
}

interface FormErrors {
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventDescription?: string;
  maxUsers?: string;
  maxParents?: string;
  eventWaiverInfo?: string;
  eventWaiverParent?: string;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const eventId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    eventName: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    eventDescription: '',
    maxUsers: undefined,
    maxParents: undefined,
    eventWaiverInfo: '',
    eventWaiverParent: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    // Check if user is authenticated and has user_type === 2 (admin)
    const checkAuthAndLoadEvent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch user data to check user_type
      const response = await fetch('/api/account');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.user?.user_type !== 2) {
        // User doesn't have admin access, redirect to home
        router.push('/');
        return;
      }

      setIsLoading(false);
      
      // Load event data
      await loadEvent();
    };
    
    checkAuthAndLoadEvent();
  }, [router, supabase.auth, eventId]);

  const loadEvent = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`);
      if (!response.ok) {
        const errorData = await response.json();
        setSubmitError(errorData.error || 'Failed to load event');
        setIsLoadingEvent(false);
        return;
      }

      const data = await response.json();
      const event = data.event;

      // Parse event_time to separate date and time
      const eventDateTime = new Date(event.event_time);
      const eventDate = eventDateTime.toISOString().split('T')[0];
      const eventTime = eventDateTime.toTimeString().slice(0, 5);

      setFormData({
        eventName: event.event_name || '',
        eventDate: eventDate,
        eventTime: eventTime,
        eventLocation: event.event_location || '',
        eventDescription: event.event_description || '',
        maxUsers: event.max_users,
        maxParents: event.max_parents || 0,
        eventWaiverInfo: event.event_waiver_info || '',
        eventWaiverParent: event.event_waiver_parent || '',
      });
    } catch (error) {
      console.error('Error loading event:', error);
      setSubmitError('Failed to load event data');
    } finally {
      setIsLoadingEvent(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNumberChange = (field: 'maxUsers' | 'maxParents', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    handleInputChange(field, numValue);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }
    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }
    if (!formData.eventTime) {
      newErrors.eventTime = 'Event time is required';
    }
    if (!formData.eventLocation.trim()) {
      newErrors.eventLocation = 'Event location is required';
    }
    if (!formData.eventDescription.trim()) {
      newErrors.eventDescription = 'Event description is required';
    }
    if (formData.maxUsers === undefined || formData.maxUsers <= 0) {
      newErrors.maxUsers = 'Maximum number of users must be greater than 0';
    }
    if (!formData.eventWaiverInfo.trim()) {
      newErrors.eventWaiverInfo = 'Event waiver info is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time into a single datetime string
      const eventDateTime = `${formData.eventDate}T${formData.eventTime}:00`;
      
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName: formData.eventName,
          eventTime: eventDateTime,
          eventLocation: formData.eventLocation,
          eventDescription: formData.eventDescription,
          maxUsers: formData.maxUsers,
          maxParents: formData.maxParents || 0,
          eventWaiverInfo: formData.eventWaiverInfo,
          eventWaiverParent: formData.eventWaiverParent || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || 'Failed to update event');
        setIsSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/events');
      }, 2000);
    } catch (error) {
      console.error('Event update error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Edit Event</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div>
            <label htmlFor="eventName" className="block text-sm font-medium mb-1">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="eventName"
              value={formData.eventName}
              onChange={(e) => handleInputChange('eventName', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${
                errors.eventName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.eventName && (
              <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>
            )}
          </div>

          {/* Event Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium mb-1">
                Event Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="eventDate"
                value={formData.eventDate}
                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded ${
                  errors.eventDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.eventDate && (
                <p className="text-red-500 text-sm mt-1">{errors.eventDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="eventTime" className="block text-sm font-medium mb-1">
                Event Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="eventTime"
                value={formData.eventTime}
                onChange={(e) => handleInputChange('eventTime', e.target.value)}
                className={`w-full px-3 py-2 border rounded ${
                  errors.eventTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.eventTime && (
                <p className="text-red-500 text-sm mt-1">{errors.eventTime}</p>
              )}
            </div>
          </div>

          {/* Event Location */}
          <div>
            <label htmlFor="eventLocation" className="block text-sm font-medium mb-1">
              Event Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="eventLocation"
              value={formData.eventLocation}
              onChange={(e) => handleInputChange('eventLocation', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${
                errors.eventLocation ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.eventLocation && (
              <p className="text-red-500 text-sm mt-1">{errors.eventLocation}</p>
            )}
          </div>

          {/* Event Description */}
          <div>
            <label htmlFor="eventDescription" className="block text-sm font-medium mb-1">
              Event Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="eventDescription"
              value={formData.eventDescription}
              onChange={(e) => handleInputChange('eventDescription', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded ${
                errors.eventDescription ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.eventDescription && (
              <p className="text-red-500 text-sm mt-1">{errors.eventDescription}</p>
            )}
          </div>

          {/* Maximum Number of Users */}
          <div>
            <label htmlFor="maxUsers" className="block text-sm font-medium mb-1">
              Maximum Number of Users <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="maxUsers"
              min="1"
              value={formData.maxUsers ?? ''}
              onChange={(e) => handleNumberChange('maxUsers', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${
                errors.maxUsers ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.maxUsers && (
              <p className="text-red-500 text-sm mt-1">{errors.maxUsers}</p>
            )}
          </div>

          {/* Maximum Number of Parents */}
          <div>
            <label htmlFor="maxParents" className="block text-sm font-medium mb-1">
              Maximum Number of Parents
            </label>
            <input
              type="number"
              id="maxParents"
              min="0"
              value={formData.maxParents ?? ''}
              onChange={(e) => handleNumberChange('maxParents', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${
                errors.maxParents ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.maxParents && (
              <p className="text-red-500 text-sm mt-1">{errors.maxParents}</p>
            )}
          </div>

          {/* Separator Line */}
          <div className="border-t border-gray-300 my-6"></div>

          {/* Event Waiver Info */}
          <div>
            <label htmlFor="eventWaiverInfo" className="block text-sm font-medium mb-1">
              Event Waiver Info <span className="text-red-500">*</span>
            </label>
            <textarea
              id="eventWaiverInfo"
              value={formData.eventWaiverInfo}
              onChange={(e) => handleInputChange('eventWaiverInfo', e.target.value)}
              rows={6}
              className={`w-full px-3 py-2 border rounded ${
                errors.eventWaiverInfo ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.eventWaiverInfo && (
              <p className="text-red-500 text-sm mt-1">{errors.eventWaiverInfo}</p>
            )}
          </div>

          {/* Event Waiver Info for Parents (Optional) */}
          <div>
            <label htmlFor="eventWaiverParent" className="block text-sm font-medium mb-1">
              Event Waiver Info for Parents
            </label>
            <textarea
              id="eventWaiverParent"
              value={formData.eventWaiverParent}
              onChange={(e) => handleInputChange('eventWaiverParent', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border rounded border-gray-300"
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {submitError}
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              Event updated successfully! Redirecting...
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

