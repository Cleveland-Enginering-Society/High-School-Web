'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EventSignupPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successAction, setSuccessAction] = useState<'signup' | 'cancel' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [formData, setFormData] = useState({
    studentSignature: '',
    studentDate: undefined as Date | undefined,
    parentSignature: '',
    parentDate: undefined as Date | undefined,
    registerParent: false,
    parentName: '',
    parentCompany: '',
  });
  const [registrationData, setRegistrationData] = useState<{
    event_waiver_student_sign: string | null;
    event_waiver_student_date: string | null;
    event_waiver_parent_sign: string | null;
    event_waiver_parent_date: string | null;
  } | null>(null);
  const [errors, setErrors] = useState<{
    studentSignature?: string;
    studentDate?: string;
    parentSignature?: string;
    parentDate?: string;
    parentName?: string;
    parentCompany?: string;
  }>({});

  useEffect(() => {
    const checkAuthAndLoadEvent = async () => {
      // Check if user is authenticated (but don't redirect if not)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.id);

        // Check if user is admin
        try {
          const accountResponse = await fetch('/api/account');
          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            setIsAdmin(accountData.user?.user_type === 2);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }

        // Fetch registration data if user is registered
        try {
          const registrationResponse = await fetch(`/api/events/${eventId}/signup`);
          if (registrationResponse.ok) {
            const registrationResult = await registrationResponse.json();
            if (registrationResult.registration) {
              setRegistrationData(registrationResult.registration);
              // Pre-fill form data with registration data
              const reg = registrationResult.registration;
              // Store signature text (now always text, but handle boolean for legacy data)
              if (reg.event_waiver_student_sign) {
                const studentSign = typeof reg.event_waiver_student_sign === 'boolean' 
                  ? 'Signed' 
                  : String(reg.event_waiver_student_sign);
                setFormData(prev => ({
                  ...prev,
                  studentSignature: studentSign,
                }));
              }
              if (reg.event_waiver_student_date) {
                const studentDate = new Date(reg.event_waiver_student_date);
                setFormData(prev => ({
                  ...prev,
                  studentDate: studentDate,
                }));
              }
              if (reg.event_waiver_parent_sign) {
                const parentSign = typeof reg.event_waiver_parent_sign === 'boolean' 
                  ? 'Signed' 
                  : String(reg.event_waiver_parent_sign);
                setFormData(prev => ({
                  ...prev,
                  parentSignature: parentSign,
                }));
              }
              if (reg.event_waiver_parent_date) {
                const parentDate = new Date(reg.event_waiver_parent_date);
                setFormData(prev => ({
                  ...prev,
                  parentDate: parentDate,
                }));
              }
              // Load parent registration data if exists
              if (reg.registered_parent_name) {
                setFormData(prev => ({
                  ...prev,
                  registerParent: true,
                  parentName: reg.registered_parent_name,
                }));
              }
              if (reg.registered_parent_company) {
                setFormData(prev => ({
                  ...prev,
                  parentCompany: reg.registered_parent_company,
                }));
              }
            }
          }
        } catch (error) {
          console.error('Error fetching registration data:', error);
        }
      }

      // Load event data (for both authenticated and unauthenticated users)
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to load event');
        }
        const data = await response.json();
        const foundEvent = data.events?.find((e: Event) => e.id === eventId);
        
        if (!foundEvent) {
          setError('Event not found');
          setIsLoading(false);
          return;
        }

        setEvent(foundEvent);
      } catch (error) {
        console.error('Error loading event:', error);
        setError('Failed to load event data');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadEvent();
  }, [router, supabase.auth, eventId]);


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

  const getOpenSpaces = () => {
    if (!event) return 0;
    const registeredCount = event.registered_list?.length || 0;
    return event.max_users - registeredCount;
  };

  const getOpenParentSpaces = () => {
    if (!event) return 0;
    const parentCount = event.parent_list?.length || 0;
    return event.max_parents - parentCount;
  };

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateFromInput = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const parts = dateString.split('-');
    if (parts.length !== 3) return undefined;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
    
    const date = new Date(year, month, day);
    
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return undefined;
    }
    
    return date;
  };

  const handleInputChange = (field: keyof typeof formData, value: string | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof typeof errors];
        return newErrors;
      });
    }
  };

  const handleDateChange = (field: 'studentDate' | 'parentDate', value: string) => {
    const date = parseDateFromInput(value);
    handleInputChange(field, date);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.studentSignature.trim()) {
      newErrors.studentSignature = 'Student signature is required';
    }
    if (!formData.studentDate) {
      newErrors.studentDate = 'Student date is required';
    }
    if (!formData.parentSignature.trim()) {
      newErrors.parentSignature = 'Parent signature is required';
    }
    if (!formData.parentDate) {
      newErrors.parentDate = 'Parent date is required';
    }
    
    // Validate parent registration fields if checkbox is checked
    if (formData.registerParent) {
      if (!formData.parentName.trim()) {
        newErrors.parentName = 'Parent name is required';
      }
      if (!formData.parentCompany.trim()) {
        newErrors.parentCompany = 'Parent company is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!event) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/events/${eventId}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentSignature: formData.studentSignature,
          studentDate: formData.studentDate 
            ? formData.studentDate.toISOString().split('T')[0]
            : null,
          parentSignature: formData.parentSignature,
          parentDate: formData.parentDate 
            ? formData.parentDate.toISOString().split('T')[0]
            : null,
          registerParent: formData.registerParent,
          parentName: formData.registerParent ? formData.parentName : null,
          parentCompany: formData.registerParent ? formData.parentCompany : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sign up for event');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setSuccessAction('signup');
      
      // Redirect to events page after 2 seconds
      setTimeout(() => {
        router.push('/events');
      }, 2000);
    } catch (error) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!event) return;

    setIsCanceling(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/events/${eventId}/signup`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to cancel registration');
        setIsCanceling(false);
        setShowCancelConfirm(false);
        return;
      }

      setSuccess(true);
      setSuccessAction('cancel');
      setShowCancelConfirm(false);
      
      // Reload event data to update the UI
      try {
        const eventsResponse = await fetch('/api/events');
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          const foundEvent = eventsData.events?.find((e: Event) => e.id === eventId);
          if (foundEvent) {
            setEvent(foundEvent);
          }
        }
      } catch (error) {
        console.error('Error reloading event:', error);
      }
      
      // Redirect to events page after 2 seconds
      setTimeout(() => {
        router.push('/events');
      }, 2000);
    } catch (error) {
      console.error('Cancel registration error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsCanceling(false);
      setShowCancelConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Event not found'}</p>
            <Link
              href="/events"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const openSpaces = getOpenSpaces();
  const openParentSpaces = getOpenParentSpaces();
  const isFull = openSpaces === 0;
  const isParentFull = openParentSpaces === 0;
  const isAlreadyRegistered = userId ? (event.registered_list?.includes(userId) || false) : false;
  const hasParentRegistered = userId ? (event.parent_list?.includes(userId) || false) : false;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          {isAuthenticated ? `Signup for ${event.event_name}` : event.event_name}
        </h1>

        <div className="space-y-2 mb-6">
          <p className="text-gray-600">
            <span className="font-medium">Date:</span> {formatDate(event.event_time)}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Time:</span> {formatTime(event.event_time)}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Location:</span> {event.event_location}
          </p>
          <div className="text-gray-600">
            <span className="font-medium">Description:</span>
            <p className="text-gray-600 whitespace-pre-wrap mt-1">{event.event_description}</p>
          </div>
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
        </div>

        {/* Waiver Information - For authenticated users */}
        {isAuthenticated && (
          <>
            {/* Separator Line */}
            <div className="border-t border-gray-300 my-6"></div>

            {/* Waiver Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Event Waiver Information</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap mb-4">
                  {event.event_waiver_info}
                </p>
              </div>
            </div>

            {/* Separator Line */}
            <div className="border-t border-gray-300 my-6"></div>

            {/* Acknowledgment & Signature */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Acknowledgment & Signature</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Signature */}
                <div>
                  <label htmlFor="studentSignature" className="block text-sm font-medium mb-1">
                    Student Signature {!isAlreadyRegistered && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    id="studentSignature"
                    value={formData.studentSignature}
                    onChange={(e) => handleInputChange('studentSignature', e.target.value)}
                    disabled={isAlreadyRegistered}
                    className={`w-full px-3 py-2 border rounded ${
                      isAlreadyRegistered
                        ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                        : errors.studentSignature
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.studentSignature && !isAlreadyRegistered && (
                    <p className="text-red-500 text-sm mt-1">{errors.studentSignature}</p>
                  )}
                </div>

                {/* Student Date */}
                <div>
                  <label htmlFor="studentDate" className="block text-sm font-medium mb-1">
                    Student Date {!isAlreadyRegistered && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    id="studentDate"
                    value={formatDateForInput(formData.studentDate)}
                    onChange={(e) => handleDateChange('studentDate', e.target.value)}
                    disabled={isAlreadyRegistered}
                    className={`w-full px-3 py-2 border rounded ${
                      isAlreadyRegistered
                        ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                        : errors.studentDate
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.studentDate && !isAlreadyRegistered && (
                    <p className="text-red-500 text-sm mt-1">{errors.studentDate}</p>
                  )}
                </div>
              </div>

              {/* Spacing and Parent/Guardian Information - Between student and parent signatures */}
              <div className="mt-6 mb-4">
                {event.event_waiver_parent && (
                  <>
                    <h4 className="text-md font-semibold mb-2">Parent/Guardian Information</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {event.event_waiver_parent}
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parent Signature */}
                <div>
                  <label htmlFor="parentSignature" className="block text-sm font-medium mb-1">
                    Parent Signature {!isAlreadyRegistered && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    id="parentSignature"
                    value={formData.parentSignature}
                    onChange={(e) => handleInputChange('parentSignature', e.target.value)}
                    disabled={isAlreadyRegistered}
                    className={`w-full px-3 py-2 border rounded ${
                      isAlreadyRegistered
                        ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                        : errors.parentSignature
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.parentSignature && !isAlreadyRegistered && (
                    <p className="text-red-500 text-sm mt-1">{errors.parentSignature}</p>
                  )}
                </div>

                {/* Parent Date */}
                <div>
                  <label htmlFor="parentDate" className="block text-sm font-medium mb-1">
                    Parent Date {!isAlreadyRegistered && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    id="parentDate"
                    value={formatDateForInput(formData.parentDate)}
                    onChange={(e) => handleDateChange('parentDate', e.target.value)}
                    disabled={isAlreadyRegistered}
                    className={`w-full px-3 py-2 border rounded ${
                      isAlreadyRegistered
                        ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                        : errors.parentDate
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.parentDate && !isAlreadyRegistered && (
                    <p className="text-red-500 text-sm mt-1">{errors.parentDate}</p>
                  )}
                </div>
              </div>

              {/* Parent Registration Section - After parent signature */}
              {event.max_parents > 0 && (
                <>
                  {/* Separator Line */}
                  <div className="border-t border-gray-300 my-6"></div>

                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="registerParent"
                        checked={formData.registerParent || hasParentRegistered}
                        onChange={(e) => {
                          if (hasParentRegistered) return; // Prevent changes if already registered
                          setFormData(prev => ({
                            ...prev,
                            registerParent: e.target.checked,
                            parentName: e.target.checked ? prev.parentName : '',
                            parentCompany: e.target.checked ? prev.parentCompany : '',
                          }));
                          // Clear errors when unchecking
                          if (!e.target.checked) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.parentName;
                              delete newErrors.parentCompany;
                              return newErrors;
                            });
                          }
                        }}
                        disabled={isParentFull || hasParentRegistered || isAlreadyRegistered}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <label htmlFor="registerParent" className="ml-2 text-sm font-medium">
                        Register a parent for this event
                        {isParentFull && <span className="text-red-500 ml-2">(Full)</span>}
                        {hasParentRegistered && <span className="text-blue-600 ml-2">(Already registered)</span>}
                      </label>
                    </div>

                    {(formData.registerParent || hasParentRegistered) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Parent Name */}
                        <div>
                          <label htmlFor="parentName" className="block text-sm font-medium mb-1">
                            Parent Name {!isAlreadyRegistered && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            id="parentName"
                            value={formData.parentName}
                            onChange={(e) => handleInputChange('parentName', e.target.value)}
                            disabled={isAlreadyRegistered}
                            className={`w-full px-3 py-2 border rounded ${
                              isAlreadyRegistered
                                ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                                : errors.parentName
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                          />
                          {errors.parentName && !isAlreadyRegistered && (
                            <p className="text-red-500 text-sm mt-1">{errors.parentName}</p>
                          )}
                        </div>

                        {/* Parent Company */}
                        <div>
                          <label htmlFor="parentCompany" className="block text-sm font-medium mb-1">
                            Parent Company {!isAlreadyRegistered && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            id="parentCompany"
                            value={formData.parentCompany}
                            onChange={(e) => handleInputChange('parentCompany', e.target.value)}
                            disabled={isAlreadyRegistered}
                            className={`w-full px-3 py-2 border rounded ${
                              isAlreadyRegistered
                                ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                                : errors.parentCompany
                                ? 'border-red-500'
                                : 'border-gray-300'
                            }`}
                          />
                          {errors.parentCompany && !isAlreadyRegistered && (
                            <p className="text-red-500 text-sm mt-1">{errors.parentCompany}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successAction === 'cancel'
              ? 'Successfully canceled registration! Redirecting...'
              : 'Successfully registered for event! Redirecting...'}
          </div>
        )}

        {/* Buttons */}
        {isAuthenticated ? (
          <div className="flex justify-between items-center">
            <Link
              href="/events"
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </Link>
            
            {isAdmin && (
              <Link
                href={`/admin/events/edit/${eventId}`}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Edit Event
              </Link>
            )}
            
            {!isAdmin && <div></div>}
            
            {isAlreadyRegistered ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={isCanceling}
                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCanceling ? 'Canceling...' : 'Cancel Registration'}
              </button>
            ) : (
              <button
                onClick={handleSignup}
                disabled={isSubmitting || isFull}
                className={`px-6 py-2 rounded transition-colors ${
                  isFull
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isSubmitting
                  ? 'Signing up...'
                  : isFull
                  ? 'Event Full'
                  : 'Sign Up for Event'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <Link
              href="/events"
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Events
            </Link>
            
            <Link
              href="/login"
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Login to Sign Up
            </Link>
          </div>
        )}

        {/* Cancel Registration Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Cancel Registration</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to cancel your registration for <strong>{event.event_name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCanceling}
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Keep registration
                </button>
                <button
                  onClick={handleCancelRegistration}
                  disabled={isCanceling}
                  className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCanceling ? 'Canceling...' : 'Yes, cancel registration'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

