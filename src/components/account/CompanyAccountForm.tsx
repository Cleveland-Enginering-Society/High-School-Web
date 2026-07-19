'use client';

import { useState } from 'react';
import { HOST_OPTION_LABELS, parseHostOptions } from '@/lib/hostOptions';

interface CompanyProfile {
  contact_email?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_phone?: string | null;
  secondary_first_name?: string | null;
  secondary_last_name?: string | null;
  secondary_email?: string | null;
  secondary_phone?: string | null;
  company_name?: string;
  industry?: string;
  company_location?: string;
  host_options?: string[] | null;
}

interface CompanyFormData {
  contactEmail: string;
  password: string;
  contactFirstName: string;
  contactLastName: string;
  contactPhone: string;
  secondaryFirstName: string;
  secondaryLastName: string;
  secondaryEmail: string;
  secondaryPhone: string;
  companyName: string;
  industry: string;
  companyLocation: string;
  hostOptions: string[];
  hostOptionsOther: string;
}

interface CompanyFormErrors {
  contactEmail?: string;
  password?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactPhone?: string;
  secondaryEmail?: string;
  secondaryPhone?: string;
  companyName?: string;
  industry?: string;
  companyLocation?: string;
  hostOptions?: string;
  hostOptionsOther?: string;
}

interface CompanyAccountFormProps {
  initialData: CompanyProfile;
}

export default function CompanyAccountForm({ initialData }: CompanyAccountFormProps) {
  const parsedHostOptions = parseHostOptions(initialData.host_options);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>({
    contactEmail: initialData.contact_email || '',
    password: '',
    contactFirstName: initialData.contact_first_name || '',
    contactLastName: initialData.contact_last_name || '',
    contactPhone: initialData.contact_phone || '',
    secondaryFirstName: initialData.secondary_first_name || '',
    secondaryLastName: initialData.secondary_last_name || '',
    secondaryEmail: initialData.secondary_email || '',
    secondaryPhone: initialData.secondary_phone || '',
    companyName: initialData.company_name || '',
    industry: initialData.industry || '',
    companyLocation: initialData.company_location || '',
    hostOptions: parsedHostOptions.hostOptions,
    hostOptionsOther: parsedHostOptions.hostOptionsOther,
  });
  const [errors, setErrors] = useState<CompanyFormErrors>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validatePhone = (phone: string): boolean => {
    if (!phone.trim()) return true;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 12;
  };

  const validateForm = (): boolean => {
    const newErrors: CompanyFormErrors = {};

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!emailRegex.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.contactFirstName.trim()) {
      newErrors.contactFirstName = 'Contact first name is required';
    }
    if (!formData.contactLastName.trim()) {
      newErrors.contactLastName = 'Contact last name is required';
    }
    if (!validatePhone(formData.contactPhone)) {
      newErrors.contactPhone = 'Phone number must be between 10 and 12 digits';
    }
    if (formData.secondaryEmail.trim() && !emailRegex.test(formData.secondaryEmail)) {
      newErrors.secondaryEmail = 'Please enter a valid email address';
    }
    if (!validatePhone(formData.secondaryPhone)) {
      newErrors.secondaryPhone = 'Phone number must be between 10 and 12 digits';
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.industry.trim()) {
      newErrors.industry = 'Industry is required';
    }
    if (!formData.companyLocation.trim()) {
      newErrors.companyLocation = 'Company location is required';
    }
    if (formData.hostOptions.includes('Other') && !formData.hostOptionsOther.trim()) {
      newErrors.hostOptionsOther = 'Please specify when selecting Other';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof typeof next];
        return next;
      });
    }
  };

  const handleHostOptionToggle = (option: string) => {
    setFormData((prev) => {
      const current = prev.hostOptions;
      const next = current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option];
      return { ...prev, hostOptions: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);

    if (!validateForm()) return;

    setIsUpdating(true);

    try {
      const payload: Record<string, string | string[]> = {
        contactEmail: formData.contactEmail,
        contactFirstName: formData.contactFirstName,
        contactLastName: formData.contactLastName,
        contactPhone: formData.contactPhone,
        secondaryFirstName: formData.secondaryFirstName,
        secondaryLastName: formData.secondaryLastName,
        secondaryEmail: formData.secondaryEmail,
        secondaryPhone: formData.secondaryPhone,
        companyName: formData.companyName,
        industry: formData.industry,
        companyLocation: formData.companyLocation,
        hostOptions: formData.hostOptions,
        hostOptionsOther: formData.hostOptionsOther,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setUpdateError(data.error || 'Failed to update account');
      } else {
        setUpdateSuccess('Account information updated successfully!');
        setFormData((prev) => ({ ...prev, password: '' }));
      }
    } catch (error) {
      console.error('Update error:', error);
      setUpdateError('An unexpected error occurred. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium mb-1">
              Main Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="contactEmail"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter new password"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Main Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactFirstName" className="block text-sm font-medium mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contactFirstName"
              value={formData.contactFirstName}
              onChange={(e) => handleInputChange('contactFirstName', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${errors.contactFirstName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.contactFirstName && <p className="text-red-500 text-sm mt-1">{errors.contactFirstName}</p>}
          </div>
          <div>
            <label htmlFor="contactLastName" className="block text-sm font-medium mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contactLastName"
              value={formData.contactLastName}
              onChange={(e) => handleInputChange('contactLastName', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${errors.contactLastName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.contactLastName && <p className="text-red-500 text-sm mt-1">{errors.contactLastName}</p>}
          </div>
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 12))}
              className={`w-full px-3 py-2 border rounded ${errors.contactPhone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="10–12 digits"
              maxLength={12}
            />
            {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Secondary Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="secondaryFirstName" className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              id="secondaryFirstName"
              value={formData.secondaryFirstName}
              onChange={(e) => handleInputChange('secondaryFirstName', e.target.value)}
              className="w-full px-3 py-2 border rounded border-gray-300"
            />
          </div>
          <div>
            <label htmlFor="secondaryLastName" className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              id="secondaryLastName"
              value={formData.secondaryLastName}
              onChange={(e) => handleInputChange('secondaryLastName', e.target.value)}
              className="w-full px-3 py-2 border rounded border-gray-300"
            />
          </div>
          <div>
            <label htmlFor="secondaryEmail" className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              id="secondaryEmail"
              value={formData.secondaryEmail}
              onChange={(e) => handleInputChange('secondaryEmail', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${errors.secondaryEmail ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.secondaryEmail && <p className="text-red-500 text-sm mt-1">{errors.secondaryEmail}</p>}
          </div>
          <div>
            <label htmlFor="secondaryPhone" className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              id="secondaryPhone"
              value={formData.secondaryPhone}
              onChange={(e) => handleInputChange('secondaryPhone', e.target.value.replace(/\D/g, '').slice(0, 12))}
              className={`w-full px-3 py-2 border rounded ${errors.secondaryPhone ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="10–12 digits"
              maxLength={12}
            />
            {errors.secondaryPhone && <p className="text-red-500 text-sm mt-1">{errors.secondaryPhone}</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium mb-1">
              Industry <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="industry"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${errors.industry ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
          </div>
          <div>
            <label htmlFor="companyLocation" className="block text-sm font-medium mb-1">
              Company Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyLocation"
              value={formData.companyLocation}
              onChange={(e) => handleInputChange('companyLocation', e.target.value)}
              className={`w-full px-3 py-2 border rounded ${errors.companyLocation ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.companyLocation && <p className="text-red-500 text-sm mt-1">{errors.companyLocation}</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">
          Outside of a tour, are you interested in working with students in any or all of these ways?{' '}
          <span className="text-gray-500 font-normal">(optional)</span>
        </h2>
        <p className="text-sm text-gray-600 mb-2">Choose all that apply.</p>
        <div className="space-y-2">
          {HOST_OPTION_LABELS.map((option) => (
            <div key={option}>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.hostOptions.includes(option)}
                    onChange={() => handleHostOptionToggle(option)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>{option}</span>
                </label>
                {option === 'Other' && formData.hostOptions.includes('Other') && (
                  <input
                    type="text"
                    value={formData.hostOptionsOther}
                    onChange={(e) => handleInputChange('hostOptionsOther', e.target.value)}
                    placeholder="Please specify (required)"
                    className={`flex-1 min-w-[200px] max-w-md px-3 py-2 border rounded text-sm ${
                      errors.hostOptionsOther ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                )}
              </div>
              {option === 'Other' && formData.hostOptions.includes('Other') && errors.hostOptionsOther && (
                <p className="text-red-500 text-sm mt-1 ml-6">{errors.hostOptionsOther}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {updateError && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{updateError}</div>
      )}
      {updateSuccess && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">{updateSuccess}</div>
      )}

      <div className="flex justify-end mt-8">
        <button
          type="submit"
          disabled={isUpdating}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Update Information'}
        </button>
      </div>
    </form>
  );
}
