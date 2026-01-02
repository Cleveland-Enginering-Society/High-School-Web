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

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
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
    // Redirect if not authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      // Load user data
      loadUserData();
    };
    checkAuth();
  }, [router, supabase.auth]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/account');
      if (!response.ok) {
        throw new Error('Failed to load account data');
      }
      const data = await response.json();
      
      if (data.user) {
        setFormData({
          studentEmail: data.user.student_email || '',
          password: '', // Don't load password
          studentFirstName: data.user.student_first_name || '',
          studentLastName: data.user.student_last_name || '',
          studentGrade: data.user.student_grade || undefined,
          studentPhone: data.user.student_phone || undefined,
          parentFirstName: data.user.parent_first_name || '',
          parentLastName: data.user.parent_last_name || '',
          parentEmail: data.user.parent_email || '',
          parentPhone: data.user.parent_phone || undefined,
          memberType: data.user.user_type || undefined,
          photoMediaRelease: data.user.photo_release ?? undefined,
          studentSignature: data.user.student_participation_sign ? 'Signed' : '',
          studentDate: data.user.student_participation_date 
            ? new Date(data.user.student_participation_date + 'T00:00:00')
            : undefined,
          parentSignature: data.user.parent_participation_sign ? 'Signed' : '',
          parentDate: data.user.parent_participation_date 
            ? new Date(data.user.parent_participation_date + 'T00:00:00')
            : undefined,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUpdateError('Failed to load account data');
    } finally {
      setIsLoading(false);
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email: string): boolean => {
    return emailRegex.test(email);
  };

  const validatePhone = (phone: number | undefined): boolean => {
    if (phone === undefined) return true; // Optional field
    return phone.toString().length === 12;
  };

  const validateGrade = (grade: number | undefined): boolean => {
    if (grade === undefined) return false;
    return grade >= 9 && grade <= 12;
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

  const validatePage1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.studentEmail.trim()) {
      newErrors.studentEmail = 'Student email is required';
    } else if (!validateEmail(formData.studentEmail)) {
      newErrors.studentEmail = 'Please enter a valid email address';
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

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

    if (formData.memberType === undefined) {
      newErrors.memberType = 'Member type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePage2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.photoMediaRelease === undefined) {
      newErrors.photoMediaRelease = 'Please select Yes or No';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number | boolean | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    const digitsOnly = value.replace(/\D/g, '');
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

  const handleUpdatePage1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);
    
    if (!validatePage1()) {
      return;
    }

    setIsUpdating(true);

    try {
      const updateData: any = {
        studentEmail: formData.studentEmail,
        studentFirstName: formData.studentFirstName,
        studentLastName: formData.studentLastName,
        studentGrade: formData.studentGrade,
        studentPhone: formData.studentPhone,
        parentFirstName: formData.parentFirstName,
        parentLastName: formData.parentLastName,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone,
        memberType: formData.memberType,
      };

      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setUpdateError(data.error || 'Failed to update account');
      } else {
        setUpdateSuccess('Account information updated successfully!');
        // Clear password field after successful update
        setFormData((prev) => ({ ...prev, password: '' }));
      }
    } catch (error) {
      console.error('Update error:', error);
      setUpdateError('An unexpected error occurred. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePage2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);
    
    if (!validatePage2()) {
      return;
    }

    setIsUpdating(true);

    try {
      const updateData: any = {
        photoMediaRelease: formData.photoMediaRelease,
      };

      // Only include dates if they're provided
      if (formData.studentDate) {
        updateData.studentDate = formData.studentDate;
      }
      if (formData.parentDate) {
        updateData.parentDate = formData.parentDate;
      }

      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        setUpdateError(data.error || 'Failed to update account');
      } else {
        setUpdateSuccess('Account information updated successfully!');
      }
    } catch (error) {
      console.error('Update error:', error);
      setUpdateError('An unexpected error occurred. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Account</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Account Settings</h1>

        {/* Progress indicator */}
        <div className="mb-8 flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            className={`flex-1 h-2 rounded transition-colors ${
              currentPage >= 1 ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
          <button
            onClick={() => setCurrentPage(2)}
            className={`flex-1 h-2 rounded transition-colors ${
              currentPage >= 2 ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        </div>

        {currentPage === 1 && (
          <form onSubmit={handleUpdatePage1} className="space-y-6">
            {/* Account Information Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Email */}
                <div>
                  <label htmlFor="studentEmail" className="block text-sm font-medium mb-1">
                    Student Email <span className="text-red-500">*</span>
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
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-3 py-2 border rounded ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
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

            {/* Error Message */}
            {updateError && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {updateError}
              </div>
            )}

            {/* Success Message */}
            {updateSuccess && (
              <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {updateSuccess}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-center mt-8 relative">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update Information'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(2)}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 absolute right-0"
              >
                Next
              </button>
            </div>
          </form>
        )}

        {currentPage === 2 && (
          <form onSubmit={handleUpdatePage2} className="space-y-6">
            {/* Section 1: Participation Agreement - Read Only */}
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
              <div className="bg-gray-100 p-4 rounded mt-4">
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> You have already signed this agreement. The agreement cannot be modified, but you can update your photo release preference below.
                </p>
              </div>
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

            {/* Section 3: Acknowledgment & Signature - Read Only Display */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Acknowledgment & Signature</h2>
              <p className="mb-4">
                By signing below, I acknowledge that I have read and understood all the 
                terms and conditions outlined in this agreement. I understand my 
                responsibilities as a member of the Cleveland Engineering Society High 
                School Chapter and agree to comply with all policies and procedures.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Signature - Read Only */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Student Signature
                  </label>
                  <input
                    type="text"
                    value={formData.studentSignature || 'Not signed'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                  />
                </div>

                {/* Student Date - Editable */}
                <div>
                  <label htmlFor="studentDate" className="block text-sm font-medium mb-1">
                    Student Date
                  </label>
                  <input
                    type="date"
                    id="studentDate"
                    value={formatDateForInput(formData.studentDate)}
                    onChange={(e) => handleDateChange('studentDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded border-gray-300"
                  />
                </div>

                {/* Parent Signature - Read Only */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Parent Signature
                  </label>
                  <input
                    type="text"
                    value={formData.parentSignature || 'Not signed'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                  />
                </div>

                {/* Parent Date - Editable */}
                <div>
                  <label htmlFor="parentDate" className="block text-sm font-medium mb-1">
                    Parent Date
                  </label>
                  <input
                    type="date"
                    id="parentDate"
                    value={formatDateForInput(formData.parentDate)}
                    onChange={(e) => handleDateChange('parentDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {updateError && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {updateError}
              </div>
            )}

            {/* Success Message */}
            {updateSuccess && (
              <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {updateSuccess}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-center mt-8 relative">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 absolute left-0"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update Information'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

