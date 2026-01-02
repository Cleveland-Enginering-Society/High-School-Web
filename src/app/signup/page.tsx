'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface FormData {
  studentEmail: string;
  password: string;
  studentFirstName: string;
  studentLastName: string;
  studentGrade: number | undefined;
  studentPhone: number | undefined;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: number | undefined;
  memberType: number | undefined;
  photoMediaRelease: boolean | undefined;
  studentSignature: string;
  studentDate: Date | undefined;
  parentSignature: string;
  parentDate: Date | undefined;
}

interface FormErrors {
  studentEmail?: string;
  password?: string;
  studentFirstName?: string;
  studentLastName?: string;
  studentGrade?: string;
  studentPhone?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentEmail?: string;
  parentPhone?: string;
  memberType?: string;
  photoMediaRelease?: string;
  studentSignature?: string;
  studentDate?: string;
  parentSignature?: string;
  parentDate?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    studentEmail: '',
    password: '',
    studentFirstName: '',
    studentLastName: '',
    studentGrade: undefined,
    studentPhone: undefined,
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: undefined,
    memberType: undefined,
    photoMediaRelease: undefined,
    studentSignature: '',
    studentDate: undefined,
    parentSignature: '',
    parentDate: undefined,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    // Redirect if already authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router, supabase.auth]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email: string): boolean => {
    return emailRegex.test(email);
  };

  const validatePhone = (phone: number | undefined): boolean => {
    if (phone === undefined) return true; // Optional field
    // Phone must be exactly 12 digits
    return phone.toString().length === 12;
  };

  const validateGrade = (grade: number | undefined): boolean => {
    if (grade === undefined) return false;
    return grade >= 9 && grade <= 12;
  };

  // Helper to format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to parse date from input string (YYYY-MM-DD format)
  // Parses as local date to avoid timezone conversion issues
  const parseDateFromInput = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    // Parse YYYY-MM-DD format manually to avoid timezone issues
    const parts = dateString.split('-');
    if (parts.length !== 3) return undefined;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
    
    // Create date in local timezone
    const date = new Date(year, month, day);
    
    // Validate the date (handles invalid dates like Feb 30)
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return undefined;
    }
    
    return date;
  };

  const validatePage1 = (): boolean => {
    const newErrors: FormErrors = {};

    // Account fields
    if (!formData.studentEmail.trim()) {
      newErrors.studentEmail = 'Student email is required';
    } else if (!validateEmail(formData.studentEmail)) {
      newErrors.studentEmail = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Student fields
    if (!formData.studentFirstName.trim()) {
      newErrors.studentFirstName = 'Student first name is required';
    }
    if (!formData.studentLastName.trim()) {
      newErrors.studentLastName = 'Student last name is required';
    }
    if (formData.studentGrade === undefined) {
      newErrors.studentGrade = 'Student grade is required';
    } else if (!validateGrade(formData.studentGrade)) {
      newErrors.studentGrade = 'Grade must be between 9 and 12';
    }
    if (formData.studentPhone !== undefined && !validatePhone(formData.studentPhone)) {
      newErrors.studentPhone = 'Phone number must be exactly 12 digits';
    }

    // Parent fields
    if (!formData.parentFirstName.trim()) {
      newErrors.parentFirstName = 'Parent first name is required';
    }
    if (!formData.parentLastName.trim()) {
      newErrors.parentLastName = 'Parent last name is required';
    }
    if (!formData.parentEmail.trim()) {
      newErrors.parentEmail = 'Parent email is required';
    } else if (!validateEmail(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid email address';
    }
    if (formData.parentPhone !== undefined && !validatePhone(formData.parentPhone)) {
      newErrors.parentPhone = 'Phone number must be exactly 12 digits';
    }

    // Member type
    if (formData.memberType === undefined) {
      newErrors.memberType = 'Member type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number | boolean | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNumberChange = (field: keyof FormData, value: string) => {
    if (value === '') {
      handleInputChange(field, undefined);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        handleInputChange(field, numValue);
      }
    }
  };

  const handlePhoneChange = (field: keyof FormData, value: string) => {
    // Remove non-digits
    const digitsOnly = value.replace(/\D/g, '');
    // Limit to 12 digits
    const limitedDigits = digitsOnly.slice(0, 12);
    if (limitedDigits === '') {
      handleInputChange(field, undefined);
    } else {
      const numValue = parseInt(limitedDigits, 10);
      if (!isNaN(numValue)) {
        handleInputChange(field, numValue);
      }
    }
  };

  const handleDateChange = (field: keyof FormData, value: string) => {
    const date = parseDateFromInput(value);
    handleInputChange(field, date);
  };

  const handleNext = () => {
    if (validatePage1()) {
      setCurrentPage(2);
    }
  };

  const handleBack = () => {
    setCurrentPage(1);
  };

  const validatePage2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.photoMediaRelease === undefined) {
      newErrors.photoMediaRelease = 'Please select Yes or No';
    }
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (!validatePage2()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || 'Failed to create account');
        setIsSubmitting(false);
        return;
      }

      // Success - check if email confirmation is needed
      if (data.success) {
        if (data.requiresEmailConfirmation) {
          // Redirect to email confirmation page with email
          router.push(`/confirm-email?email=${encodeURIComponent(formData.studentEmail)}`);
        } else {
          // User is authenticated, redirect to home
          router.push('/');
          router.refresh();
        }
      } else {
        // On failure, reset form and show error
        setSubmitError(data.error || 'Failed to create account');
        setIsSubmitting(false);
        // Reset form to empty state
        setFormData({
          studentEmail: '',
          password: '',
          studentFirstName: '',
          studentLastName: '',
          studentGrade: undefined,
          studentPhone: undefined,
          parentFirstName: '',
          parentLastName: '',
          parentEmail: '',
          parentPhone: undefined,
          memberType: undefined,
          photoMediaRelease: undefined,
          studentSignature: '',
          studentDate: undefined,
          parentSignature: '',
          parentDate: undefined,
        });
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
      // Reset form to empty state on error
      setFormData({
        studentEmail: '',
        password: '',
        studentFirstName: '',
        studentLastName: '',
        studentGrade: undefined,
        studentPhone: undefined,
        parentFirstName: '',
        parentLastName: '',
        parentEmail: '',
        parentPhone: undefined,
        memberType: undefined,
        photoMediaRelease: undefined,
        studentSignature: '',
        studentDate: undefined,
        parentSignature: '',
        parentDate: undefined,
      });
      setCurrentPage(1);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Sign Up</h1>

        {/* Progress indicator */}
        <div className="mb-8 flex items-center gap-2">
          <div
            className={`flex-1 h-2 rounded ${
              currentPage >= 1 ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
          <div
            className={`flex-1 h-2 rounded ${
              currentPage >= 2 ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        </div>

        <form onSubmit={handleSubmit}>
          {currentPage === 1 && (
            <div className="space-y-6">
              {/* Account Information Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Email */}
                  <div>
                    <label htmlFor="studentEmail" className="block text-sm font-medium mb-1">
                      Student Email <span className="text-red-500">*</span>
                      <span className="relative inline-block ml-2 group">
                        <span className="text-gray-500 cursor-help">(?)</span>
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          The student email is used for logging in to the account
                        </span>
                      </span>
                    </label>
                    <input
                      type="email"
                      id="studentEmail"
                      value={formData.studentEmail}
                      onChange={(e) => handleInputChange('studentEmail', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.studentEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.studentEmail && (
                      <p className="text-red-500 text-sm mt-1">{errors.studentEmail}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Separator Line */}
              <div className="border-t border-gray-300 my-6"></div>

              {/* Student Information Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Student Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student First Name */}
                  <div>
                    <label htmlFor="studentFirstName" className="block text-sm font-medium mb-1">
                      Student First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="studentFirstName"
                      value={formData.studentFirstName}
                      onChange={(e) => handleInputChange('studentFirstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.studentFirstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.studentFirstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.studentFirstName}</p>
                    )}
                  </div>

                  {/* Student Last Name */}
                  <div>
                    <label htmlFor="studentLastName" className="block text-sm font-medium mb-1">
                      Student Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="studentLastName"
                      value={formData.studentLastName}
                      onChange={(e) => handleInputChange('studentLastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.studentLastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.studentLastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.studentLastName}</p>
                    )}
                  </div>

                  {/* Student Grade */}
                  <div>
                    <label htmlFor="studentGrade" className="block text-sm font-medium mb-1">
                      Student Grade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="studentGrade"
                      min="9"
                      max="12"
                      value={formData.studentGrade ?? ''}
                      onChange={(e) => handleNumberChange('studentGrade', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.studentGrade ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.studentGrade && (
                      <p className="text-red-500 text-sm mt-1">{errors.studentGrade}</p>
                    )}
                  </div>

                  {/* Student Phone */}
                  <div>
                    <label htmlFor="studentPhone" className="block text-sm font-medium mb-1">
                      Student Phone Number
                    </label>
                    <input
                      type="tel"
                      id="studentPhone"
                      value={formData.studentPhone ?? ''}
                      onChange={(e) => handlePhoneChange('studentPhone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.studentPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="12 digits"
                      maxLength={12}
                    />
                    {errors.studentPhone && (
                      <p className="text-red-500 text-sm mt-1">{errors.studentPhone}</p>
                    )}
                  </div>

                  {/* Member Type */}
                  <div>
                    <label htmlFor="memberType" className="block text-sm font-medium mb-1">
                      Member Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="memberType"
                      value={formData.memberType ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange('memberType', value === '' ? undefined : parseInt(value, 10));
                      }}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.memberType ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select member type</option>
                      <option value="1">Student</option>
                      <option value="3">Company</option>
                    </select>
                    {errors.memberType && (
                      <p className="text-red-500 text-sm mt-1">{errors.memberType}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Separator Line */}
              <div className="border-t border-gray-300 my-6"></div>

              {/* Parent Information Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Parent Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Parent First Name */}
                  <div>
                    <label htmlFor="parentFirstName" className="block text-sm font-medium mb-1">
                      Parent First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="parentFirstName"
                      value={formData.parentFirstName}
                      onChange={(e) => handleInputChange('parentFirstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.parentFirstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.parentFirstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.parentFirstName}</p>
                    )}
                  </div>

                  {/* Parent Last Name */}
                  <div>
                    <label htmlFor="parentLastName" className="block text-sm font-medium mb-1">
                      Parent Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="parentLastName"
                      value={formData.parentLastName}
                      onChange={(e) => handleInputChange('parentLastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.parentLastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.parentLastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.parentLastName}</p>
                    )}
                  </div>

                  {/* Parent Email */}
                  <div>
                    <label htmlFor="parentEmail" className="block text-sm font-medium mb-1">
                      Parent Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="parentEmail"
                      value={formData.parentEmail}
                      onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.parentEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.parentEmail && (
                      <p className="text-red-500 text-sm mt-1">{errors.parentEmail}</p>
                    )}
                  </div>

                  {/* Parent Phone */}
                  <div>
                    <label htmlFor="parentPhone" className="block text-sm font-medium mb-1">
                      Parent Phone Number
                    </label>
                    <input
                      type="tel"
                      id="parentPhone"
                      value={formData.parentPhone ?? ''}
                      onChange={(e) => handlePhoneChange('parentPhone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.parentPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="12 digits"
                      maxLength={12}
                    />
                    {errors.parentPhone && (
                      <p className="text-red-500 text-sm mt-1">{errors.parentPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {currentPage === 2 && (
            <div className="space-y-6">
              {/* Section 1: Participation Agreement */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Participation Agreement</h2>
                <p className="mb-4">
                    I, the undersigned student and parent/guardian, understand that participation in the Cleveland Engineering Society (CES) High School Student Chapter and its related activities—including but not limited to meetings, field trips, volunteer events, industry tours, and community service projects—is voluntary.
                </p>
                <p className="mb-4">
                    By signing this form, we acknowledge and agree to the following:
                </p>
                <ol className="list-decimal space-y-4 pl-6">
                  <li className="pl-2">
                    <span className="font-bold">Assumption of Risk:</span>
                    <p className="mt-1">
                      We understand that participation in CES activities may involve travel, use of equipment, and 
                      interaction with various facilities. We assume all risks associated with participation, 
                      including but not limited to minor injuries or accidents.
                    </p>
                  </li>
                  <li className="pl-2">
                    <span className="font-bold">Liability Release:</span>
                    <p className="mt-1">
                      We release and hold harmless the Cleveland Engineering Society, its officers, members, volunteers, sponsors, and partners from any and all liability, claims, or demands arising out of participation in CES-sponsored events and activities, except in cases of gross negligence or willful misconduct.
                    </p>
                  </li>
                  <li className="pl-2">
                    <span className="font-bold">Medical Authorization:</span>
                    <p className="mt-1">
                      In the event of an emergency, I authorize CES representatives to seek medical treatment for the student if the parent/guardian cannot be reached. We understand that we are responsible for any medical costs incurred.
                    </p>
                  </li>
                  <li className="pl-2">
                    <span className="font-bold">Behavior and Conduct:</span>
                    <p className="mt-1">
                    Students are expected to demonstrate professionalism, respect, and responsibility during all CES activities. Failure to adhere to behavioral expectations may result in dismissal from the program or exclusion from specific events.
                    </p>
                  </li>
                </ol>
              </div>

              {/* Separator Line */}
              <div className="border-t border-gray-300 my-6"></div>

              {/* Section 2: Photo & Media Release */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Photo & Media Release</h2>
                <p className="mb-4">
                  The Cleveland Engineering Society High School Chapter may take photographs, 
                  videos, or other recordings during events and activities. These materials 
                  may be used for promotional purposes, including but not limited to social 
                  media, newsletters, and website content.
                </p>
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">
                    Do you consent to the use of photos and media? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="photoMediaRelease"
                        checked={formData.photoMediaRelease === true}
                        onChange={() => handleInputChange('photoMediaRelease', true)}
                        className="w-4 h-4"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="photoMediaRelease"
                        checked={formData.photoMediaRelease === false}
                        onChange={() => handleInputChange('photoMediaRelease', false)}
                        className="w-4 h-4"
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {errors.photoMediaRelease && (
                    <p className="text-red-500 text-sm mt-1">{errors.photoMediaRelease}</p>
                  )}
                </div>
              </div>

              {/* Separator Line */}
              <div className="border-t border-gray-300 my-6"></div>

              {/* Section 3: Acknowledgment & Signature */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Acknowledgment & Signature</h2>
                <p className="mb-4">
                  By signing below, I acknowledge that I have read and understood all the 
                  terms and conditions outlined in this agreement. I understand my 
                  responsibilities as a member of the Cleveland Engineering Society High 
                  School Chapter and agree to comply with all policies and procedures.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student Signature */}
                  <div>
                    <label htmlFor="studentSignature" className="block text-sm font-medium mb-1">
                      Student Signature <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="studentSignature"
                      value={formData.studentSignature}
                      onChange={(e) => handleInputChange('studentSignature', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.studentSignature ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.studentSignature && (
                      <p className="text-red-500 text-sm mt-1">{errors.studentSignature}</p>
                    )}
                  </div>

                  {/* Student Date */}
                  <div>
                    <label htmlFor="studentDate" className="block text-sm font-medium mb-1">
                      Student Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="studentDate"
                      value={formatDateForInput(formData.studentDate)}
                      onChange={(e) => handleDateChange('studentDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.studentDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.studentDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.studentDate}</p>
                    )}
                  </div>

                  {/* Parent Signature */}
                  <div>
                    <label htmlFor="parentSignature" className="block text-sm font-medium mb-1">
                      Parent Signature <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="parentSignature"
                      value={formData.parentSignature}
                      onChange={(e) => handleInputChange('parentSignature', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.parentSignature ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.parentSignature && (
                      <p className="text-red-500 text-sm mt-1">{errors.parentSignature}</p>
                    )}
                  </div>

                  {/* Parent Date */}
                  <div>
                    <label htmlFor="parentDate" className="block text-sm font-medium mb-1">
                      Parent Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="parentDate"
                      value={formatDateForInput(formData.parentDate)}
                      onChange={(e) => handleDateChange('parentDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded ${
                        errors.parentDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.parentDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.parentDate}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Error Message */}
              {submitError && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {submitError}
                </div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

